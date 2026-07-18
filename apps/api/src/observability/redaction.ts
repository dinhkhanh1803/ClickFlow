const SENSITIVE_KEY = /(authorization|cookie|password|secret|token|email|phone|ipaddress|apikey)/i;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key.replaceAll(/[^a-z0-9]/gi, ''));
}

export function redactSensitive(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, seen));

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : redactSensitive(item, seen)
    ])
  );
}
