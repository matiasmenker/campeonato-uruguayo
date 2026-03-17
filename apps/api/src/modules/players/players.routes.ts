import { Router } from "express";
import { playersQuerySchema, playerIdParamSchema } from "./players.contracts.js";
import { listPlayers, getPlayer } from "./players.service.js";

const playersRouter = Router();

playersRouter.get("/api/v1/players", async (request, response, next) => {
  try {
    const query = playersQuerySchema.parse(request.query);
    const result = await listPlayers(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

playersRouter.get("/api/v1/players/:id", async (request, response, next) => {
  try {
    const { id } = playerIdParamSchema.parse(request.params);
    const result = await getPlayer(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { playersRouter };
