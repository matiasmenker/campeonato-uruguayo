import { Router } from "express";
import { citiesQuerySchema, venuesQuerySchema, idParamSchema } from "./venues.contracts.js";
import { listCities, getCity, listVenues, getVenue } from "./venues.service.js";

const venuesRouter = Router();

venuesRouter.get("/api/v1/cities", async (request, response, next) => {
  try {
    const query = citiesQuerySchema.parse(request.query);
    const result = await listCities(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

venuesRouter.get("/api/v1/cities/:id", async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const result = await getCity(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

venuesRouter.get("/api/v1/venues", async (request, response, next) => {
  try {
    const query = venuesQuerySchema.parse(request.query);
    const result = await listVenues(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

venuesRouter.get("/api/v1/venues/:id", async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const result = await getVenue(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { venuesRouter };
