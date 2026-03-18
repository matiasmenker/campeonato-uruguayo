import { Router } from "express";
import {
  squadMembershipsQuerySchema,
  squadMembershipIdParamSchema,
  teamSquadParamSchema,
  teamSquadQuerySchema,
} from "./squad-memberships.contracts.js";
import {
  listSquadMemberships,
  getSquadMembership,
  getTeamSquad,
} from "./squad-memberships.service.js";

const squadMembershipsRouter = Router();

squadMembershipsRouter.get(
  "/api/v1/squad-memberships",
  async (request, response, next) => {
    try {
      const query = squadMembershipsQuerySchema.parse(request.query);
      const result = await listSquadMemberships(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

squadMembershipsRouter.get(
  "/api/v1/squad-memberships/:id",
  async (request, response, next) => {
    try {
      const { id } = squadMembershipIdParamSchema.parse(request.params);
      const result = await getSquadMembership(id);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

squadMembershipsRouter.get(
  "/api/v1/teams/:id/squad",
  async (request, response, next) => {
    try {
      const { id } = teamSquadParamSchema.parse(request.params);
      const query = teamSquadQuerySchema.parse(request.query);
      const result = await getTeamSquad(id, query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export { squadMembershipsRouter };
