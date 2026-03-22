import { Router } from "express";
import { getDashboardOverview } from "./dashboard.service.js";

const dashboardRouter = Router();

dashboardRouter.get(
  "/api/v1/dashboard/overview",
  async (_request, response, next) => {
    try {
      const result = await getDashboardOverview();
      response.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export { dashboardRouter };
