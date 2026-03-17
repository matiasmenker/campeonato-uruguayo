import { Router } from "express";
import { refereesQuerySchema, refereeIdParamSchema } from "./referees.contracts.js";
import { listReferees, getReferee } from "./referees.service.js";

const refereesRouter = Router();

refereesRouter.get("/api/v1/referees", async (request, response, next) => {
  try {
    const query = refereesQuerySchema.parse(request.query);
    const result = await listReferees(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

refereesRouter.get("/api/v1/referees/:id", async (request, response, next) => {
  try {
    const { id } = refereeIdParamSchema.parse(request.params);
    const result = await getReferee(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { refereesRouter };
