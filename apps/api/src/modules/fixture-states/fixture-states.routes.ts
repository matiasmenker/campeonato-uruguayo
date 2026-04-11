import { Router } from "express";
import { fixtureStatesQuerySchema, fixtureStateIdParamSchema } from "./fixture-states.contracts.js";
import { listFixtureStates, getFixtureState } from "./fixture-states.service.js";

const fixtureStatesRouter = Router();

fixtureStatesRouter.get("/api/v1/fixture-states", async (request, response, next) => {
  try {
    const query = fixtureStatesQuerySchema.parse(request.query);
    const result = await listFixtureStates(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

fixtureStatesRouter.get("/api/v1/fixture-states/:id", async (request, response, next) => {
  try {
    const { id } = fixtureStateIdParamSchema.parse(request.params);
    const result = await getFixtureState(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { fixtureStatesRouter };
