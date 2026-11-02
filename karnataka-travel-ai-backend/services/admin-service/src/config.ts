import { commonEnv, loadEnv, z } from '@kta/service-kit';

export const env = loadEnv({
  ...commonEnv,
  DATABASE_URL: z.string().min(1),
  // Internal URLs (docker-compose DNS names by default); override for other topologies.
  ALERT_SERVICE_URL: z.string().url().default('http://alert-service:3000'),
  GATEWAY_URL: z.string().url().default('http://api-gateway:3000'),
  HEALTH_TARGETS: z.string().default(
    [
      'api-gateway=http://api-gateway:3000',
      'auth-service=http://auth-service:3000',
      'user-service=http://user-service:3000',
      'itinerary-service=http://itinerary-service:3000',
      'alert-service=http://alert-service:3000',
      'reroute-service=http://reroute-service:3000',
      'language-culture-service=http://language-culture-service:3000',
      'ai-itinerary-worker=http://ai-itinerary-worker:9100',
      'gis-transit-worker=http://gis-transit-worker:9100',
    ].join(','),
  ),
});
