import type { Prisma, PrismaClient } from "db";
type ReportDependencies = {
  db: PrismaClient;
};
type ReportView = "compact" | "full";
type ReportOptions = {
  season: string;
  group: string;
  round: string;
  view: ReportView;
};
type MatchableEntity = {
  id: number;
  sportmonksId?: number | null;
  name?: string | null;
  slug?: string | null;
};
type GroupScopeCandidate = MatchableEntity & {
  stageId: number;
  stageName: string;
  actualGroupId: number | null;
};
type FixtureWithDetails = Prisma.FixtureGetPayload<{
  include: {
    season: true;
    stage: true;
    round: true;
    group: true;
    venue: true;
    referee: true;
    homeTeam: true;
    awayTeam: true;
    teamStats: true;
    lineups: {
      include: {
        team: true;
        player: {
          include: {
            country: true;
          };
        };
      };
    };
    playerStats: {
      include: {
        player: {
          include: {
            country: true;
          };
        };
      };
    };
    events: {
      include: {
        player: {
          include: {
            country: true;
          };
        };
      };
      orderBy: [
        {
          minute: "asc";
        },
        {
          extraMinute: "asc";
        },
        {
          sortOrder: "asc";
        },
        {
          id: "asc";
        },
      ];
    };
  };
}>;
type SquadMembershipLite = {
  playerId: number;
  teamId: number;
  seasonId: number;
  from: Date;
  to: Date | null;
};
type PlayerWithCountry = FixtureWithDetails["lineups"][number]["player"];
type LineupWithPlayer = FixtureWithDetails["lineups"][number];
type PlayerStatWithPlayer = FixtureWithDetails["playerStats"][number];
type EventWithPlayer = FixtureWithDetails["events"][number];
type ResolvedPlayerEntry = {
  player: PlayerWithCountry;
  lineup: LineupWithPlayer | null;
  stats: PlayerStatWithPlayer[];
  teamId: number | null;
  teamName: string | null;
  teamBucket: "home" | "away" | "unknown";
  events: EventWithPlayer[];
};
type StatTypeInfo = {
  name: string;
  developerName: string | null;
  statGroup: string | null;
};
type FixtureStateInfo = {
  id: number;
  state: string | null;
  name: string;
  shortName: string | null;
  developerName: string | null;
};
type PreparedStat = {
  key: string;
  label: string;
  shortLabel: string;
  value: string;
  numericValue: number | null;
  category: "headline" | "overall" | "offensive" | "defensive" | "discipline" | "other";
};
type StatSection = {
  title: string;
  accent: string;
  items: string[];
};
type PlayerSummaryData = {
  stats: PreparedStat[];
  statMap: Map<string, PreparedStat>;
  minutes: string;
  goals: string;
  assists: string;
  yellow: string;
  red: string;
  rating: string;
  captain: boolean;
};
type TeamPlayerRow = {
  entry: ResolvedPlayerEntry;
  summary: PlayerSummaryData;
  position: {
    label: string;
    usedFallback: boolean;
  };
  role: string;
};
type DenseStatCategory =
  | "overall"
  | "offensive"
  | "defensive"
  | "discipline"
  | "goalkeeper"
  | "other";
type FixtureQuality = {
  playersTotal: number;
  starters: number;
  substitutes: number;
  benchOnly: number;
  fallbackPositionCount: number;
  unresolvedPositionCount: number;
  missingBioCount: number;
  withoutStatsCount: number;
  unresolvedTeamCount: number;
};
type PreparedFixtureReport = {
  fixture: FixtureWithDetails;
  stateLabel: string;
  resolvedState: FixtureStateInfo | null;
  players: ResolvedPlayerEntry[];
  quality: FixtureQuality;
};
type GlobalQuality = FixtureQuality & {
  fixturesWithoutGroup: number;
};
const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  black: "\u001b[30m",
  cyan: "\u001b[36m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  yellow: "\u001b[33m",
  green: "\u001b[32m",
  red: "\u001b[31m",
  white: "\u001b[37m",
  gray: "\u001b[90m",
  orange: "\u001b[38;5;214m",
  teal: "\u001b[38;5;45m",
  purple: "\u001b[38;5;141m",
  pink: "\u001b[38;5;213m",
  bgBlue: "\u001b[48;5;25m",
  bgCyan: "\u001b[48;5;31m",
  bgGreen: "\u001b[48;5;28m",
  bgRed: "\u001b[48;5;160m",
  bgYellow: "\u001b[48;5;178m",
  bgOrange: "\u001b[48;5;166m",
  bgPurple: "\u001b[48;5;57m",
  bgGray: "\u001b[48;5;238m",
};
const REPORT_WIDTH = Math.max(92, Math.min(process.stdout.columns ?? 120, 118));
const LABEL_WIDTH = 10;
const POSITION_LABELS: Record<number, string> = {
  24: "Goalkeeper",
  25: "Defender",
  26: "Midfielder",
  27: "Forward",
  148: "Centre-Back",
  149: "Def. Midfield",
  150: "Att. Midfield",
  151: "9",
  152: "Right Winger",
  153: "Central Mid.",
  154: "Right-Back",
  155: "Left-Back",
  156: "Left Winger",
  157: "Playmaker",
  158: "Wing-Back",
  163: "Second Str.",
};
const STAT_LABELS: Record<
  string,
  {
    label: string;
    short: string;
  }
> = {
  ACCURATE_CROSSES: { label: "Acc. Crosses", short: "C.OK" },
  ACCURATE_PASSES: { label: "Acc. Passes", short: "P.OK" },
  AERIALS_LOST: { label: "Aerials Lost", short: "Aer L" },
  AERIALS_WON: { label: "Aerials Won", short: "Aer W" },
  ASSISTS: { label: "Assists", short: "A" },
  BLOCKED_SHOTS: { label: "Blocked Shots", short: "BS" },
  CLEARANCES: { label: "Clearances", short: "Clr" },
  DISPOSSESSED: { label: "Dispossessed", short: "Disp" },
  DRIBBLED_ATTEMPTS: { label: "Dribble Attempts", short: "Drb" },
  DUELS_LOST: { label: "Duels Lost", short: "DL" },
  DUELS_WON: { label: "Duels Won", short: "DW" },
  ERROR_LEAD_TO_SHOT: { label: "Errors Leading to Shot", short: "Err" },
  FOULS: { label: "Fouls Committed", short: "Fls" },
  FOULS_DRAWN: { label: "Fouls Drawn", short: "FD" },
  GOALS: { label: "Goals", short: "G" },
  GOALS_CONCEDED: { label: "Goals Conceded", short: "GC" },
  GOALKEEPER_GOALS_CONCEDED: { label: "GK Goals Conceded", short: "GKC" },
  GOOD_HIGH_CLAIM: { label: "High Claims", short: "HC" },
  INTERCEPTIONS: { label: "Interceptions", short: "Int" },
  KEY_PASSES: { label: "Key Passes", short: "KP" },
  LONG_BALLS: { label: "Long Balls", short: "LB" },
  LONG_BALLS_WON: { label: "Acc. Long Balls", short: "LB+" },
  MINUTES_PLAYED: { label: "Minutes", short: "Min" },
  OFFSIDES: { label: "Offsides", short: "Off" },
  PASSES: { label: "Passes", short: "Pas" },
  POSSESSION_LOST: { label: "Possession Lost", short: "PL" },
  RATING: { label: "Rating", short: "Rt" },
  REDCARDS: { label: "Red Cards", short: "RC" },
  SAVES: { label: "Saves", short: "Sav" },
  SAVES_INSIDE_BOX: { label: "Saves Inside Box", short: "SiB" },
  SHOTS_BLOCKED: { label: "Shots Blocked", short: "SB" },
  SHOTS_OFF_TARGET: { label: "Shots Off Target", short: "SOT" },
  SHOTS_ON_TARGET: { label: "Shots On Target", short: "ShT" },
  SHOTS_TOTAL: { label: "Shots", short: "Sh" },
  SUCCESSFUL_DRIBBLES: { label: "Succ. Dribbles", short: "Dr+" },
  TACKLES: { label: "Tackles", short: "Tkl" },
  TOUCHES: { label: "Touches", short: "Tch" },
  TOTAL_CROSSES: { label: "Crosses", short: "Crs" },
  TOTAL_DUELS: { label: "Duels", short: "Duel" },
  YELLOWCARDS: { label: "Yellow Cards", short: "YC" },
};
const HEADLINE_KEYS = [
  "MINUTES_PLAYED",
  "RATING",
  "GOALS",
  "ASSISTS",
  "YELLOWCARDS",
  "REDCARDS",
  "SAVES",
  "GOALS_CONCEDED",
];
const GOAL_EVENT_TYPE_IDS = new Set([14, 16]);
const YELLOW_EVENT_TYPE_IDS = new Set([19]);
const RED_EVENT_TYPE_IDS = new Set([20]);
const YELLOW_RED_EVENT_TYPE_IDS = new Set([21]);
const BASE_TABLE_STAT_KEYS = new Set([
  "MINUTES_PLAYED",
  "GOALS",
  "ASSISTS",
  "YELLOWCARDS",
  "REDCARDS",
  "RATING",
]);
const GOALKEEPER_STAT_KEYS = new Set([
  "SAVES",
  "SAVES_INSIDE_BOX",
  "GOOD_HIGH_CLAIM",
  "GOALS_CONCEDED",
  "GOALKEEPER_GOALS_CONCEDED",
]);
const COMPLETE_MATCH_STAT_KEYS = new Set([
  "PASSES",
  "ACCURATE_PASSES",
  "KEY_PASSES",
  "TOTAL_DUELS",
  "DUELS_WON",
  "DUELS_LOST",
  "SHOTS_TOTAL",
  "SHOTS_ON_TARGET",
  "SHOTS_OFF_TARGET",
  "LONG_BALLS",
  "LONG_BALLS_WON",
  "TACKLES",
  "INTERCEPTIONS",
  "CLEARANCES",
  "TOTAL_CROSSES",
  "ACCURATE_CROSSES",
  "TOUCHES",
  "POSSESSION_LOST",
  "SAVES",
  "SAVES_INSIDE_BOX",
  "GOOD_HIGH_CLAIM",
]);
const COMPACT_HIDDEN_META_KEYS = new Set(["CAPTAIN"]);
const PARTIAL_STATS_NOISE_KEYS = new Set(["GOALS_CONCEDED", "GOALKEEPER_GOALS_CONCEDED"]);
const DENSE_STAT_CATEGORY_META: Record<
  DenseStatCategory,
  {
    title: string;
    accent: string;
  }
