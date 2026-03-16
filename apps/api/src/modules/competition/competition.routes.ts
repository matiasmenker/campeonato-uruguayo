import { Router } from "express";
import {
  leaguesQuerySchema,
  seasonsQuerySchema,
  stagesQuerySchema,
  roundsQuerySchema,
  groupsQuerySchema,
  idParamSchema,
} from "./competition.contracts.js";
import {
  listLeagues,
  getLeague,
  listSeasons,
  getSeason,
  listStages,
  getStage,
  listRounds,
  getRound,
  listGroups,
  getGroup,
  getCurrentCompetition,
} from "./competition.service.js";

const competitionRouter = Router();

// --- Leagues ---

competitionRouter.get("/api/v1/leagues", async (request, response, next) => {
  try {
    const query = leaguesQuerySchema.parse(request.query);
    const result = await listLeagues(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

competitionRouter.get("/api/v1/leagues/:id", async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const result = await getLeague(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

// --- Seasons ---

competitionRouter.get("/api/v1/seasons", async (request, response, next) => {
  try {
    const query = seasonsQuerySchema.parse(request.query);
    const result = await listSeasons(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

competitionRouter.get("/api/v1/seasons/:id", async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const result = await getSeason(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

// --- Stages ---

competitionRouter.get("/api/v1/stages", async (request, response, next) => {
  try {
    const query = stagesQuerySchema.parse(request.query);
    const result = await listStages(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

competitionRouter.get("/api/v1/stages/:id", async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const result = await getStage(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

// --- Rounds ---

competitionRouter.get("/api/v1/rounds", async (request, response, next) => {
  try {
    const query = roundsQuerySchema.parse(request.query);
    const result = await listRounds(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

competitionRouter.get("/api/v1/rounds/:id", async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const result = await getRound(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

// --- Groups ---

competitionRouter.get("/api/v1/groups", async (request, response, next) => {
  try {
    const query = groupsQuerySchema.parse(request.query);
    const result = await listGroups(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

competitionRouter.get("/api/v1/groups/:id", async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const result = await getGroup(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

// --- Current Competition ---

competitionRouter.get("/api/v1/competition/current", async (_request, response, next) => {
  try {
    const result = await getCurrentCompetition();
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { competitionRouter };
