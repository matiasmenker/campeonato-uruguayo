import { z } from "zod";
const configSchema = z.object({
  port: z.coerce.number().int().positive().default(3000),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  corsOrigin: z.string().default("*"),
  databaseUrl: z.string().min(1, "DATABASE_URL is required"),
  apiKey: z.string().optional(),
  rateLimitWindowMs: z.coerce.number().int().positive().default(60000),
  rateLimitMaxRequests: z.coerce.number().int().positive().default(100),
});
export type AppConfig = z.infer<typeof configSchema>;
export const loadConfig = (): AppConfig => {
  return configSchema.parse({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN,
    databaseUrl: process.env.DATABASE_URL,
    apiKey: process.env.API_KEY,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  });
};
