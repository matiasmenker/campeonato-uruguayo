/** SportMonks API v3 pagination response */
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

/** API response envelope with pagination */
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

/** Minimal entity with id for SportMonks */
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

export interface CityRaw {
  id: number;
  name: string;
  country_id?: number | null;
}

export interface SeasonRaw {
  id: number;
  name: string;
  starting_at: string;
  ending_at: string;
  league_id?: number | null;
}

export interface StageRaw {
  id: number;
  name: string;
  type?: string | null;
  season_id?: number | null;
}

export interface RoundRaw {
  id: number;
  name: string;
  slug?: string | null;
  stage_id?: number | null;
  stage?: { id: number };
}

export interface GroupRaw {
  id: number;
  name?: string | null;
  stage_id?: number | null;
}

export interface VenueRaw {
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
