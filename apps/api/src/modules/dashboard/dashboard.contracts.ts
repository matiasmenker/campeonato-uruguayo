import type {
  LeagueSummary,
  SeasonSummary,
  StageSummary,
  RoundSummary,
} from "../competition/competition.contracts.js";
import type { TeamSummary } from "../teams/teams.contracts.js";
import type { StandingContract } from "../standings/standings.contracts.js";

export interface DashboardVenueSummary {
  id: number;
  name: string;
  imagePath: string | null;
}

export interface DashboardFixtureSummary {
  id: number;
  kickoffAt: string | null;  minute: number | null;
  venue: DashboardVenueSummary | null;
  homeTeam: TeamSummary | null;
  awayTeam: TeamSummary | null;
  homeScore: number | null;
  awayScore: number | null;
  resultInfo: string | null;
  stateCode: string | null;
}

export interface DashboardOverviewContract {
  league: LeagueSummary | null;
  season: SeasonSummary | null;
  currentStage: StageSummary | null;
  currentRound: RoundSummary | null;
  lastCompletedRound: RoundSummary | null;
  totalTeams: number;
  totalPlayers: number;
  totalFixtures: number;
  completedFixtures: number;
  upcomingFixtures: DashboardFixtureSummary[];
  recentResults: DashboardFixtureSummary[];
  standings: StandingContract[];
}
