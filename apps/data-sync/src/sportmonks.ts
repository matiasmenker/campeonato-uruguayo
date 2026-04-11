import { createSportMonksClient } from "sportmonks-client";
export type SportMonksClient = ReturnType<typeof createSportMonksClient>;
export const createClient = (apiToken: string): SportMonksClient => {
  return createSportMonksClient({ apiToken });
};
