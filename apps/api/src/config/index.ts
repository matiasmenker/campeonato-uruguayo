import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().int().positive().default(3000),
  nodeEnv: z
    .enum(["development", "production", "test"])
    .default("development"),
  corsOrigin: z.string().default("*"),
  databaseUrl: z.string().min(1, "DATABASE_URL is required"),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  return configSchema.parse({
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN,
    databaseUrl: process.env.DATABASE_URL,
  });
}
