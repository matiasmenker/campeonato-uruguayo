import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });
import express from "express";
import cors from "cors";
import { loadConfig } from "./config/index.js";
import { registerRoutes } from "./routes.js";
import { errorHandler } from "./http/middleware.js";
import { disconnectDatabase } from "./database/index.js";

const config = loadConfig();

const app = express();

app.use(express.json());
app.use(cors({ origin: config.corsOrigin }));

registerRoutes(app);

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(
    `API running on port ${config.port} [${config.nodeEnv}]`,
  );
});

function shutdown(): void {
  console.log("Shutting down...");
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
