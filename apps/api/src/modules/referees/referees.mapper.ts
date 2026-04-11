import type { Referee } from "db";
import type { RefereeContract, RefereeSummary } from "./referees.contracts.js";
export const toRefereeContract = (referee: Referee): RefereeContract => {
  return {
    id: referee.id,
    sportmonksId: referee.sportmonksId,
    name: referee.name,
    imagePath: referee.imagePath,
    createdAt: referee.createdAt.toISOString(),
    updatedAt: referee.updatedAt.toISOString(),
  };
};
export const toRefereeSummary = (referee: Referee): RefereeSummary => {
  return {
    id: referee.id,
    name: referee.name,
  };
};
