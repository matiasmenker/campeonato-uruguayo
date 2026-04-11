import { Router } from "express";
import { leadersQuerySchema } from "./metrics.contracts.js";
import { getLeaders } from "./metrics.service.js";

const metricsRouter = Router();

metricsRouter.get("/api/v1/metrics/leaders", async (request, response, next) => {
  try {
    const query = leadersQuerySchema.parse(request.query);
    const result = await getLeaders(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { metricsRouter };
