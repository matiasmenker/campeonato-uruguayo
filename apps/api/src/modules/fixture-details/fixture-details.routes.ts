import { Router } from "express";
import {
  fixtureIdParamSchema,
  changeLogsQuerySchema,
  eventsQuerySchema,
  lineupsQuerySchema,
  fixturePlayerStatsQuerySchema,
  fixtureTeamStatsQuerySchema,
} from "./fixture-details.contracts.js";
import {
  listChangeLogs,
  listFixtureChangeLogs,
  listEvents,
  listFixtureEvents,
  listLineups,
  listFixtureLineups,
  listFixturePlayerStats,
  listFixturePlayerStatsByFixture,
  listFixtureTeamStats,
  listFixtureTeamStatsByFixture,
} from "./fixture-details.service.js";

const fixtureDetailsRouter = Router();

fixtureDetailsRouter.get(
  "/api/v1/fixture-change-logs",
  async (request, response, next) => {
    try {
      const query = changeLogsQuerySchema.parse(request.query);
      const result = await listChangeLogs(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/fixtures/:id/change-logs",
  async (request, response, next) => {
    try {
      const { id } = fixtureIdParamSchema.parse(request.params);
      const query = changeLogsQuerySchema.parse(request.query);
      const result = await listFixtureChangeLogs(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/events",
  async (request, response, next) => {
    try {
      const query = eventsQuerySchema.parse(request.query);
      const result = await listEvents(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/fixtures/:id/events",
  async (request, response, next) => {
    try {
      const { id } = fixtureIdParamSchema.parse(request.params);
      const query = eventsQuerySchema.parse(request.query);
      const result = await listFixtureEvents(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/lineups",
  async (request, response, next) => {
    try {
      const query = lineupsQuerySchema.parse(request.query);
      const result = await listLineups(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/fixtures/:id/lineups",
  async (request, response, next) => {
    try {
      const { id } = fixtureIdParamSchema.parse(request.params);
      const query = lineupsQuerySchema.parse(request.query);
      const result = await listFixtureLineups(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/fixture-player-statistics",
  async (request, response, next) => {
    try {
      const query = fixturePlayerStatsQuerySchema.parse(request.query);
      const result = await listFixturePlayerStats(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/fixtures/:id/player-statistics",
  async (request, response, next) => {
    try {
      const { id } = fixtureIdParamSchema.parse(request.params);
      const query = fixturePlayerStatsQuerySchema.parse(request.query);
      const result = await listFixturePlayerStatsByFixture(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/fixture-team-statistics",
  async (request, response, next) => {
    try {
      const query = fixtureTeamStatsQuerySchema.parse(request.query);
      const result = await listFixtureTeamStats(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

fixtureDetailsRouter.get(
  "/api/v1/fixtures/:id/team-statistics",
  async (request, response, next) => {
    try {
      const { id } = fixtureIdParamSchema.parse(request.params);
      const query = fixtureTeamStatsQuerySchema.parse(request.query);
      const result = await listFixtureTeamStatsByFixture(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export { fixtureDetailsRouter };
