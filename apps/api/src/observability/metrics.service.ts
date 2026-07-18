import { Injectable } from '@nestjs/common';

export interface MetricsSnapshot {
  requestsTotal: number;
  errorsTotal: number;
  errorRate: number;
  averageLatencyMs: number;
  activeRequests: number;
}

@Injectable()
export class MetricsService {
  private requestsTotal = 0;
  private errorsTotal = 0;
  private totalLatencyMs = 0;
  private activeRequests = 0;

  beginRequest(): void {
    this.activeRequests += 1;
  }

  recordRequest(statusCode: number, durationMs: number): void {
    this.requestsTotal += 1;
    this.totalLatencyMs += durationMs;
    if (statusCode >= 400) this.errorsTotal += 1;
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  snapshot(): MetricsSnapshot {
    return {
      requestsTotal: this.requestsTotal,
      errorsTotal: this.errorsTotal,
      errorRate: this.requestsTotal === 0 ? 0 : this.errorsTotal / this.requestsTotal,
      averageLatencyMs: this.requestsTotal === 0 ? 0 : this.totalLatencyMs / this.requestsTotal,
      activeRequests: this.activeRequests
    };
  }
}
