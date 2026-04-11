import type { StatType } from "db";
import type { StatTypeContract, StatTypeSummary } from "./stat-types.contracts.js";
export const toStatTypeContract = (statType: StatType): StatTypeContract => {
  return {
    id: statType.id,
    name: statType.name,
    developerName: statType.developerName,
    modelType: statType.modelType,
    statGroup: statType.statGroup,
    createdAt: statType.createdAt.toISOString(),
    updatedAt: statType.updatedAt.toISOString(),
  };
};
export const toStatTypeSummary = (statType: StatType): StatTypeSummary => {
  return {
    id: statType.id,
    name: statType.name,
    developerName: statType.developerName,
  };
};
