import { Router } from "express";
import { statTypesQuerySchema, statTypeIdParamSchema } from "./stat-types.contracts.js";
import { listStatTypes, getStatType } from "./stat-types.service.js";

const statTypesRouter = Router();

statTypesRouter.get("/api/v1/stat-types", async (request, response, next) => {
  try {
    const query = statTypesQuerySchema.parse(request.query);
    const result = await listStatTypes(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

statTypesRouter.get("/api/v1/stat-types/:id", async (request, response, next) => {
  try {
    const { id } = statTypeIdParamSchema.parse(request.params);
    const result = await getStatType(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { statTypesRouter };
