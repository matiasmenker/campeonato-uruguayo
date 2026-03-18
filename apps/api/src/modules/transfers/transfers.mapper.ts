import type { Transfer, Player, Team } from "db";
import { toPlayerSummary } from "../players/players.mapper.js";
import { toTeamSummary } from "../teams/teams.mapper.js";
import type { TransferContract } from "./transfers.contracts.js";

type TransferWithRelations = Transfer & {
  player: Player;
  fromTeam: Team | null;
  toTeam: Team | null;
};

export function toTransferContract(
  transfer: TransferWithRelations,
): TransferContract {
  return {
    id: transfer.id,
    sportmonksId: transfer.sportmonksId,
    player: toPlayerSummary(transfer.player),
    fromTeam: transfer.fromTeam ? toTeamSummary(transfer.fromTeam) : null,
    toTeam: transfer.toTeam ? toTeamSummary(transfer.toTeam) : null,
    type: transfer.type,
    date: transfer.date?.toISOString() ?? null,
    amount: transfer.amount,
    createdAt: transfer.createdAt.toISOString(),
    updatedAt: transfer.updatedAt.toISOString(),
  };
}
