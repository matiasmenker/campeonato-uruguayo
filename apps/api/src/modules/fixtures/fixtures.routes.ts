import { Router } from "express";
import { fixturesQuerySchema, fixtureIdParamSchema } from "./fixtures.contracts.js";
import { listFixtures, getFixture } from "./fixtures.service.js";

const fixturesRouter = Router();

fixturesRouter.get("/api/v1/fixtures", async (request, response, next) => {
  try {
    const query = fixturesQuerySchema.parse(request.query);
    const result = await listFixtures(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

fixturesRouter.get("/api/v1/fixtures/:id", async (request, response, next) => {
  try {
    const { id } = fixtureIdParamSchema.parse(request.params);
    const result = await getFixture(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { fixturesRouter };
