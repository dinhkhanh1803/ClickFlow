import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3001),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  DATABASE_URL: z.string().url().optional(),
  QUERY_TIMEOUT_MS: z.coerce.number().int().min(100).max(60_000).default(10_000),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  JWT_REFRESH_EXPIRES_IN_SECONDS: z.coerce.number().int().min(300).max(31_536_000).default(604_800),
  PASSWORD_RESET_EXPIRES_IN_SECONDS: z.coerce.number().int().min(300).max(86_400).default(1_800),
  AUTH_RATE_LIMIT: z.coerce.number().int().min(1).max(100).default(5),
  API_RATE_LIMIT: z.coerce.number().int().min(10).max(100_000).default(300),
  API_RATE_WINDOW_MS: z.coerce.number().int().min(1_000).max(86_400_000).default(60_000),
  AUTH_RATE_WINDOW_MS: z.coerce.number().int().min(1_000).max(86_400_000).default(900_000)
}).superRefine((value, context) => {
  if (value.NODE_ENV === 'staging' || value.NODE_ENV === 'production') {
    if (!value.DATABASE_URL) context.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: `Required in ${value.NODE_ENV}` });
  }
  if (value.NODE_ENV === 'production') {
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (!value[key]) context.addIssue({ code: 'custom', path: [key], message: 'Required in production' });
    }
  }
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const result = environmentSchema.safeParse(source);
  if (!result.success) throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  return result.data;
}

export function parseCorsOrigins(value: string): string[] {
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}
