import { Router } from "express";
import { standingsQuerySchema, standingIdParamSchema } from "./standings.contracts.js";
import { listStandings, getStanding } from "./standings.service.js";

const standingsRouter = Router();

standingsRouter.get("/api/v1/standings", async (request, response, next) => {
  try {
    const query = standingsQuerySchema.parse(request.query);
    const result = await listStandings(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

standingsRouter.get("/api/v1/standings/:id", async (request, response, next) => {
  try {
    const { id } = standingIdParamSchema.parse(request.params);
    const result = await getStanding(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { standingsRouter };
