# Karnataka Travel & Cultural Experience Platform - Backend

Event-driven microservices for the Kannada Digital Innovation Hackathon 2026. TypeScript everywhere, database-per-service, Kafka-compatible backbone (Redpanda), Gemini for AI.

```
Browser ──HTTPS──▶ api-gateway ──HTTP──▶ auth · user · itinerary · alert · reroute · language-culture
                      │  (JWT introspection, rate limit, circuit breaker)        │
                      ▼                                                          ▼
                 SSE stream  ◀── itinerary-service ◀── Kafka / Redpanda ──▶ ai-itinerary-worker (Gemini + pgvector RAG + Redis semantic cache)
                                                                       └──▶ gis-transit-worker (OSRM + Western Ghats heuristics)
```

## Run it

```bash
cp .env.example .env          # set the three secrets (openssl rand -hex 32)
docker compose up --build     # first build takes a few minutes
```

On Windows PowerShell, copy the environment template with `Copy-Item .env.example .env`.
The Compose stack includes the web client at http://localhost:4173, which proxies API requests to the gateway.
Stop the stack with `docker compose down`; database data remains in Docker volumes.

### Use Upstash Redis

The auth service, alert service, and itinerary worker use Redis. For local development, leave `REDIS_URL` blank; Compose uses the local Redis container and separate logical databases for those services. To use Upstash instead, set `REDIS_URL` in the backend root `.env` to the TLS URL from Upstash, using the `rediss://` scheme (for example, `rediss://default:<password>@<endpoint>:6379`). Do not use the `redis-cli --tls` command itself as the application URL. The Redis clients use TLS automatically for `rediss://` URLs.

After changing the URL, recreate the Redis clients:

```powershell
docker compose up -d --force-recreate auth-service alert-service ai-itinerary-worker
```

Verify the connection without printing credentials:

```powershell
docker compose exec -T auth-service node -e "const Redis=require('ioredis');const r=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1});r.ping().then(x=>console.log('Redis PING:',x)).catch(e=>{console.error('Redis test failed:',e.message);process.exitCode=1}).finally(()=>r.disconnect())"
docker compose exec -T alert-service node -e "const Redis=require('ioredis');const r=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1});r.ping().then(x=>console.log('Redis PING:',x)).catch(e=>{console.error('Redis test failed:',e.message);process.exitCode=1}).finally(()=>r.disconnect())"
docker compose exec -T ai-itinerary-worker node -e "const Redis=require('ioredis');const r=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1});r.ping().then(x=>console.log('Redis PING:',x)).catch(e=>{console.error('Redis test failed:',e.message);process.exitCode=1}).finally(()=>r.disconnect())"
```

Keep the Upstash URL private and only in the backend `.env` or your deployment secret store. The three services share the same Upstash database, so retain the app's existing key prefixes and avoid manually flushing the database.

### Use Aiven Kafka

The event bus supports plain local Kafka/Redpanda and managed Kafka over TLS with SASL. For Aiven, copy the broker host and port, service username, password, and SASL mechanism from the Aiven service's connection information into the backend root `.env`:

```dotenv
KAFKA_BROKER=<AIVEN_BROKER_HOST>:<PORT>
KAFKA_SSL=true
KAFKA_USERNAME=<AIVEN_SERVICE_USERNAME>
KAFKA_PASSWORD=<AIVEN_SERVICE_PASSWORD>
KAFKA_SASL_MECHANISM=scram-sha-256
KAFKA_CA_CERT_BASE64=<BASE64_OF_AIVEN_PROJECT_CA_PEM>
```

