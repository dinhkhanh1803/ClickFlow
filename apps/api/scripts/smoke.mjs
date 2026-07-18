const base = process.env.SMOKE_BASE_URL;
if (!base) throw new Error('SMOKE_BASE_URL is required');
for (const path of ['/api/v1/health/live', '/api/v1/health/ready']) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
}
process.stdout.write('ClickFlow API smoke checks passed\n');
