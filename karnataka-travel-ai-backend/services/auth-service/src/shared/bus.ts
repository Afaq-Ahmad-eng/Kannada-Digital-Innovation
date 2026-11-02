import { EventBus } from '@kta/kafka-events';
import { env } from '../config';
import { log } from './logger';
export const bus = new EventBus('auth-service', env.KAFKA_BROKERS.split(','), log, {
  ssl: env.KAFKA_SSL,
  username: env.KAFKA_USERNAME,
  password: env.KAFKA_PASSWORD,
  saslMechanism: env.KAFKA_SASL_MECHANISM,
  caCertBase64: env.KAFKA_CA_CERT_BASE64,
});
