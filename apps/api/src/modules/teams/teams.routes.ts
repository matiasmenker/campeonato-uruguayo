import { Router } from "express";
import { teamsQuerySchema, teamIdParamSchema } from "./teams.contracts.js";
import { listTeams, getTeam } from "./teams.service.js";

const teamsRouter = Router();

teamsRouter.get("/api/v1/teams", async (request, response, next) => {
  try {
    const query = teamsQuerySchema.parse(request.query);
    const result = await listTeams(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

teamsRouter.get("/api/v1/teams/:id", async (request, response, next) => {
  try {
    const { id } = teamIdParamSchema.parse(request.params);
    const result = await getTeam(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { teamsRouter };
