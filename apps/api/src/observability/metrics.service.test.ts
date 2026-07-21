import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('tracks request count, latency, error rate and active requests', () => {
    const metrics = new MetricsService();
    metrics.beginRequest();
    metrics.recordRequest(200, 20);
    metrics.beginRequest();
    metrics.recordRequest(500, 40);

    expect(metrics.snapshot()).toEqual({
      requestsTotal: 2,
      errorsTotal: 1,
      errorRate: 0.5,
      averageLatencyMs: 30,
      activeRequests: 0
    });
  });
});
