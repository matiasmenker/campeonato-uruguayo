import { Router } from "express";
import { countriesQuerySchema, countryIdParamSchema } from "./countries.contracts.js";
import { listCountries, getCountry } from "./countries.service.js";

const countriesRouter = Router();

countriesRouter.get("/api/v1/countries", async (request, response, next) => {
  try {
    const query = countriesQuerySchema.parse(request.query);
    const result = await listCountries(query);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

countriesRouter.get("/api/v1/countries/:id", async (request, response, next) => {
  try {
    const { id } = countryIdParamSchema.parse(request.params);
    const result = await getCountry(id);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

export { countriesRouter };
