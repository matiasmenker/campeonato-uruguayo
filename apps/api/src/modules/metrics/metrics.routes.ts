import { Router } from "express";
import { leadersQuerySchema, squadRatingsQuerySchema } from "./metrics.contracts.js";
import { getLeaders, getSquadRatings } from "./metrics.service.js";

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

metricsRouter.get("/api/v1/metrics/squad-ratings", async (request, response, next) => {
  try {
    const query = squadRatingsQuerySchema.parse(request.query);
    const ratings = await getSquadRatings(query);
    response.json({ data: ratings });
  } catch (error) {
    next(error);
  }
});

export { metricsRouter };
