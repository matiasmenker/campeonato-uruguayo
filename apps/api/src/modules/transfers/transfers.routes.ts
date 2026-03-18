import { Router } from "express";
import { transfersQuerySchema, transferIdParamSchema } from "./transfers.contracts.js";
import { listTransfers, getTransfer } from "./transfers.service.js";

const transfersRouter = Router();

transfersRouter.get("/api/v1/transfers", async (request, response, next) => {
  try {
    const query = transfersQuerySchema.parse(request.query);
    const result = await listTransfers(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

transfersRouter.get("/api/v1/transfers/:id", async (request, response, next) => {
  try {
    const { id } = transferIdParamSchema.parse(request.params);
    const result = await getTransfer(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { transfersRouter };
