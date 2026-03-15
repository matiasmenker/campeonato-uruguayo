import { Router } from "express";
import { getPrisma } from "../../database/index.js";

const systemRouter = Router();

systemRouter.get("/", (_request, response) => {
  response.json({
    name: "Campeonato Uruguayo API",
    version: "1.0.0",
    status: "running",
  });
});

systemRouter.get("/health", async (_request, response, next) => {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;

    response.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export { systemRouter };
