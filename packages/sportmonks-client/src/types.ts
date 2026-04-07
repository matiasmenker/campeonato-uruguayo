
export interface PaginationMeta {
  current_page: number;
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: {
    has_more: boolean;
    page: number;
    per_page: number;
    total: number;
  };
}

export interface SportMonksEntity {
  id: number;
}

export interface CountryDto {
  id: number;
  continent_id: number;
  name: string;
  official_name: string;
  fifa_name: string | null;
  iso2?: string;
  iso3?: string;
  latitude: string;   
  longitude: string;
  borders: string[];
  image_path: string;
}

export interface LeagueDto {
    id: number;
    name: string;
    short_code: string;
    image_path: string;
    country_id: number;
}

export interface TypeDto {
  id: number;
  name?: string | null;
  developer_name?: string | null;
  model_type?: string | null;
  stat_group?: string | null;
}

export interface CityDto {
  id: number;
  name: string;
  country_id?: number | null;
}

export interface SeasonDto {
  id: number;
  name: string;
  starting_at: string;
  ending_at: string;
  is_current?: boolean | null;
  league_id?: number | null;
}

export interface TeamDto {
  id: number;
  name: string;
  short_code?: string | null;
  image_path?: string | null;
}

export interface CoachDto {
  id: number;
  coach_id?: number | null;
  name?: string | null;
  fullname?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_path?: string | null;
  team_id?: number | null;
  coach?: CoachDto | null;
}

export interface TeamWithCoachesDto extends TeamDto {
  coaches?: CoachDto[] | null;
}

export interface RefereeDto {
  id: number;
  name?: string | null;
  image_path?: string | null;
}

export interface PlayerDto {
  id: number;
  country_id?: number | null;
  nationality_id?: number | null;
  city_id?: number | null;
  position_id?: number | null;
  detailed_position_id?: number | null;
  name?: string | null;
  common_name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  display_name?: string | null;
  image_path?: string | null;
  date_of_birth?: string | null;
  height?: number | null;
  weight?: number | null;
  gender?: string | null;
}

export interface TeamPlayerRelationDto {
  player_id?: number | null;
  position_id?: number | null;
  player?: PlayerDto | null;
}

export interface TeamWithPlayersDto extends TeamDto {
  players?: TeamPlayerRelationDto[] | null;
}

export interface TransferDto {
  id: number;
  player_id?: number | null;
  from_team_id?: number | null;
  to_team_id?: number | null;
  date?: string | null;
  amount?: string | null;
  transfer_type?: string | null | { name?: string | null };
  type?: string | null | { name?: string | null };
  player?: PlayerDto | null;
  fromTeam?: TeamDto | null;
  toTeam?: TeamDto | null;
}

export interface SidelinedDto {
  id: number;
  player_id?: number | null;
  team_id?: number | null;
  category?: string | null;
  type?: string | null;
  reason?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  expected_return?: string | null;
  expected_at?: string | null;
  player?: PlayerDto | null;
}

export interface TeamWithSidelinedDto extends TeamDto {
  sidelined?: SidelinedDto[] | null;
  sidelinedHistory?: SidelinedDto[] | null;
}

export interface SquadEntryDto {
  id: number;
  player_id?: number | null;
  team_id?: number | null;
  season_id?: number | null;
  number?: number | null;
  jersey_number?: number | null;
  is_loan?: boolean | null;
  from?: string | null;
  to?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  starting_at?: string | null;
  ending_at?: string | null;
  player?: PlayerDto | null;
}

export interface StageDto {
  id: number;
  name: string;
  type?: string | null;
  is_current?: boolean | null;
  season_id?: number | null;
}

export interface RoundDto {
  id: number;
  name: string;
  slug?: string | null;
  is_current?: boolean | null;
  stage_id?: number | null;
  stage?: { id: number };
}

export interface GroupDto {
  id: number;
  name?: string | null;
  stage_id?: number | null;
}

export interface FixtureStateDto {
  id: number;
  state?: string | null;
  name?: string | null;
  short_name?: string | null;
  developer_name?: string | null;
}

export interface StandingDetailTypeDto {
  id: number;
  name?: string | null;
  developer_name?: string | null;
}

export interface StandingDetailDto {
  type_id?: number | null;
  value?: unknown;
  data?: unknown;
  type?: StandingDetailTypeDto | null;
}

export interface StandingDto {
  id: number;
  season_id?: number | null;
  stage_id?: number | null;
  round_id?: number | null;
  group_id?: number | null;
  participant_id?: number | null;
  position?: number | null;
  points?: number | null;
  participant?: {
    id: number;
    name?: string | null;
  } | null;
  details?: StandingDetailDto[] | null;
}

export interface FixtureParticipantDto {
  id: number;
  meta?: {
    location?: string | null;
  } | null;
}

export interface FixtureScoreDto {
  participant_id?: number | null;
  participant?: { id: number } | null;
  score?:
    | {
        goals?: number | null;
      }
    | number
    | null;
  description?: string | null;
}

export interface FixtureRefereeDto {
  id: number;
  name?: string | null;
  image_path?: string | null;
}

export interface FixtureDto {
  id: number;
  season_id?: number | null;
  stage_id?: number | null;
  round_id?: number | null;
  group_id?: number | null;
  venue_id?: number | null;
  referee_id?: number | null;
  name?: string | null;
  starting_at?: string | null;
  kickoff_at?: string | null;
  state_id?: number | null;
  result_info?: string | null;
  home_team_id?: number | null;
  away_team_id?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  participants?: FixtureParticipantDto[] | null;
  scores?: FixtureScoreDto[] | null;
  referees?: FixtureRefereeDto[] | null;
  events?: FixtureEventDto[] | null;
  lineups?: FixtureLineupDto[] | null;
  statistics?: FixtureStatisticDto[] | null;
}

export interface FixtureEventDto {
  id?: number | null;
  player_id?: number | null;
  type_id?: number | null;
  order?: number | null;
  sort_order?: number | null;
  minute?: number | null;
  extra_minute?: number | null;
  result?: string | null;
  info?: string | null;
  addition?: string | null;
  player?: {
    id: number;
    name?: string | null;
    display_name?: string | null;
    image_path?: string | null;
    position_id?: number | null;
  } | null;
}

export interface FixtureLineupDetailDto {
  id?: number | null;
  type_id?: number | null;
  value?: unknown;
  data?: unknown;
}

export interface FixtureLineupDto {
  player_id?: number | null;
  team_id?: number | null;
  player_name?: string | null;
  position?: string | null | { name?: string | null };
  formation_position?: number | null;
  jersey_number?: number | null;
  details?: FixtureLineupDetailDto[] | null;
  player?: {
    id: number;
    name?: string | null;
    display_name?: string | null;
    image_path?: string | null;
    position_id?: number | null;
  } | null;
}

export interface FixtureStatisticDto {
  id?: number | null;
  type_id?: number | null;
  value?: unknown;
  data?: unknown;
  location?: string | null;
  participant_id?: number | null;
  player_id?: number | null;
  participant?: {
    id: number;
    meta?: { location?: string | null } | null;
  } | null;
  player?: {
    id: number;
    name?: string | null;
    display_name?: string | null;
    image_path?: string | null;
    position_id?: number | null;
  } | null;
}

export interface VenueDto {
  id: number;
  name: string;
  country_id?: number | null;
  city_id?: number | null;
  city_name?: string | null;
  city?: string | { id: number; name: string; country_id?: number } | null;
  capacity?: number | null;
  image_path?: string | null;
  country?: { id: number; name: string } | null;
  city_data?: { id: number; name: string; country_id?: number } | null;
}
