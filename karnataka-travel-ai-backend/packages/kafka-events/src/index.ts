import { randomUUID } from 'crypto';
import { Consumer, Kafka, Producer, SASLOptions, logLevel } from 'kafkajs';
import { z } from 'zod';
import type { Logger } from '@kta/logger';
import { ContactChannel, DaySchema, PlanSchema, Role, TripParamsSchema } from '@kta/shared-types';

const iso = z.string();

/** Topic contracts: topic name -> payload schema. */
export const EventSchemas = {
  'user.registered': z.object({ userId: z.string(), email: z.string(), fullName: z.string(), phone: z.string().nullish(), contactChannels: z.array(ContactChannel), createdAt: iso }),
  'user.preferences-updated': z.object({ userId: z.string(), contactChannels: z.array(ContactChannel) }),
  'auth.credential-provisioned': z.object({ userId: z.string(), email: z.string(), passwordHash: z.string(), role: Role }),
  'trip.requested': z.object({ tripId: z.string(), userId: z.string(), params: TripParamsSchema }),
  'itinerary.progress': z.object({ tripId: z.string(), userId: z.string(), stage: z.string(), percent: z.number(), message: z.string() }),
  'itinerary.generated': z.object({ tripId: z.string(), userId: z.string(), plan: PlanSchema, source: z.enum(['LLM', 'CACHE', 'TEMPLATE']) }),
  'itinerary.legs-computed': z.object({
    tripId: z.string(),
    userId: z.string(),
    legs: z.array(z.object({ dayNumber: z.number(), position: z.number(), distanceKm: z.number(), durationMin: z.number(), ghat: z.boolean() })),
  }),
  'itinerary.disrupted': z.object({
    tripId: z.string(), userId: z.string(), region: z.string(), severity: z.enum(['HIGH', 'CRITICAL']),
    category: z.string(), headline: z.string(), details: z.string(), detectedAt: iso,
    sources: z.array(z.object({ title: z.string(), uri: z.string() })).default([]),
  }),
  'reroute.proposed': z.object({ tripId: z.string(), userId: z.string(), proposalId: z.string(), summary: z.string(), reason: z.string(), changedDays: z.array(DaySchema) }),
  'itinerary.rerouted': z.object({
    tripId: z.string(), userId: z.string(), proposalId: z.string(), reason: z.string(),
    origin: z.enum(['REROUTE', 'USER_REORDER']), changedDays: z.array(DaySchema),
  }),
  'trip.completed': z.object({ tripId: z.string(), userId: z.string(), completedAt: iso }),
  'admin.user-status-changed': z.object({ userId: z.string(), disabled: z.boolean(), reason: z.string().nullish(), actorId: z.string() }),
} as const;

export type TopicName = keyof typeof EventSchemas;
export type Payload<K extends TopicName> = z.infer<(typeof EventSchemas)[K]>;

export const Topics = {
  UserRegistered: 'user.registered',
  UserPreferencesUpdated: 'user.preferences-updated',
  CredentialProvisioned: 'auth.credential-provisioned',
  TripRequested: 'trip.requested',
  ItineraryProgress: 'itinerary.progress',
  ItineraryGenerated: 'itinerary.generated',
  RouteLegsComputed: 'itinerary.legs-computed',
  ItineraryDisrupted: 'itinerary.disrupted',
  RerouteProposed: 'reroute.proposed',
  ItineraryRerouted: 'itinerary.rerouted',
  TripCompleted: 'trip.completed',
  AdminUserStatusChanged: 'admin.user-status-changed',
} as const satisfies Record<string, TopicName>;

export type Handlers = { [K in TopicName]?: (payload: Payload<K>) => Promise<void> };

const ALL_TOPICS = Object.keys(EventSchemas) as TopicName[];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface KafkaConnectionOptions {
  ssl: boolean;
  username?: string;
  password?: string;
  saslMechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
  caCertBase64?: string;
}

export class EventBus {
  private readonly kafka: Kafka;
  private producer?: Producer;
  private readonly consumers: Consumer[] = [];
  private topicsReady = false;

