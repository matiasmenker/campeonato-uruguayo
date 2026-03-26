import app from "./app.js";
import { loadConfig } from "./config/index.js";
import { disconnectDatabase } from "./database/index.js";

const config = loadConfig();

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
