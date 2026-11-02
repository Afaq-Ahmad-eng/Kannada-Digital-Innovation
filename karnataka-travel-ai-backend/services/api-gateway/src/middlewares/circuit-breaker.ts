import type { RequestHandler } from 'express';
import { AppError } from '@kta/service-kit';

/** Per-upstream circuit breaker: opens after N consecutive failures, half-opens after a cool-down. */
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;

  constructor(private readonly name: string, private readonly threshold = 5, private readonly coolDownMs = 10_000) {}

  private get isOpen(): boolean {
    return this.failures >= this.threshold && Date.now() - this.openedAt < this.coolDownMs;
  }

  success(): void {
    this.failures = 0;
  }

  failure(): void {
    this.failures++;
    if (this.failures >= this.threshold) this.openedAt = Date.now();
  }

  guard(): RequestHandler {
    return (_req, _res, next) =>
      this.isOpen ? next(new AppError(503, `${this.name} is temporarily unavailable`, 'UPSTREAM_UNAVAILABLE')) : next();
  }
}
