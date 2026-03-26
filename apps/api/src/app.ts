import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { loadConfig } from "./config/index.js";
import { registerRoutes } from "./routes.js";
import { errorHandler } from "./http/middleware.js";

if (!process.env.DATABASE_URL) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: resolve(__dirname, "../../../.env") });
}

const config = loadConfig();

const app = express();

app.use(express.json());
app.use(cors({ origin: config.corsOrigin }));

registerRoutes(app);

app.use(errorHandler);

export default app;