Use the SASL mechanism shown by Aiven for that service; common choices are `scram-sha-256` and `scram-sha-512`. Download the project CA certificate from the Kafka service's **Overview → Connection information → CA Certificate**. On Windows, encode the downloaded PEM as one line with:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('.\ca.pem'))
```

Set that output as `KAFKA_CA_CERT_BASE64` in `.env`. This keeps TLS certificate verification enabled; do not disable certificate validation to work around a CA error. Alternatively, if Aiven's `letsencrypt_sasl` option is enabled and the broker presents a publicly trusted certificate, leave `KAFKA_CA_CERT_BASE64` blank.

`KAFKA_BROKERS` can be used instead of `KAFKA_BROKER` if you have multiple comma-separated broker endpoints. The gateway and all event-producing/consuming services receive the shared Kafka configuration. Recreate the services after changing the settings:

```powershell
docker compose up -d --force-recreate api-gateway auth-service user-service itinerary-service alert-service reroute-service admin-service ai-itinerary-worker gis-transit-worker
```

To confirm TLS/SASL authentication and Kafka metadata access without publishing an application event or printing credentials, see the `Kafka verification` section below. The event bus creates its declared topics on startup, so the Aiven user must have the Kafka ACLs required to create/describe those topics, produce messages, and consume them. Keep credentials server-side and out of source control.

#### Kafka verification

Run this from the backend folder to check the configured broker's cluster metadata. It reports only success/failure details, never credentials:

```powershell
docker compose exec -T auth-service node -e "const {Kafka}=require('kafkajs');const ca=process.env.KAFKA_CA_CERT_BASE64;const ssl=ca?{ca:Buffer.from(ca,'base64'),rejectUnauthorized:true}:process.env.KAFKA_SSL==='true';const k=new Kafka({clientId:'kta-connectivity-check',brokers:process.env.KAFKA_BROKERS.split(','),ssl,sasl:process.env.KAFKA_USERNAME?{mechanism:process.env.KAFKA_SASL_MECHANISM,username:process.env.KAFKA_USERNAME,password:process.env.KAFKA_PASSWORD}:undefined});const a=k.admin();a.connect().then(()=>a.describeCluster()).then(c=>console.log('Kafka connected; brokers:',c.brokers.length)).catch(e=>{console.error('Kafka connection failed:',e.name,e.code||'');process.exitCode=1}).finally(()=>a.disconnect().catch(()=>{}))"
```

| What | URL |
|---|---|
| Web client | http://localhost:4173 |
| API gateway (the only app entrypoint) | http://localhost:8080 |
| Jaeger traces | http://localhost:16686 |
| Prometheus | http://localhost:9090 |
| Grafana (admin / `GRAFANA_PASSWORD`) | http://localhost:3001 (Prometheus + Jaeger datasources pre-provisioned) |

**Demo mode:** with `GEMINI_API_KEY` blank everything still works end to end - itineraries come from a deterministic template planner (labelled `source: TEMPLATE`), embeddings are hashed locally, alerts return "no disruption", and notifications are dry-run logs. Use `POST /api/v1/alerts/simulate` (enabled by `ENABLE_DEMO_ENDPOINTS=true`) to trigger a disruption + reroute proposal on your own trip.
If you add a Gemini key later, run once with `RESEED_KNOWLEDGE=true` for the culture service and `TRUNCATE rag_docs` in `rag_db` so stored vectors match the new embedding model.

## Services

| Service | Port (internal) | Owns | Key endpoints |
|---|---|---|---|
| api-gateway | 3000 → host 8080 | - | proxy, `/health`, `/metrics` |
| auth-service | 3000 | `auth_db` (credentials), Redis (refresh/blocklist) | `POST /api/v1/auth/login` `refresh-token` `logout` `verify-token` (internal) |
| user-service | 3000 | `user_db` | `POST /api/v1/users/register`, `GET /me`, `PUT /me/preferences` |
| itinerary-service | 3000 | `itinerary_db` | `POST /api/v1/itineraries/generate` (202), `GET /`, `GET /:id`, `PUT /:id/reorder`, `GET /stream` (SSE) |
| alert-service | 3000 | `alert_db`, Redis | `POST /api/v1/alerts/check-status` (admin), `/dispatch-notification` (admin), `GET /mine`, `POST /simulate` (demo) |
| reroute-service | 3000 | `reroute_db` | `GET /api/v1/reroute/alternatives/:tripId`, `POST /modify-active-trip` |
| language-culture-service | 3000 | `culture_db` (pgvector) | `POST /api/v1/language/translate-voice` (multipart), `/cultural-guide` |
| ai-itinerary-worker | metrics 9100 | `rag_db` (pgvector), Redis semantic cache | consumes `trip.requested` |
| gis-transit-worker | metrics 9100 | - | consumes `itinerary.generated`, `itinerary.rerouted` |

Packages: `@kta/logger` (Pino), `@kta/shared-types` (zod schemas, destination catalog, Karnataka knowledge seed), `@kta/kafka-events` (topic contracts + typed EventBus with retry and DLQ), `@kta/service-kit` (env validation, error handling, metrics, tracing, Gemini client, pg/redis helpers).

## Event flow

1. `POST /itineraries/generate` stores `PENDING`, publishes **trip.requested**, returns **202 + tripId**.
2. ai-itinerary-worker emits **itinerary.progress** (streamed to the browser), checks the semantic cache, retrieves RAG context, calls Gemini with a strict JSON schema, then emits **itinerary.generated**.
3. itinerary-service persists the plan; gis-transit-worker adds OSRM drive times (**itinerary.legs-computed**).
4. alert-service scans active trips on a cron (Gemini + Google Search grounding), emits **itinerary.disrupted** and notifies via email / WhatsApp.
5. reroute-service proposes alternatives (**reroute.proposed**); the traveller accepts with one click → **itinerary.rerouted** → itinerary-service applies it and the delta arrives over SSE.

Cross-service data travels in events (event-carried state); there are no cross-service SQL joins.

## Design decisions worth knowing

- **Credentials:** user-service hashes passwords with Argon2id and publishes a separate `auth.credential-provisioned` event consumed only by auth-service; registration is therefore eventually consistent (the web client retries login briefly). Lock topic ACLs in production.
- **Tokens:** 15-minute access JWT; rotating refresh token in an `HttpOnly; SameSite=Strict` cookie scoped to `/api/v1/auth`, with reuse detection (10 s grace for parallel tabs). Logout blocklists the access token's `jti`.
- **Gateway → services:** gateway verifies the JWT via auth-service introspection (5 s cache), strips client-supplied identity headers, and adds `x-user-*` + a shared `x-internal-key`; services reject requests without the key.
- **Semantic cache:** exact-match "bucket" on origin / destinations / days / budget / pace / diet / travellers, then cosine similarity > 0.95 on the parameter embedding. Brute-force scan of ≤100 vectors per bucket - move to RediSearch vectors at scale.
- **Gemini:** itineraries use `responseSchema` structured output; alert checks use Google Search grounding (cannot be combined with a schema, so JSON is parsed and validated defensively). Model names are configurable; confirm current names in Google's docs.
- **Western Ghats timing:** OSRM durations get a 1.3× slowdown inside hand-picked ghat zones. It is a heuristic, not live road-condition data.

## Known gaps / next steps

- Gateway speaks HTTP/1.1 to services; gRPC/HTTP-2 translation, TLS termination and WAF belong to your ingress (Kong / nginx / cloud LB).
- Voice returns audio as base64 JSON, not a chunked stream. The OSRM URL defaults to the public demo server - run your own for real traffic.
- The knowledge base is a small seed corpus; replace it with verified content. Temple-specific rules change, so answers tell visitors to check posted notices.
- No lockfile is included (generated offline); run `npm install` once and commit it. Images build dev dependencies too - slim them for production.
- Not yet covered: automated tests, Grafana dashboards (datasources only), Kubernetes manifests, the "reviews / social / bookings" extension services (the event backbone is ready for them).
