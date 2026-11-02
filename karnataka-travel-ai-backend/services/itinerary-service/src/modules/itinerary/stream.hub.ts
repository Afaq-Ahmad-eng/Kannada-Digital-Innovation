import type { Response } from 'express';

/** Per-instance registry of open SSE connections, keyed by user. */
class StreamHub {
  private readonly clients = new Map<string, Set<Response>>();

  add(userId: string, res: Response): void {
    if (!this.clients.has(userId)) this.clients.set(userId, new Set());
    this.clients.get(userId)!.add(res);
  }

  remove(userId: string, res: Response): void {
    const set = this.clients.get(userId);
    set?.delete(res);
    if (set && set.size === 0) this.clients.delete(userId);
  }

  send(userId: string, event: string, data: unknown): void {
    const set = this.clients.get(userId);
    if (!set) return;
    const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of set) res.write(frame);
  }

  get connections(): number {
    return [...this.clients.values()].reduce((n, s) => n + s.size, 0);
  }
}

export const streamHub = new StreamHub();