> = {
  overall: { title: "🎮 Gen", accent: ANSI.cyan },
  offensive: { title: "⚔️ Atk", accent: ANSI.orange },
  defensive: { title: "🛡️ Def", accent: ANSI.blue },
  discipline: { title: "🚨 Disc", accent: ANSI.red },
  goalkeeper: { title: "🧤 GK", accent: ANSI.teal },
  other: { title: "🧩 Otr", accent: ANSI.purple },
};
const DENSE_STAT_CATEGORY_ORDER: DenseStatCategory[] = [
  "overall",
  "offensive",
  "defensive",
  "discipline",
  "goalkeeper",
  "other",
];
const STAT_COLUMN_HEADERS: Record<string, string> = {
  PASSES: "Pass",
  ACCURATE_PASSES: "Pass+",
  KEY_PASSES: "KeyP",
  TOUCHES: "Tch",
  POSSESSION_LOST: "PosL",
  LONG_BALLS: "LBall",
  LONG_BALLS_WON: "LB+",
  AERIALS_WON: "Aer+",
  AERIALS_LOST: "Aer-",
  TOTAL_DUELS: "Duels",
  DUELS_WON: "Duel+",
  DUELS_LOST: "Duel-",
  SHOTS_TOTAL: "Shots",
  SHOTS_ON_TARGET: "ShT",
  SHOTS_OFF_TARGET: "ShOff",
  SHOTS_BLOCKED: "ShBlk",
  BLOCKED_SHOTS: "Blk",
  SUCCESSFUL_DRIBBLES: "Drb+",
  DRIBBLED_ATTEMPTS: "Drb",
  TOTAL_CROSSES: "Crs",
  ACCURATE_CROSSES: "Crs+",
  OFFSIDES: "Off",
  DISPOSSESSED: "Disp",
  TACKLES: "Tkl",
  INTERCEPTIONS: "Int",
  CLEARANCES: "Clr",
  ERROR_LEAD_TO_SHOT: "Err",
  SAVES: "Sav",
  SAVES_INSIDE_BOX: "SiB",
  GOOD_HIGH_CLAIM: "HC",
  GOALS_CONCEDED: "GC",
  GOALKEEPER_GOALS_CONCEDED: "GKC",
  FOULS: "Fls",
  FOULS_DRAWN: "FD",
};
const STAT_COLUMN_ORDER = [
  "PASSES",
  "ACCURATE_PASSES",
  "KEY_PASSES",
  "TOUCHES",
  "POSSESSION_LOST",
  "LONG_BALLS",
  "LONG_BALLS_WON",
  "AERIALS_WON",
  "AERIALS_LOST",
  "TOTAL_DUELS",
  "DUELS_WON",
  "DUELS_LOST",
  "SHOTS_TOTAL",
  "SHOTS_ON_TARGET",
  "SHOTS_OFF_TARGET",
  "SHOTS_BLOCKED",
  "BLOCKED_SHOTS",
  "SUCCESSFUL_DRIBBLES",
  "DRIBBLED_ATTEMPTS",
  "TOTAL_CROSSES",
  "ACCURATE_CROSSES",
  "OFFSIDES",
  "DISPOSSESSED",
  "TACKLES",
  "INTERCEPTIONS",
  "CLEARANCES",
  "ERROR_LEAD_TO_SHOT",
  "FOULS",
  "FOULS_DRAWN",
  "SAVES",
  "SAVES_INSIDE_BOX",
  "GOOD_HIGH_CLAIM",
  "GOALS_CONCEDED",
  "GOALKEEPER_GOALS_CONCEDED",
];
const CATEGORY_PRIORITY: Record<PreparedStat["category"], number> = {
  headline: 0,
  overall: 1,
  offensive: 2,
  defensive: 3,
  discipline: 4,
  other: 5,
};
const color = (text: string, ...codes: string[]): string => {
  return `${codes.join("")}${text}${ANSI.reset}`;
};
const badge = (text: string, fg: string, bg: string): string => {
  return color(` ${text} `, ANSI.bold, fg, bg);
};
const ratingBadge = (value: string): string => {
  if (value === "-") return badge("--", ANSI.white, ANSI.bgGray);
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return badge(value, ANSI.white, ANSI.bgGray);
  if (numeric >= 7.5) return badge(value, ANSI.black, ANSI.bgGreen);
  if (numeric >= 7) return badge(value, ANSI.black, ANSI.bgCyan);
  if (numeric >= 6.5) return badge(value, ANSI.black, ANSI.bgYellow);
  if (numeric >= 6) return badge(value, ANSI.white, ANSI.bgOrange);
  return badge(value, ANSI.white, ANSI.bgRed);
};
const roleBadge = (role: string): string => {
  switch (role) {
    case "STR":
      return badge(role, ANSI.white, ANSI.bgBlue);
    case "SUB":
      return badge(role, ANSI.black, ANSI.bgYellow);
    default:
      return badge(role, ANSI.white, ANSI.bgGray);
  }
};
const stateBadge = (state: string): string => {
  const normalized = normalizeText(state).replace(/\s+/g, "_");
  if (normalized === "ft") return badge("FT", ANSI.white, ANSI.bgGreen);
  if (normalized === "ht") return badge("HT", ANSI.black, ANSI.bgYellow);
  if (normalized.includes("live")) return badge(state, ANSI.white, ANSI.bgRed);
  return badge(state, ANSI.white, ANSI.bgGray);
};
const teamBadge = (kind: "home" | "away" | "unknown"): string => {
  switch (kind) {
    case "home":
      return badge("HOME", ANSI.white, ANSI.bgBlue);
    case "away":
      return badge("AWAY", ANSI.white, ANSI.bgPurple);
    default:
      return badge("NO TM", ANSI.white, ANSI.bgGray);
  }
};
const stripAnsi = (value: string): string => {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
};
const visibleLength = (value: string): number => {
  return stripAnsi(value).length;
};
const pad = (value: string, length: number): string => {
  const clean = stripAnsi(value);
  if (clean.length >= length) return value;
  return `${value}${" ".repeat(length - clean.length)}`;
};
const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
};
const truncateVisible = (value: string, maxLength: number): string => {
  const clean = stripAnsi(value);
  if (clean.length <= maxLength) return value;
  return truncate(clean, maxLength);
};
const padAlign = (value: string, length: number, align: "left" | "right" = "left"): string => {
  const cleanLength = visibleLength(value);
  if (cleanLength >= length) return value;
  const padding = " ".repeat(length - cleanLength);
  return align === "right" ? `${padding}${value}` : `${value}${padding}`;
};
const wrapText = (value: string, width: number): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return [""];
  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
};
const printRule = (char = "─", width = REPORT_WIDTH): void => {
  console.log(color(char.repeat(width), ANSI.gray));
};
const printBox = (title: string, lines: string[], accent = ANSI.blue): void => {
  const width = Math.min(
    120,
    Math.max(title.length + 6, ...lines.map((line) => visibleLength(line) + 4), 40)
  );
  console.log(color(`┌${"─".repeat(width - 2)}┐`, accent));
  console.log(
    color("│ ", accent) +
      color(truncateVisible(title, width - 4), ANSI.bold, ANSI.white) +
      " ".repeat(Math.max(0, width - 4 - visibleLength(truncateVisible(title, width - 4)))) +
      color(" │", accent)
  );
  console.log(color(`├${"─".repeat(width - 2)}┤`, accent));
  for (const line of lines) {
    const renderedLine = truncateVisible(line, width - 4);
    console.log(
      color("│ ", accent) +
        renderedLine +
        " ".repeat(Math.max(0, width - 4 - visibleLength(renderedLine))) +
        color(" │", accent)
    );
  }
  console.log(color(`└${"─".repeat(width - 2)}┘`, accent));
};
const packInlineItems = (
  items: string[],
  width: number,
  separator = color(" • ", ANSI.gray)
): string[] => {
  const filtered = items.filter((item) => stripAnsi(item).trim().length > 0);
  if (filtered.length === 0) return [];
  const lines: string[] = [];
  const separatorLength = visibleLength(separator);
  let current = "";
  for (const item of filtered) {
    if (!current) {
      current = item;
      continue;
    }
    if (visibleLength(current) + separatorLength + visibleLength(item) <= width) {
      current = `${current}${separator}${item}`;
      continue;
    }
    lines.push(current);
    current = item;
  }
  if (current) lines.push(current);
  return lines;
};
const buildLabeledItemLines = (label: string, items: string[], width: number): string[] => {
  const labelPrefix = `${label} `;
  const labelWidth = visibleLength(labelPrefix);
  const availableWidth = Math.max(24, width - labelWidth);
  const lines = packInlineItems(items, availableWidth);
  if (lines.length === 0) return [];
  return lines.map(
    (line, index) =>
      `${index === 0 ? color(labelPrefix, ANSI.bold, ANSI.white) : " ".repeat(labelWidth)}${line}`
  );
};
const buildLabeledTextLines = (label: string, value: string, width: number): string[] => {
  const labelPrefix = `${label} `;
  const labelWidth = visibleLength(labelPrefix);
  const availableWidth = Math.max(24, width - labelWidth);
  const wrapped = wrapText(value, availableWidth);
  return wrapped.map(
    (line, index) =>
      `${index === 0 ? color(labelPrefix, ANSI.bold, ANSI.white) : " ".repeat(labelWidth)}${line}`
  );
};
const printCard = (lines: string[], accent: string): void => {
  const indent = "  ";
  const contentWidth = Math.max(72, REPORT_WIDTH - 8);
  console.log(`${indent}${color(`┌${"─".repeat(contentWidth + 2)}┐`, accent)}`);
  for (const line of lines) {
    const rendered = truncateVisible(line, contentWidth);
    console.log(
      `${indent}${color("│ ", accent)}${rendered}${" ".repeat(Math.max(0, contentWidth - visibleLength(rendered)))}${color(" │", accent)}`
    );
  }
  console.log(`${indent}${color(`└${"─".repeat(contentWidth + 2)}┘`, accent)}`);
};
type TableColumn = {
  header: string;
  width: number;
  align?: "left" | "right";
};
type TableOptions = {
  cellPadding?: number;
  indent?: string;
};
const printTable = (
  columns: TableColumn[],
  rows: string[][],
  accent: string,
  options?: TableOptions
): void => {
  const indent = options?.indent ?? "  ";
  const cellPadding = options?.cellPadding ?? 1;
  const paddedWidth = (column: TableColumn) => column.width + cellPadding * 2;
  const renderBorder = (left: string, middle: string, right: string): string =>
    `${indent}${color(left, accent)}${columns
      .map(
        (column, index) =>
          `${color("─".repeat(paddedWidth(column)), accent)}${index < columns.length - 1 ? color(middle, accent) : ""}`
      )
      .join("")}${color(right, accent)}`;
  const renderRow = (cells: string[]): string => {
    const formatted = columns.map(
      (column, index) =>
        `${" ".repeat(cellPadding)}${padAlign(truncateVisible(cells[index] ?? "", column.width), column.width, column.align ?? "left")}${" ".repeat(cellPadding)}`
    );
    return `${indent}${color("│", accent)}${formatted.join(color("│", accent))}${color("│", accent)}`;
  };
  console.log(renderBorder("┌", "┬", "┐"));
  console.log(renderRow(columns.map((column) => color(column.header, ANSI.bold, ANSI.white))));
  console.log(renderBorder("├", "┼", "┤"));
  rows.forEach((row, index) => {
    console.log(renderRow(row));
    if (index < rows.length - 1) {
      console.log(renderBorder("├", "┼", "┤"));
    }
  });
  console.log(renderBorder("└", "┴", "┘"));
};
const printWrappedLine = (label: string, value: string, indent = 5, width = REPORT_WIDTH): void => {
  const prefix = `${" ".repeat(indent)}${pad(color(`${label}:`, ANSI.bold, ANSI.gray), LABEL_WIDTH)}`;
  const continuation = `${" ".repeat(indent)}${" ".repeat(LABEL_WIDTH)}`;
  const wrapped = wrapText(value, width - prefix.length);
  wrapped.forEach((line, index) => {
    console.log(`${index === 0 ? prefix : continuation}${line}`);
  });
};
const formatDate = (value: Date | null | undefined): string => {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Montevideo",
  }).format(value);
};
const formatDateOnly = (value: Date | null | undefined): string => {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Montevideo",
  }).format(value);
};
const calculateAge = (dateOfBirth: Date | null): number | null => {
  if (!dateOfBirth) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  const dayDiff = now.getUTCDate() - dateOfBirth.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
};
const normalizeText = (value: string | null | undefined): string => {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
};
const extractNumbers = (value: string | null | undefined): number[] => {
  if (!value) return [];
  return [...value.matchAll(/\d+/g)].map((match) => Number(match[0])).filter(Number.isFinite);
};
const rankCandidate = (query: string, entity: MatchableEntity): number => {
  const normalizedQuery = normalizeText(query);
  const queryNumbers = extractNumbers(query);
  const names = [entity.name, entity.slug]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeText(value));
  let score = 0;
  if (String(entity.id) === query) score += 1000;
  if (
    entity.sportmonksId !== null &&
    entity.sportmonksId !== undefined &&
    String(entity.sportmonksId) === query
  ) {
    score += 900;
  }
  for (const name of names) {
    if (!name) continue;
    if (name === normalizedQuery) score += 800;
    if (name.startsWith(normalizedQuery)) score += 300;
    if (name.includes(normalizedQuery)) score += 200;
    if (normalizedQuery.includes(name) && name.length > 2) score += 100;
  }
  const candidateNumbers = [...extractNumbers(entity.name), ...extractNumbers(entity.slug)];
  if (
    queryNumbers.length > 0 &&
    candidateNumbers.some((candidate) => queryNumbers.includes(candidate))
  ) {
    score += 700;
  }
  return score;
};
const pickBestCandidate = <T extends MatchableEntity>(
  items: T[],
  query: string,
  label: string
): T => {
  if (items.length === 0) {
    throw new Error(`No ${label}s loaded to resolve "${query}".`);
  }
  const ranked = items
    .map((item) => ({ item, score: rankCandidate(query, item) }))
    .sort((left, right) => right.score - left.score);
  if (ranked[0] && ranked[0].score > 0) {
    return ranked[0].item;
  }
  const sample = items
    .slice(0, 10)
    .map((item) => item.name ?? item.slug ?? `ID ${item.id}`)
    .join(", ");
  throw new Error(`Could not find ${label} for "${query}". Some options: ${sample}`);
};
const parseArgs = (argv: string[]): ReportOptions => {
  const argMap = new Map<string, string>();
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, ...rawValue] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim();
    if (key) argMap.set(key, value);
  }
  const season = argMap.get("season");
  const group = argMap.get("group");
  const round = argMap.get("round");
  const rawView = normalizeText(argMap.get("view"));
  const view: ReportView = rawView === "full" ? "full" : "compact";
  if (!season || !group || !round) {
    throw new Error(
      'Missing arguments. Usage: pnpm report:fixture-players --season="2026" --group="Apertura" --round="1" [--view="compact|full"]'
    );
  }
  return { season, group, round, view };
};
const normalizeStatKey = (value: string | null | undefined): string => {
  return (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};
const toStatValueString = (value: Prisma.JsonValue | null): string => {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    return toStatValueString(
      (
        value as {
          value?: Prisma.JsonValue | null;
        }
      ).value ?? null
    );
  }
  return JSON.stringify(value);
};
const toStatNumber = (value: Prisma.JsonValue | null): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    return toStatNumber(
      (
        value as {
          value?: Prisma.JsonValue | null;
        }
      ).value ?? null
    );
  }
  return null;
};
const toStatBoolean = (value: Prisma.JsonValue | null): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    if (normalized === "1") return true;
    if (normalized === "0") return false;
  }
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    return toStatBoolean(
      (
        value as {
          value?: Prisma.JsonValue | null;
        }
      ).value ?? null
    );
  }
  return false;
};
const resolveStatLabel = (
  key: string,
  fallbackName: string | null | undefined
): {
  label: string;
  short: string;
} => {
  const known = STAT_LABELS[key];
  if (known) return known;
  const base = (fallbackName ?? key).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const title = base
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");
  return { label: title || key, short: title.slice(0, 4) || key.slice(0, 4) };
};
const resolveStatCategory = (
  key: string,
  statGroup: string | null | undefined
): PreparedStat["category"] => {
  if (HEADLINE_KEYS.includes(key)) return "headline";
  if (["YELLOWCARDS", "REDCARDS", "FOULS", "FOULS_DRAWN"].includes(key)) return "discipline";
  switch ((statGroup ?? "").toLowerCase()) {
    case "overall":
    case "null":
      return "overall";
    case "offensive":
      return "offensive";
    case "defensive":
      return "defensive";
    default:
      return "other";
  }
};
const comparePreparedStats = (left: PreparedStat, right: PreparedStat): number => {
  const leftPriority = CATEGORY_PRIORITY[left.category];
  const rightPriority = CATEGORY_PRIORITY[right.category];
  if (leftPriority !== rightPriority) return leftPriority - rightPriority;
  const leftHeadlineIndex = HEADLINE_KEYS.indexOf(left.key);
  const rightHeadlineIndex = HEADLINE_KEYS.indexOf(right.key);
  const safeLeft = leftHeadlineIndex === -1 ? Number.MAX_SAFE_INTEGER : leftHeadlineIndex;
  const safeRight = rightHeadlineIndex === -1 ? Number.MAX_SAFE_INTEGER : rightHeadlineIndex;
  if (safeLeft !== safeRight) return safeLeft - safeRight;
  return left.label.localeCompare(right.label, "en");
};
const buildSyntheticPreparedStat = (key: string, numericValue: number): PreparedStat => {
  const labels = resolveStatLabel(key, key);
  return {
    key,
    label: labels.label,
    shortLabel: labels.short,
    value: String(numericValue),
    numericValue,
    category: resolveStatCategory(key, null),
  };
};
const buildEventFallbackTotals = (
  events: EventWithPlayer[]
): {
  goals: number;
  yellow: number;
  red: number;
} => {
  return events.reduce(
    (acc, event) => {
      if (event.typeId && GOAL_EVENT_TYPE_IDS.has(event.typeId)) acc.goals += 1;
      if (event.typeId && YELLOW_EVENT_TYPE_IDS.has(event.typeId)) acc.yellow += 1;
      if (event.typeId && RED_EVENT_TYPE_IDS.has(event.typeId)) acc.red += 1;
      if (event.typeId && YELLOW_RED_EVENT_TYPE_IDS.has(event.typeId)) {
        acc.yellow += 1;
        acc.red += 1;
      }
      return acc;
    },
    { goals: 0, yellow: 0, red: 0 }
  );
};
const applyEventFallbackStats = (
  stats: PreparedStat[],
  events: EventWithPlayer[]
): PreparedStat[] => {
  const merged = [...stats];
  const existingKeys = new Set(merged.map((stat) => stat.key));
  const fallbackTotals = buildEventFallbackTotals(events);
  const fallbackEntries: Array<[keyof typeof fallbackTotals, string]> = [
    ["goals", "GOALS"],
    ["yellow", "YELLOWCARDS"],
    ["red", "REDCARDS"],
  ];
  for (const [sourceKey, targetKey] of fallbackEntries) {
    const value = fallbackTotals[sourceKey];
    if (value <= 0 || existingKeys.has(targetKey)) continue;
    merged.push(buildSyntheticPreparedStat(targetKey, value));
    existingKeys.add(targetKey);
  }
  return merged.sort(comparePreparedStats);
};
const prepareStats = (
  stats: PlayerStatWithPlayer[],
  statTypeMap: Map<number, StatTypeInfo>
): PreparedStat[] => {
  return stats
    .map((stat) => {
      const typeInfo = stat.typeId ? statTypeMap.get(stat.typeId) : null;
      const key = normalizeStatKey(
        typeInfo?.developerName ?? typeInfo?.name ?? `TYPE_${stat.typeId ?? "N_A"}`
      );
      const labels = resolveStatLabel(key, typeInfo?.name);
      return {
        key,
        label: labels.label,
        shortLabel: labels.short,
        value: toStatValueString(stat.value),
        numericValue: toStatNumber(stat.value),
        category: resolveStatCategory(key, typeInfo?.statGroup),
      };
    })
    .sort(comparePreparedStats);
};
const buildStatMap = (stats: PreparedStat[]): Map<string, PreparedStat> => {
  return new Map(stats.map((stat) => [stat.key, stat]));
};
const getStatValue = (stats: Map<string, PreparedStat>, key: string): string => {
  return stats.get(key)?.value ?? "-";
};
const getStatNumber = (stats: Map<string, PreparedStat>, key: string): number | null => {
  return stats.get(key)?.numericValue ?? null;
};
const buildComboStat = (
  stats: Map<string, PreparedStat>,
  madeKey: string,
  totalKey: string,
  label: string
): string | null => {
  const made = getStatValue(stats, madeKey);
  const total = getStatValue(stats, totalKey);
  if (made === "-" && total === "-") return null;
  if (made !== "-" && total !== "-") return `${label} ${made}/${total}`;
  return `${label} ${made !== "-" ? made : total}`;
};
const findRawStatValue = (
  stats: PlayerStatWithPlayer[],
  statTypeMap: Map<number, StatTypeInfo>,
  targetKey: string
): Prisma.JsonValue | null => {
  const match = stats.find((stat) => {
    const typeInfo = stat.typeId ? statTypeMap.get(stat.typeId) : null;
    const key = normalizeStatKey(
      typeInfo?.developerName ?? typeInfo?.name ?? `TYPE_${stat.typeId ?? "N_A"}`
    );
    return key === targetKey;
  });
  return match?.value ?? null;
};
const hasCompleteMatchStats = (statMap: Map<string, PreparedStat>): boolean => {
  return [...COMPLETE_MATCH_STAT_KEYS].some((key) => getStatValue(statMap, key) !== "-");
};
const buildPlayerSummary = (
  entry: ResolvedPlayerEntry,
  statTypeMap: Map<number, StatTypeInfo>
): PlayerSummaryData => {
  const stats = applyEventFallbackStats(
    prepareStats(entry.stats, statTypeMap).filter(
      (stat) => !COMPACT_HIDDEN_META_KEYS.has(stat.key)
    ),
    entry.events
  );
  const statMap = buildStatMap(stats);
  return {
    stats,
    statMap,
    minutes: getStatValue(statMap, "MINUTES_PLAYED"),
    goals: getStatValue(statMap, "GOALS"),
    assists: getStatValue(statMap, "ASSISTS"),
    yellow: getStatValue(statMap, "YELLOWCARDS"),
    red: getStatValue(statMap, "REDCARDS"),
    rating: getStatValue(statMap, "RATING"),
    captain: toStatBoolean(findRawStatValue(entry.stats, statTypeMap, "CAPTAIN")),
  };
};
const resolvePositionLabel = (
  entry: ResolvedPlayerEntry
): {
  label: string;
  usedFallback: boolean;
} => {
  if (entry.lineup?.position) {
    return { label: entry.lineup.position, usedFallback: false };
  }
  const detailed = entry.player.detailedPositionId
    ? POSITION_LABELS[entry.player.detailedPositionId]
    : null;
  if (detailed) return { label: detailed, usedFallback: true };
  const general = entry.player.positionId ? POSITION_LABELS[entry.player.positionId] : null;
  if (general) return { label: general, usedFallback: true };
  return { label: "No position", usedFallback: false };
};
const resolveRole = (entry: ResolvedPlayerEntry, statMap: Map<string, PreparedStat>): string => {
  if (entry.lineup?.formationPosition !== null && entry.lineup?.formationPosition !== undefined)
    return "STR";
  const minutes = getStatNumber(statMap, "MINUTES_PLAYED");
  if ((minutes ?? 0) > 0 || entry.stats.length > 0 || entry.events.length > 0) return "SUB";
  return "BCH";
};
const summarizeEvents = (events: EventWithPlayer[]): string => {
  if (events.length === 0) return "No events";
  return events
    .map((event) => {
      const minute =
        event.minute !== null
          ? `${event.minute}${event.extraMinute ? `+${event.extraMinute}` : ""}'`
          : "n/a";
      switch (event.typeId) {
        case 14:
        case 16:
          return `⚽ ${minute} ${event.result ?? ""}`.trim();
        case 15:
          return `🥅 ${minute} ${event.result ?? ""}`.trim();
        case 18:
          return `🔁 ${minute}`;
        case 19:
          return `🟨 ${minute}`;
        case 20:
        case 21:
          return `🟥 ${minute}`;
        default: {
          const parts = [event.info, event.addition].filter((value): value is string =>
            Boolean(value)
          );
          return `📝 ${minute} ${parts.join(" ").trim()}`.trim();
        }
      }
    })
    .join(" | ");
};
const buildProfileItems = (entry: ResolvedPlayerEntry): string[] => {
  const age = calculateAge(entry.player.dateOfBirth);
  return [
    `🌍 ${entry.player.country?.name ?? "Country n/a"}`,
    age !== null ? `🎂 ${age}a` : null,
    entry.player.height ? `📏 ${entry.player.height} cm` : null,
    entry.player.weight ? `⚖️ ${entry.player.weight} kg` : null,
    entry.player.dateOfBirth ? `📅 ${formatDateOnly(entry.player.dateOfBirth)}` : null,
  ].filter((value): value is string => Boolean(value));
};
const buildContextItems = (
  entry: ResolvedPlayerEntry,
  position: {
    label: string;
    usedFallback: boolean;
  }
): string[] => {
  return [
    entry.teamName ? `🏟 ${entry.teamName}` : null,
    entry.player.commonName && entry.player.commonName !== entry.player.displayName
      ? `🪪 ${entry.player.commonName}`
      : null,
    `🆔 Player ${entry.player.id}`,
    entry.player.sportmonksId ? `🧩 SM ${entry.player.sportmonksId}` : null,
    entry.lineup ? `📋 Lineup ${entry.lineup.id}` : "📋 No lineup",
    entry.lineup?.formationPosition !== null && entry.lineup?.formationPosition !== undefined
      ? `🧭 XI ${entry.lineup.formationPosition}`
      : null,
    position.usedFallback ? "🛟 Position inferred from profile" : null,
    position.label === "No position" ? "🚫 No position data" : null,
  ].filter((value): value is string => Boolean(value));
};
const buildSummaryMetricItems = (statMap: Map<string, PreparedStat>): string[] => {
  const items = [
    getStatValue(statMap, "MINUTES_PLAYED") !== "-"
      ? `⏱ ${getStatValue(statMap, "MINUTES_PLAYED")} min`
      : null,
    getStatValue(statMap, "RATING") !== "-" ? `⭐ Rating ${getStatValue(statMap, "RATING")}` : null,
    getStatValue(statMap, "GOALS") !== "-" ? `⚽ Goals ${getStatValue(statMap, "GOALS")}` : null,
    getStatValue(statMap, "ASSISTS") !== "-"
      ? `🅰 Assists ${getStatValue(statMap, "ASSISTS")}`
      : null,
    getStatValue(statMap, "YELLOWCARDS") !== "-"
      ? `🟨 Yellows ${getStatValue(statMap, "YELLOWCARDS")}`
      : null,
    getStatValue(statMap, "REDCARDS") !== "-"
      ? `🟥 Reds ${getStatValue(statMap, "REDCARDS")}`
      : null,
    buildComboStat(statMap, "ACCURATE_PASSES", "PASSES", "🎯 Passes"),
    buildComboStat(statMap, "DUELS_WON", "TOTAL_DUELS", "🤺 Duels"),
    buildComboStat(statMap, "SHOTS_ON_TARGET", "SHOTS_TOTAL", "🥅 Shots"),
    buildComboStat(statMap, "SUCCESSFUL_DRIBBLES", "DRIBBLED_ATTEMPTS", "🪄 Dribbles"),
    buildComboStat(statMap, "ACCURATE_CROSSES", "TOTAL_CROSSES", "📨 Crosses"),
    buildComboStat(statMap, "LONG_BALLS_WON", "LONG_BALLS", "🚀 Long balls"),
    getStatValue(statMap, "TOUCHES") !== "-"
      ? `👟 Touches ${getStatValue(statMap, "TOUCHES")}`
      : null,
    getStatValue(statMap, "POSSESSION_LOST") !== "-"
      ? `📉 Lost ${getStatValue(statMap, "POSSESSION_LOST")}`
      : null,
    getStatValue(statMap, "SAVES") !== "-" ? `🧤 Saves ${getStatValue(statMap, "SAVES")}` : null,
    getStatValue(statMap, "GOALS_CONCEDED") !== "-"
      ? `🥅 Goals Conceded ${getStatValue(statMap, "GOALS_CONCEDED")}`
      : null,
  ].filter((value): value is string => Boolean(value));
  return items.length > 0 ? items : ["No statistical summary"];
};
const formatStatComboCell = (
  stats: Map<string, PreparedStat>,
  madeKey: string,
  totalKey: string
): string => {
  const made = getStatValue(stats, madeKey);
  const total = getStatValue(stats, totalKey);
  if (made === "-" && total === "-") return "-";
  if (made !== "-" && total !== "-") return `${made}/${total}`;
  return made !== "-" ? made : total;
};
const formatCompactPositionLabel = (value: string): string => {
  switch (value) {
    case "Right-Back":
      return "RB";
    case "Left-Back":
      return "LB";
    case "Def. Midfield":
      return "DM";
    case "Central Mid.":
      return "CM";
    case "Right Winger":
      return "RW";
    case "Left Winger":
      return "LW";
    case "Playmaker":
      return "AM";
    case "Second Str.":
      return "SS";
    case "Midfielder":
      return "MF";
    case "Forward":
      return "FW";
    case "Wing-Back":
      return "WB";
    default:
      return value;
  }
};
const resolveDenseStatCategory = (stat: PreparedStat): DenseStatCategory | null => {
  if (BASE_TABLE_STAT_KEYS.has(stat.key)) return null;
  if (GOALKEEPER_STAT_KEYS.has(stat.key)) return "goalkeeper";
  switch (stat.category) {
    case "overall":
      return "overall";
    case "offensive":
      return "offensive";
    case "defensive":
      return "defensive";
    case "discipline":
      return "discipline";
    default:
      return "other";
  }
};
const resolveDenseStatHeader = (stat: PreparedStat): string => {
  return STAT_COLUMN_HEADERS[stat.key] ?? stat.shortLabel ?? stat.label.slice(0, 5);
};
const sortStatKeys = (left: string, right: string): number => {
  const leftIndex = STAT_COLUMN_ORDER.indexOf(left);
  const rightIndex = STAT_COLUMN_ORDER.indexOf(right);
  const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
  const safeRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
  if (safeLeft !== safeRight) return safeLeft - safeRight;
  return left.localeCompare(right, "en");
};
const buildColumnLegend = (statKeys: string[]): string[] => {
  const items = ["No=jersey", "Rtg=rating"];
  if (statKeys.some((key) => key.includes("ACCURATE") || key.endsWith("_WON"))) {
    items.push("+= accurate/won");
  }
  if (statKeys.includes("POSSESSION_LOST")) {
    items.push("PosL=possession lost");
  }
  if (statKeys.includes("DISPOSSESSED")) {
    items.push("Disp=dispossessed");
  }
  if (statKeys.includes("GOOD_HIGH_CLAIM")) {
    items.push("HC=high claims");
  }
  if (statKeys.includes("SAVES_INSIDE_BOX")) {
    items.push("SiB=saves inside box");
  }
  if (statKeys.some((key) => key === "GOALS_CONCEDED" || key === "GOALKEEPER_GOALS_CONCEDED")) {
    items.push("GC=goals conceded");
  }
  if (statKeys.includes("ERROR_LEAD_TO_SHOT")) {
    items.push("Err=error leading to shot");
  }
  return items;
};
const printDenseStatTables = (rows: TeamPlayerRow[], kind: "home" | "away" | "unknown"): void => {
  const buckets = new Map<DenseStatCategory, Map<string, PreparedStat>>();
  for (const row of rows) {
    for (const stat of row.summary.stats) {
      const category = resolveDenseStatCategory(stat);
      if (!category) continue;
      const current = buckets.get(category) ?? new Map<string, PreparedStat>();
      if (!current.has(stat.key)) current.set(stat.key, stat);
      buckets.set(category, current);
    }
  }
  for (const category of DENSE_STAT_CATEGORY_ORDER) {
    const bucket = buckets.get(category);
    if (!bucket || bucket.size === 0) continue;
    const categoryMeta = DENSE_STAT_CATEGORY_META[category];
    const statKeys = [...bucket.keys()].sort(sortStatKeys);
    const columns: TableColumn[] = [
      { header: "#", width: 2, align: "right" },
      { header: "Player", width: 14 },
      ...statKeys.map((key) => {
        const stat = bucket.get(key)!;
        const header = resolveDenseStatHeader(stat);
        const width = Math.max(
          visibleLength(header),
          ...rows.map((row) => visibleLength(getStatValue(row.summary.statMap, key))),
          1
        );
        return {
          header,
          width,
          align: "right" as const,
        };
      }),
    ];
    console.log(color(`  ${categoryMeta.title}`, ANSI.bold, categoryMeta.accent));
    printTable(
      columns,
      rows.map((row, index) => [
        color(String(index + 1).padStart(2, "0"), ANSI.gray),
        color(
          truncate(row.entry.player.displayName ?? row.entry.player.name, 14),
          ANSI.bold,
          ANSI.white
        ),
        ...statKeys.map((key) => getStatValue(row.summary.statMap, key)),
      ]),
      accentForTeamKind(kind),
      { cellPadding: 0 }
    );
    console.log("");
  }
};
const buildStatSections = (stats: PreparedStat[]): StatSection[] => {
  const excluded = new Set([...HEADLINE_KEYS, "YELLOWCARDS", "REDCARDS"]);
  const buildItems = (items: PreparedStat[], extraExcluded?: Set<string>) =>
    items
      .filter((stat) => !excluded.has(stat.key) && !(extraExcluded?.has(stat.key) ?? false))
      .map((stat) => `${stat.label}: ${stat.value}`);
  const sections: StatSection[] = [
    {
      title: "🎮 Game",
      accent: ANSI.cyan,
      items: buildItems(stats.filter((stat) => stat.category === "overall")),
    },
    {
      title: "⚔️ Attack",
      accent: ANSI.orange,
      items: buildItems(stats.filter((stat) => stat.category === "offensive")),
    },
    {
      title: "🛡️ Defense",
      accent: ANSI.blue,
      items: buildItems(stats.filter((stat) => stat.category === "defensive")),
    },
    {
      title: "🚨 Discipline",
      accent: ANSI.red,
      items: buildItems(
        stats.filter(
          (stat) => stat.category === "discipline" || ["FOULS", "FOULS_DRAWN"].includes(stat.key)
        ),
        new Set(["FOULS", "FOULS_DRAWN"])
      ).concat(
        stats
          .filter((stat) => ["FOULS", "FOULS_DRAWN"].includes(stat.key))
          .map((stat) => `${stat.label}: ${stat.value}`)
      ),
    },
    {
      title: "🧩 Other",
      accent: ANSI.purple,
      items: buildItems(stats.filter((stat) => stat.category === "other")),
    },
  ];
  return sections.filter((section) => section.items.length > 0);
};
const comparePlayerEntries = (left: ResolvedPlayerEntry, right: ResolvedPlayerEntry): number => {
  const leftFormation = left.lineup?.formationPosition ?? Number.MAX_SAFE_INTEGER;
  const rightFormation = right.lineup?.formationPosition ?? Number.MAX_SAFE_INTEGER;
  if (leftFormation !== rightFormation) return leftFormation - rightFormation;
  const leftJersey = left.lineup?.jerseyNumber ?? Number.MAX_SAFE_INTEGER;
  const rightJersey = right.lineup?.jerseyNumber ?? Number.MAX_SAFE_INTEGER;
  if (leftJersey !== rightJersey) return leftJersey - rightJersey;
  return (left.player.displayName ?? left.player.name).localeCompare(
    right.player.displayName ?? right.player.name,
    "en"
  );
};
const resolveTeamBucket = (
  fixture: FixtureWithDetails,
  teamId: number | null
): {
  teamBucket: "home" | "away" | "unknown";
  teamName: string | null;
} => {
  if (teamId !== null && fixture.homeTeamId === teamId) {
    return { teamBucket: "home", teamName: fixture.homeTeam?.name ?? "Home" };
  }
  if (teamId !== null && fixture.awayTeamId === teamId) {
    return { teamBucket: "away", teamName: fixture.awayTeam?.name ?? "Away" };
  }
  return { teamBucket: "unknown", teamName: null };
};
const resolveMembershipTeamId = (
  memberships: SquadMembershipLite[],
  fixture: FixtureWithDetails,
  playerId: number
): number | null => {
  const fixtureDate = fixture.kickoffAt ?? new Date();
  const membership = memberships.find(
    (item) =>
      item.playerId === playerId &&
      item.seasonId === fixture.seasonId &&
      (item.teamId === fixture.homeTeamId || item.teamId === fixture.awayTeamId) &&
      item.from <= fixtureDate &&
      (item.to === null || item.to >= fixtureDate)
  );
  return membership?.teamId ?? null;
};
const prepareFixture = (
  fixture: FixtureWithDetails,
  statTypeMap: Map<number, StatTypeInfo>,
  squadMemberships: SquadMembershipLite[],
  stateMap: Map<number, FixtureStateInfo>
): PreparedFixtureReport => {
  const lineupByPlayerId = new Map<number, LineupWithPlayer>(
    fixture.lineups.map((lineup) => [lineup.playerId, lineup])
  );
  const statsByPlayerId = new Map<number, PlayerStatWithPlayer[]>();
  const eventsByPlayerId = new Map<number, EventWithPlayer[]>();
  const playerMap = new Map<number, PlayerWithCountry>();
  for (const lineup of fixture.lineups) {
    playerMap.set(lineup.playerId, lineup.player);
  }
  for (const stat of fixture.playerStats) {
    playerMap.set(stat.playerId, stat.player);
    const current = statsByPlayerId.get(stat.playerId) ?? [];
    current.push(stat);
    statsByPlayerId.set(stat.playerId, current);
  }
  for (const event of fixture.events) {
    if (!event.playerId || !event.player) continue;
    playerMap.set(event.playerId, event.player);
    const current = eventsByPlayerId.get(event.playerId) ?? [];
    current.push(event);
    eventsByPlayerId.set(event.playerId, current);
  }
  const players: ResolvedPlayerEntry[] = [...playerMap.entries()]
    .map(([playerId, player]) => {
      const lineup = lineupByPlayerId.get(playerId) ?? null;
      const stats = statsByPlayerId.get(playerId) ?? [];
      const events = eventsByPlayerId.get(playerId) ?? [];
      const teamId = lineup?.teamId ?? resolveMembershipTeamId(squadMemberships, fixture, playerId);
      const { teamBucket, teamName } = resolveTeamBucket(fixture, teamId);
      return {
        player,
        lineup,
        stats,
        teamId,
        teamName,
        teamBucket,
        events,
      };
    })
    .sort(comparePlayerEntries);
  const quality = players.reduce<FixtureQuality>(
    (acc, playerEntry) => {
      const prepared = buildPlayerSummary(playerEntry, statTypeMap);
      const position = resolvePositionLabel(playerEntry);
      const role = resolveRole(playerEntry, prepared.statMap);
      acc.playersTotal += 1;
      if (role === "STR") acc.starters += 1;
      if (role === "SUB") acc.substitutes += 1;
      if (role === "BCH") acc.benchOnly += 1;
      if (position.usedFallback) acc.fallbackPositionCount += 1;
      if (position.label === "No position") acc.unresolvedPositionCount += 1;
      if (
        !playerEntry.player.country ||
        !playerEntry.player.dateOfBirth ||
        !playerEntry.player.displayName
      ) {
        acc.missingBioCount += 1;
      }
      if (playerEntry.stats.length === 0) acc.withoutStatsCount += 1;
      if (playerEntry.teamBucket === "unknown") acc.unresolvedTeamCount += 1;
      return acc;
    },
    {
      playersTotal: 0,
      starters: 0,
      substitutes: 0,
      benchOnly: 0,
      fallbackPositionCount: 0,
      unresolvedPositionCount: 0,
      missingBioCount: 0,
      withoutStatsCount: 0,
      unresolvedTeamCount: 0,
    }
  );
  const resolvedState = fixture.stateId ? (stateMap.get(fixture.stateId) ?? null) : null;
  const stateLabel = resolvedState?.state ?? resolvedState?.name ?? "No state";
  return {
    fixture,
    stateLabel,
    resolvedState,
    players,
    quality,
  };
};
const buildGlobalQuality = (reports: PreparedFixtureReport[]): GlobalQuality => {
  return reports.reduce<GlobalQuality>(
    (acc, report) => {
      acc.playersTotal += report.quality.playersTotal;
      acc.starters += report.quality.starters;
      acc.substitutes += report.quality.substitutes;
      acc.benchOnly += report.quality.benchOnly;
      acc.fallbackPositionCount += report.quality.fallbackPositionCount;
      acc.unresolvedPositionCount += report.quality.unresolvedPositionCount;
      acc.missingBioCount += report.quality.missingBioCount;
      acc.withoutStatsCount += report.quality.withoutStatsCount;
      acc.unresolvedTeamCount += report.quality.unresolvedTeamCount;
      if (!report.fixture.groupId) acc.fixturesWithoutGroup += 1;
      return acc;
    },
    {
      playersTotal: 0,
      starters: 0,
      substitutes: 0,
      benchOnly: 0,
      fallbackPositionCount: 0,
      unresolvedPositionCount: 0,
      missingBioCount: 0,
      withoutStatsCount: 0,
      unresolvedTeamCount: 0,
      fixturesWithoutGroup: 0,
    }
  );
};
const printQualityBox = (globalQuality: GlobalQuality): void => {
  printBox(
    "📊 Quick Overview",
    [
      `👥 Players ${globalQuality.playersTotal} | 🧱 Starters ${globalQuality.starters} | 🔁 Substitutes ${globalQuality.substitutes} | 🪑 Bench ${globalQuality.benchOnly}`,
      `🧭 Position inferred ${globalQuality.fallbackPositionCount} | ❓ Position missing ${globalQuality.unresolvedPositionCount}`,
      `🧬 Incomplete profiles ${globalQuality.missingBioCount} | 📉 No stats ${globalQuality.withoutStatsCount} | 🚫 Unresolved teams ${globalQuality.unresolvedTeamCount}`,
      `🗂 Fixtures without groupId ${globalQuality.fixturesWithoutGroup} (may be normal if competition uses stage only)`,
    ],
    ANSI.purple
  );
  console.log("");
};
const accentForTeamKind = (kind: "home" | "away" | "unknown"): string => {
  switch (kind) {
    case "home":
      return ANSI.teal;
    case "away":
      return ANSI.pink;
    default:
      return ANSI.gray;
  }
};
const teamNameColor = (kind: "home" | "away" | "unknown"): string => {
  switch (kind) {
    case "home":
      return ANSI.cyan;
    case "away":
      return ANSI.magenta;
    default:
      return ANSI.white;
  }
};
const formatAverageRating = (
  players: ResolvedPlayerEntry[],
  statTypeMap: Map<number, StatTypeInfo>
): string => {
  const ratings = players
    .map((player) => Number(buildPlayerSummary(player, statTypeMap).rating))
    .filter((value) => Number.isFinite(value));
  if (ratings.length === 0) return "-";
  return (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2);
};
const printPlayerCard = (
  entry: ResolvedPlayerEntry,
  index: number,
  statTypeMap: Map<number, StatTypeInfo>,
  kind: "home" | "away" | "unknown"
): void => {
  const accent = accentForTeamKind(kind);
  const contentWidth = Math.max(72, REPORT_WIDTH - 8);
  const summary = buildPlayerSummary(entry, statTypeMap);
  const position = resolvePositionLabel(entry);
  const role = resolveRole(entry, summary.statMap);
  const name = truncate(entry.player.displayName ?? entry.player.name, 34);
  const positionColor =
    position.label === "Goalkeeper"
      ? ANSI.cyan
      : position.label.includes("Back") ||
          position.label === "Centre-Back" ||
          position.label === "Defender"
        ? ANSI.blue
        : position.label.includes("Midfield") ||
            position.label === "Midfielder" ||
            position.label === "Central Mid." ||
            position.label === "Playmaker" ||
            position.label === "Second Str."
          ? ANSI.yellow
          : position.label === "No position"
            ? ANSI.red
            : ANSI.magenta;
  const headerLines = packInlineItems(
    [
      color(`${String(index + 1).padStart(2, "0")}.`, ANSI.gray),
      color(
        entry.lineup?.jerseyNumber ? `#${entry.lineup.jerseyNumber}` : "#-",
        ANSI.bold,
        ANSI.white
      ),
      color(name, ANSI.bold, ANSI.white),
      summary.captain ? badge("C", ANSI.black, ANSI.bgYellow) : null,
      roleBadge(role),
      color(position.label, positionColor, ANSI.bold),
      ratingBadge(summary.rating),
    ].filter((value): value is string => Boolean(value)),
    contentWidth,
    color("  ", ANSI.gray)
  );
  const lines: string[] = [
    ...headerLines,
    ...buildLabeledItemLines("👤 Profile", buildProfileItems(entry), contentWidth),
    ...buildLabeledItemLines(
      "📌 Highlights",
      buildSummaryMetricItems(summary.statMap),
      contentWidth
    ),
    ...buildLabeledItemLines("🧭 Context", buildContextItems(entry, position), contentWidth),
    ...buildLabeledTextLines("🎬 Events", summarizeEvents(entry.events), contentWidth),
  ];
  const sections = buildStatSections(summary.stats);
  for (const section of sections) {
    lines.push(color(section.title, ANSI.bold, section.accent));
    const statLines = packInlineItems(section.items, Math.max(24, contentWidth - 2));
    lines.push(...statLines.map((line) => `  ${line}`));
  }
  printCard(lines, accent);
};
const printTeamSection = (
  kind: "home" | "away" | "unknown",
  title: string,
  players: ResolvedPlayerEntry[],
  statTypeMap: Map<number, StatTypeInfo>,
  view: ReportView
): void => {
  const accent = accentForTeamKind(kind);
  const highlight = teamNameColor(kind);
  const teamPlayers = players.length;
  const starters = players.filter((player) => {
    const summary = buildPlayerSummary(player, statTypeMap);
    return resolveRole(player, summary.statMap) === "STR";
  }).length;
  const subs = players.filter((player) => {
    const summary = buildPlayerSummary(player, statTypeMap);
    return resolveRole(player, summary.statMap) === "SUB";
  }).length;
  const bench = Math.max(0, teamPlayers - starters - subs);
  const averageRating = formatAverageRating(players, statTypeMap);
  console.log(`${teamBadge(kind)} ${color(title, ANSI.bold, highlight)}`);
  const summaryLines = packInlineItems(
    [
      `👥 ${teamPlayers} players`,
      `🧱 ${starters} titulares`,
      `🔁 ${subs} suplentes`,
      `🪑 ${bench} solo banco`,
      `⭐ Rating medio ${averageRating}`,
    ],
    REPORT_WIDTH - 4
  );
  summaryLines.forEach((line) => console.log(`  ${line}`));
  console.log("");
  if (players.length === 0) {
    console.log(color("  No players in this section", ANSI.dim));
    console.log("");
    return;
  }
  const teamRows: TeamPlayerRow[] = players.map((entry) => {
    const summary = buildPlayerSummary(entry, statTypeMap);
    const position = resolvePositionLabel(entry);
    const role = resolveRole(entry, summary.statMap);
    return {
      entry,
      summary,
      position,
      role,
    };
  });
  const teamHasCompleteStats = teamRows.some((row) => hasCompleteMatchStats(row.summary.statMap));
  const teamHasPartialOnlyStats =
    !teamHasCompleteStats && teamRows.some((row) => row.summary.stats.length > 0);
  const statKeys = [
    ...new Set(
      teamRows.flatMap((row) =>
        row.summary.stats
          .filter((stat) => !BASE_TABLE_STAT_KEYS.has(stat.key))
          .filter((stat) => !COMPACT_HIDDEN_META_KEYS.has(stat.key))
          .filter((stat) => teamHasCompleteStats || !PARTIAL_STATS_NOISE_KEYS.has(stat.key))
          .map((stat) => stat.key)
      )
    ),
  ].sort(sortStatKeys);
  console.log(
    color(`  📋 ${view === "full" ? "Player Summary" : "Players"}`, ANSI.bold, highlight)
  );
  if (teamHasPartialOnlyStats) {
    console.log(
      color(
        "  ⚠️ Partial stats: only ratings/basic data available; hiding detailed columns until full stats arrive.",
        ANSI.yellow
      )
    );
  }
  const legendLines = packInlineItems(buildColumnLegend(statKeys), REPORT_WIDTH - 4);
  legendLines.forEach((line) => console.log(color(`  ℹ ${line}`, ANSI.dim)));
  printTable(
    [
      { header: "#", width: 2, align: "right" },
      { header: "No", width: 4, align: "right" },
      { header: "Player", width: 17 },
      { header: "Role", width: 5 },
      { header: "Pos", width: 10 },
      { header: "Min", width: 3, align: "right" },
      { header: "Goals", width: 5, align: "right" },
      { header: "Ast", width: 5, align: "right" },
      { header: "YC", width: 4, align: "right" },
      { header: "RC", width: 5, align: "right" },
      { header: "Rtg", width: 6, align: "right" },
      ...statKeys.map((key) => {
        const sample = teamRows
          .flatMap((row) => row.summary.stats)
          .find((stat) => stat.key === key);
        const header = sample ? resolveDenseStatHeader(sample) : key.slice(0, 4);
        const width = Math.max(
          visibleLength(header),
          ...teamRows.map((row) => visibleLength(getStatValue(row.summary.statMap, key))),
          1
        );
        return {
          header,
          width,
          align: "right" as const,
        };
      }),
    ],
    teamRows.map((row, index) => [
      color(String(index + 1).padStart(2, "0"), ANSI.gray),
      row.entry.lineup?.jerseyNumber ? `#${row.entry.lineup.jerseyNumber}` : "-",
      color(
        truncate(
          `${row.entry.player.displayName ?? row.entry.player.name}${row.summary.captain ? " (C)" : ""}`,
          17
        ),
        ANSI.bold,
        ANSI.white
      ),
      roleBadge(row.role),
      color(truncate(formatCompactPositionLabel(row.position.label), 10), ANSI.white),
      row.summary.minutes,
      row.summary.goals,
      row.summary.assists,
      row.summary.yellow,
      row.summary.red,
      ratingBadge(row.summary.rating),
      ...statKeys.map((key) => getStatValue(row.summary.statMap, key)),
    ]),
    accent,
    { cellPadding: 0 }
  );
  if (view === "full") {
    console.log("");
    console.log(color("  🧾 Full Profiles", ANSI.bold, highlight));
    console.log("");
    players.forEach((entry, index) => {
      printPlayerCard(entry, index, statTypeMap, kind);
      if (index < players.length - 1) {
        console.log("");
      }
    });
  }
  console.log("");
};
const normalizeFixtureStateText = (state: FixtureStateInfo | null): string => {
  return [state?.state, state?.name, state?.shortName, state?.developerName]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
};
const fixtureHasKeyword = (text: string, keywords: string[]): boolean => {
  return keywords.some((keyword) => text.includes(keyword));
};
const buildFixtureDataNotice = (
  fixture: FixtureWithDetails,
  stateLabel: string,
  resolvedState: FixtureStateInfo | null
): string[] => {
  const hasAnyDetailFeed =
    fixture.lineups.length > 0 ||
    fixture.playerStats.length > 0 ||
    fixture.events.length > 0 ||
    fixture.teamStats.length > 0;
  const hasMatchBasics =
    fixture.homeScore !== null ||
    fixture.awayScore !== null ||
    (fixture.stateId !== null && fixture.stateId !== 1);
  const stateText = normalizeFixtureStateText(resolvedState);
  const kickoffInFuture = fixture.kickoffAt ? fixture.kickoffAt.getTime() > Date.now() : false;
  const isNotStartedLike = fixtureHasKeyword(stateText, [
    "not started",
    "pending",
    "tba",
    "to be announced",
    "ns",
  ]);
  const isDelayedLike = fixtureHasKeyword(stateText, [
    "postponed",
    "suspended",
    "delayed",
    "cancelled",
    "abandoned",
    "walk over",
    "awarded",
  ]);
  if (isNotStartedLike) {
    if (kickoffInFuture) {
      return [
        "⏳ This match has not been played yet; no point in showing the player table or stats.",
        `📦 Current state: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | events ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
      ];
    }
    return [
      "⏳ This match is still listed as not started or pending update in the feed.",
      `📦 Current state: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | events ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
    ];
  }
  if (isDelayedLike && !hasAnyDetailFeed && !hasMatchBasics) {
    return [
      "⏸️ This match is listed as postponed, suspended or cancelled; the player table is not shown.",
      `📦 Current state: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | events ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
    ];
  }
  if (hasAnyDetailFeed || hasMatchBasics) {
    return [
      "⚠️ The match header is in, but the player detail is not yet complete in this sync.",
      `⏳ Current state: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | events ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
    ];
  }
  return [
    "⏳ No lineups or player statistics yet for this match.",
    "📦 For now we only have the base fixture record; once the detail arrives, this view will fill in automatically.",
  ];
};
const printFixtureReport = (
  report: PreparedFixtureReport,
  statTypeMap: Map<number, StatTypeInfo>,
  fixtureIndex: number,
  totalFixtures: number,
  view: ReportView
): void => {
  const { fixture, players, stateLabel, resolvedState, quality } = report;
  const homePlayers = players.filter((player) => player.teamBucket === "home");
  const awayPlayers = players.filter((player) => player.teamBucket === "away");
  const unknownPlayers = players.filter((player) => player.teamBucket === "unknown");
  const title = `Match ${fixtureIndex}/${totalFixtures} · ${fixture.homeTeam?.name ?? "Home"} ${fixture.homeScore ?? "-"} - ${fixture.awayScore ?? "-"} ${fixture.awayTeam?.name ?? "Away"}`;
  const boxLines = [
    ...packInlineItems(
      [
        `🗓 ${formatDate(fixture.kickoffAt)}`,
        stateBadge(stateLabel),
        `🏁 Round ${fixture.round?.name ?? "?"}`,
        `🧱 ${fixture.stage?.name ?? "No stage"}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray)
    ),
    ...packInlineItems(
      [
        `🏟 ${fixture.venue?.name ?? "No venue"}`,
        `🧑‍⚖️ ${fixture.referee?.name ?? "No referee"}`,
        `🆔 ${fixture.id} / ${fixture.sportmonksId}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray)
    ),
    ...packInlineItems(
      [
        `👥 Home ${homePlayers.length}`,
        `👥 Away ${awayPlayers.length}`,
        `❓ No team ${unknownPlayers.length}`,
        `📉 No stats ${quality.withoutStatsCount}`,
        `🧬 Incomplete bio ${quality.missingBioCount}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray)
    ),
    ...packInlineItems(
      [
        `📋 Lineups ${fixture.lineups.length}`,
        `📈 P.Stats ${fixture.playerStats.length}`,
        `🎬 Events ${fixture.events.length}`,
        `📊 T.Stats ${fixture.teamStats.length}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray)
    ),
  ];
  printBox(title, boxLines, ANSI.teal);
  console.log("");
  const stateText = normalizeFixtureStateText(resolvedState);
  const shouldHideTablesForState = fixtureHasKeyword(stateText, [
    "not started",
    "pending",
    "tba",
    "to be announced",
    "ns",
    "postponed",
    "cancelled",
    "walk over",
    "awarded",
  ]);
  if (players.length === 0 || shouldHideTablesForState) {
    buildFixtureDataNotice(fixture, stateLabel, resolvedState).forEach((line, index) => {
      console.log(color(`  ${line}`, index === 0 ? ANSI.yellow : ANSI.dim));
    });
    console.log("");
    printRule();
    console.log("");
    return;
  }
  printTeamSection("home", `${fixture.homeTeam?.name ?? "Home"}`, homePlayers, statTypeMap, view);
  printTeamSection("away", `${fixture.awayTeam?.name ?? "Away"}`, awayPlayers, statTypeMap, view);
  if (unknownPlayers.length > 0) {
    printTeamSection("unknown", "Players with unresolved team", unknownPlayers, statTypeMap, view);
  }
  printRule();
  console.log("");
};
export const reportFixturePlayerDetails = async (
  deps: ReportDependencies,
  rawOptions?: Partial<ReportOptions>
): Promise<void> => {
  const options: ReportOptions =
    rawOptions?.season && rawOptions?.group && rawOptions?.round
      ? {
          season: rawOptions.season,
          group: rawOptions.group,
          round: rawOptions.round,
          view: rawOptions.view === "full" ? "full" : "compact",
        }
      : parseArgs(process.argv.slice(3));
  const { db } = deps;
  const seasons = await db.season.findMany({
    include: {
      league: true,
      stages: {
        include: {
          groups: true,
          rounds: true,
        },
      },
    },
    orderBy: { startingAt: "desc" },
  });
  const season = pickBestCandidate(
    seasons.map((item) => ({
      ...item,
      name: `${item.name} ${item.league.name}`,
    })),
    options.season,
    "season"
  );
  const seasonRecord = seasons.find((item) => item.id === season.id);
  if (!seasonRecord) {
    throw new Error(`Could not load resolved season with ID ${season.id}.`);
  }
  const groups: GroupScopeCandidate[] = seasonRecord.stages.flatMap(
    (stage): GroupScopeCandidate[] => {
      if (stage.groups.length === 0) {
        return [
          {
            id: stage.id,
            sportmonksId: stage.sportmonksId,
            name: stage.name,
            stageId: stage.id,
            stageName: stage.name,
            actualGroupId: null,
          },
        ];
      }
      return stage.groups.map((group) => ({
        id: group.id,
        sportmonksId: group.sportmonksId,
        name: group.name ?? stage.name,
        stageId: stage.id,
        stageName: stage.name,
        actualGroupId: group.id,
      }));
    }
  );
  const matchedGroup = pickBestCandidate(groups, options.group, "group");
  const matchedStage = seasonRecord.stages.find(
    (stage) => stage.id === (matchedGroup as GroupScopeCandidate).stageId
  );
  if (!matchedStage) {
    throw new Error(`Could not resolve stage for group ${matchedGroup.name ?? matchedGroup.id}.`);
  }
  const rounds = matchedStage.rounds.map((round) => ({
    ...round,
    slug: round.slug ?? undefined,
  }));
  const matchedRound = pickBestCandidate(rounds, options.round, "round");
  const groupCandidate = matchedGroup as GroupScopeCandidate;
  const fixtures = await db.fixture.findMany({
    where: {
      seasonId: seasonRecord.id,
      stageId: matchedStage.id,
      roundId: matchedRound.id,
      ...(groupCandidate.actualGroupId !== null ? { groupId: groupCandidate.actualGroupId } : {}),
    },
    include: {
      season: true,
      stage: true,
      round: true,
      group: true,
      venue: true,
      referee: true,
      homeTeam: true,
      awayTeam: true,
      teamStats: true,
      lineups: {
        include: {
          team: true,
          player: {
            include: {
              country: true,
            },
          },
        },
      },
      playerStats: {
        include: {
          player: {
            include: {
              country: true,
            },
          },
        },
      },
      events: {
        include: {
          player: {
            include: {
              country: true,
            },
          },
        },
        orderBy: [{ minute: "asc" }, { extraMinute: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
      },
    },
    orderBy: [{ kickoffAt: "asc" }, { id: "asc" }],
  });
  if (fixtures.length === 0) {
    throw new Error(
      `No matches found for season="${seasonRecord.name}", group="${matchedGroup.name ?? matchedStage.name}" and round="${matchedRound.name}".`
    );
  }
  const statTypeIds = [
    ...new Set(
      fixtures
        .flatMap((fixture) => fixture.playerStats.map((stat) => stat.typeId))
        .filter((id): id is number => id !== null)
    ),
  ];
  const fixtureStateIds = [
    ...new Set(
      fixtures.map((fixture) => fixture.stateId).filter((id): id is number => id !== null)
    ),
  ];
  const playerIds = [
    ...new Set(
      fixtures.flatMap((fixture) => [
        ...fixture.lineups.map((lineup) => lineup.playerId),
        ...fixture.playerStats.map((stat) => stat.playerId),
        ...fixture.events.map((event) => event.playerId).filter((id): id is number => id !== null),
      ])
    ),
  ];
  const teamIds = [
    ...new Set(
      fixtures
        .flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId])
        .filter((id): id is number => id !== null)
    ),
  ];
  const statTypes =
    statTypeIds.length > 0
      ? await db.statType.findMany({ where: { id: { in: statTypeIds } } })
      : [];
  const states =
    fixtureStateIds.length > 0
      ? await db.fixtureState.findMany({ where: { id: { in: fixtureStateIds } } })
      : [];
  const squadMemberships =
    playerIds.length > 0 && teamIds.length > 0
      ? await db.squadMembership.findMany({
          where: {
            seasonId: seasonRecord.id,
            playerId: { in: playerIds },
            teamId: { in: teamIds },
          },
          select: {
            playerId: true,
            teamId: true,
            seasonId: true,
            from: true,
            to: true,
          },
          orderBy: { from: "desc" },
        })
      : [];
  const statTypeMap = new Map<number, StatTypeInfo>(
    statTypes.map((type) => [
      type.id,
      {
        name: type.name,
        developerName: type.developerName,
        statGroup: type.statGroup,
      },
    ])
  );
  const stateMap = new Map(states.map((state) => [state.id, state]));
  const preparedReports = fixtures.map((fixture) =>
    prepareFixture(fixture, statTypeMap, squadMemberships, stateMap)
  );
  const globalQuality = buildGlobalQuality(preparedReports);
  printBox(
    "⚽ Professional Matchday Report",
    [
      `🏆 Season ${seasonRecord.name} (${seasonRecord.league.name})`,
      `🧱 Group/Stage ${matchedGroup.name ?? "No name"}  |  Real stage ${matchedStage.name}  |  🏁 Round ${matchedRound.name}`,
      `📦 Fixtures ${preparedReports.length}  |  👁 View ${options.view.toUpperCase()}  |  🔎 --season="${options.season}" --group="${options.group}" --round="${options.round}"`,
    ],
    ANSI.orange
  );
  console.log("");
  printQualityBox(globalQuality);
  preparedReports.forEach((report, index) => {
    printFixtureReport(report, statTypeMap, index + 1, preparedReports.length, options.view);
  });
};
