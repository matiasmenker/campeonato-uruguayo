import { Router } from "express";
import {
  coachesQuerySchema,
  coachIdParamSchema,
  teamCoachesParamSchema,
} from "./coaches.contracts.js";
import { listCoaches, getCoach, listTeamCoaches } from "./coaches.service.js";

const coachesRouter = Router();

coachesRouter.get("/api/v1/coaches", async (request, response, next) => {
  try {
    const query = coachesQuerySchema.parse(request.query);
    const result = await listCoaches(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

coachesRouter.get("/api/v1/coaches/:id", async (request, response, next) => {
  try {
    const { id } = coachIdParamSchema.parse(request.params);
    const result = await getCoach(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

coachesRouter.get("/api/v1/teams/:id/coaches", async (request, response, next) => {
  try {
    const { id } = teamCoachesParamSchema.parse(request.params);
    const result = await listTeamCoaches(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { coachesRouter };