  constructor(clientId: string, brokers: string[], private readonly log: Logger, connection: KafkaConnectionOptions) {
    const { username, password, saslMechanism } = connection;
    if (Boolean(username) !== Boolean(password)) {
      throw new Error('KAFKA_USERNAME and KAFKA_PASSWORD must both be configured for SASL authentication.');
    }

    let sasl: SASLOptions | undefined;
    if (username && password) {
      switch (saslMechanism) {
        case 'plain':
          sasl = { mechanism: 'plain', username, password };
          break;
        case 'scram-sha-256':
          sasl = { mechanism: 'scram-sha-256', username, password };
          break;
        case 'scram-sha-512':
          sasl = { mechanism: 'scram-sha-512', username, password };
          break;
      }
    }

    let ssl: boolean | { ca: Buffer; rejectUnauthorized: true } = connection.ssl;
    if (connection.caCertBase64) {
      const ca = Buffer.from(connection.caCertBase64, 'base64');
      if (!ca.toString('utf8').includes('-----BEGIN CERTIFICATE-----')) {
        throw new Error('KAFKA_CA_CERT_BASE64 must contain a base64-encoded PEM certificate bundle.');
      }
      ssl = { ca, rejectUnauthorized: true };
    }

    this.kafka = new Kafka({
      clientId,
      brokers,
      ssl,
      sasl,
      logLevel: logLevel.WARN,
      retry: { retries: 10, initialRetryTime: 300 },
    });
  }

  /** Idempotently create every contract topic (+ a .dlq twin) so consumers never race topic creation. */
  private async ensureTopics(): Promise<void> {
    if (this.topicsReady) return;
    const admin = this.kafka.admin();
    await admin.connect();
    try {
      const replicationFactor = Number(process.env.KAFKA_REPLICATION ?? 1);
      const numPartitions = Number(process.env.KAFKA_PARTITIONS ?? 3);
      await admin.createTopics({
        waitForLeaders: true,
        topics: ALL_TOPICS.flatMap((t) => [t, `${t}.dlq`]).map((topic) => ({ topic, numPartitions, replicationFactor })),
      });
      this.topicsReady = true;
    } finally {
      await admin.disconnect();
    }
  }

  async connectProducer(): Promise<void> {
    if (this.producer) return;
    await this.ensureTopics();
    const p = this.kafka.producer({ allowAutoTopicCreation: false });
    await p.connect();
    this.producer = p;
  }

  async publish<K extends TopicName>(topic: K, payload: Payload<K>, key?: string): Promise<void> {
    EventSchemas[topic].parse(payload);
    await this.connectProducer();
    await this.producer!.send({
      topic,
      acks: -1,
      messages: [{ key, value: JSON.stringify({ id: randomUUID(), occurredAt: new Date().toISOString(), payload }) }],
    });
  }

  /** Subscribe with a typed handler per topic. Failed messages retry 3x, then land on `<topic>.dlq`. */
  async subscribe(groupId: string, handlers: Handlers, opts: { concurrency?: number; fromBeginning?: boolean } = {}): Promise<void> {
    await this.connectProducer();
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    const topics = Object.keys(handlers) as TopicName[];
    for (const topic of topics) await consumer.subscribe({ topic, fromBeginning: opts.fromBeginning ?? false });
    await consumer.run({
      partitionsConsumedConcurrently: opts.concurrency ?? 1,
      eachMessage: async ({ topic, message }) => {
        const handler = handlers[topic as TopicName] as ((p: unknown) => Promise<void>) | undefined;
        if (!handler || !message.value) return;
        const raw = message.value.toString();
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const envelope = JSON.parse(raw) as { payload: unknown };
            const payload = EventSchemas[topic as TopicName].parse(envelope.payload);
            await handler(payload);
            return;
          } catch (err) {
            this.log.warn({ err, topic, attempt, groupId }, 'event handler failed');
            if (attempt < 3) await sleep(500 * attempt);
          }
        }
        await this.producer!.send({ topic: `${topic}.dlq`, messages: [{ key: message.key, value: raw }] }).catch((err) =>
          this.log.error({ err, topic }, 'failed to write to DLQ'),
        );
      },
    });
    this.consumers.push(consumer);
    this.log.info({ groupId, topics }, 'subscribed');
  }

  async close(): Promise<void> {
    await Promise.allSettled(this.consumers.map((c) => c.disconnect()));
    await this.producer?.disconnect().catch(() => undefined);
  }
}
