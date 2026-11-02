/* OpenTelemetry bootstrap. Import first (side-effect) from each service entrypoint:
 *   import '@kta/service-kit/dist/tracing';
 * Enabled with OTEL_ENABLED=true; configure via standard OTEL_* env vars (OTEL_SERVICE_NAME, OTEL_EXPORTER_OTLP_ENDPOINT). */
if (process.env.OTEL_ENABLED === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  const sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } })],
  });
  sdk.start();
  process.on('SIGTERM', () => {
    sdk.shutdown().catch(() => undefined);
  });
}
export {};
