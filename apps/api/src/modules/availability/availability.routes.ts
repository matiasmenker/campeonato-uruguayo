import { Router } from "express";
import {
  playerIdParamSchema,
  marketValuesQuerySchema,
  injuriesQuerySchema,
  suspensionsQuerySchema,
} from "./availability.contracts.js";
import {
  listMarketValues,
  listPlayerMarketValues,
  listInjuries,
  listPlayerInjuries,
  listSuspensions,
  listPlayerSuspensions,
} from "./availability.service.js";

const availabilityRouter = Router();

availabilityRouter.get(
  "/api/v1/player-market-values",
  async (request, response, next) => {
    try {
      const query = marketValuesQuerySchema.parse(request.query);
      const result = await listMarketValues(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

availabilityRouter.get(
  "/api/v1/players/:id/market-values",
  async (request, response, next) => {
    try {
      const { id } = playerIdParamSchema.parse(request.params);
      const query = marketValuesQuerySchema.parse(request.query);
      const result = await listPlayerMarketValues(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

availabilityRouter.get(
  "/api/v1/injuries",
  async (request, response, next) => {
    try {
      const query = injuriesQuerySchema.parse(request.query);
      const result = await listInjuries(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

availabilityRouter.get(
  "/api/v1/players/:id/injuries",
  async (request, response, next) => {
    try {
      const { id } = playerIdParamSchema.parse(request.params);
      const query = injuriesQuerySchema.parse(request.query);
      const result = await listPlayerInjuries(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

availabilityRouter.get(
  "/api/v1/suspensions",
  async (request, response, next) => {
    try {
      const query = suspensionsQuerySchema.parse(request.query);
      const result = await listSuspensions(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

availabilityRouter.get(
  "/api/v1/players/:id/suspensions",
  async (request, response, next) => {
    try {
      const { id } = playerIdParamSchema.parse(request.params);
      const query = suspensionsQuerySchema.parse(request.query);
      const result = await listPlayerSuspensions(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export { availabilityRouter };
