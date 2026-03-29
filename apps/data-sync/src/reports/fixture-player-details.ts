import type { Prisma, PrismaClient } from "db";

type ReportDependencies = {
  db: PrismaClient;
};

type ReportView = "compact" | "full";

type ReportOptions = {
  season: string;
  group: string;
  jornada: string;
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
      orderBy: [{ minute: "asc" }, { extraMinute: "asc" }, { sortOrder: "asc" }, { id: "asc" }];
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
  position: { label: string; usedFallback: boolean };
  role: string;
};

type DenseStatCategory = "overall" | "offensive" | "defensive" | "discipline" | "goalkeeper" | "other";

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
  24: "Arquero",
  25: "Defensa",
  26: "Mediocampo",
  27: "Delantero",
  148: "Zaguero",
  149: "Volante cont.",
  150: "Enganche",
  151: "9",
  152: "Extremo der.",
  153: "Volante mixto",
  154: "Lateral der.",
  155: "Lateral izq.",
  156: "Extremo izq.",
  157: "Media punta",
  158: "Carrilero",
  163: "Segundo punta",
};

const STAT_LABELS: Record<string, { label: string; short: string }> = {
  ACCURATE_CROSSES: { label: "Centros OK", short: "C.OK" },
  ACCURATE_PASSES: { label: "Pases OK", short: "P.OK" },
  AERIALS_LOST: { label: "Aereos perdidos", short: "Aer P" },
  AERIALS_WON: { label: "Aereos ganados", short: "Aer G" },
  ASSISTS: { label: "Asistencias", short: "A" },
  BLOCKED_SHOTS: { label: "Tiros bloqueados", short: "TB" },
  CLEARANCES: { label: "Despejes", short: "Desp" },
  DISPOSSESSED: { label: "Balones perdidos", short: "Perd" },
  DRIBBLED_ATTEMPTS: { label: "Gambetas intentadas", short: "Gamb" },
  DUELS_LOST: { label: "Duelos perdidos", short: "DP" },
  DUELS_WON: { label: "Duelos ganados", short: "DG" },
  ERROR_LEAD_TO_SHOT: { label: "Errores que terminan en tiro", short: "Err->T" },
  FOULS: { label: "Faltas cometidas", short: "Falt" },
  FOULS_DRAWN: { label: "Faltas recibidas", short: "Rec" },
  GOALS: { label: "Goles", short: "G" },
  GOALS_CONCEDED: { label: "Goles recibidos", short: "GR" },
  GOALKEEPER_GOALS_CONCEDED: { label: "Goles recibidos arquero", short: "GRA" },
  GOOD_HIGH_CLAIM: { label: "Centros aereos asegurados", short: "Cent A" },
  INTERCEPTIONS: { label: "Intercepciones", short: "Int" },
  KEY_PASSES: { label: "Pases clave", short: "P.Cl" },
  LONG_BALLS: { label: "Pases largos", short: "Larg" },
  LONG_BALLS_WON: { label: "Pases largos OK", short: "L.OK" },
  MINUTES_PLAYED: { label: "Minutos", short: "Min" },
  OFFSIDES: { label: "Offsides", short: "Off" },
  PASSES: { label: "Pases", short: "Pas" },
  POSSESSION_LOST: { label: "Perdidas de posesion", short: "Pos P" },
  RATING: { label: "Rating", short: "Rt" },
  REDCARDS: { label: "Rojas", short: "TR" },
  SAVES: { label: "Atajadas", short: "Atj" },
  SAVES_INSIDE_BOX: { label: "Atajadas dentro del area", short: "Atj A" },
  SHOTS_BLOCKED: { label: "Tiros bloqueados", short: "TB" },
  SHOTS_OFF_TARGET: { label: "Tiros afuera", short: "TF" },
  SHOTS_ON_TARGET: { label: "Tiros al arco", short: "TA" },
  SHOTS_TOTAL: { label: "Tiros", short: "T" },
  SUCCESSFUL_DRIBBLES: { label: "Gambetas OK", short: "G.OK" },
  TACKLES: { label: "Entradas", short: "Entr" },
  TOUCHES: { label: "Toques", short: "Toq" },
  TOTAL_CROSSES: { label: "Centros", short: "Cent" },
  TOTAL_DUELS: { label: "Duelos", short: "Duel" },
  YELLOWCARDS: { label: "Amarillas", short: "TA" },
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

const COMPACT_HIDDEN_META_KEYS = new Set([
  "CAPTAIN",
]);

const PARTIAL_STATS_NOISE_KEYS = new Set([
  "GOALS_CONCEDED",
  "GOALKEEPER_GOALS_CONCEDED",
]);

const DENSE_STAT_CATEGORY_META: Record<DenseStatCategory, { title: string; accent: string }> = {
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
  PASSES: "Pases",
  ACCURATE_PASSES: "Pases+",
  KEY_PASSES: "P.Clave",
  TOUCHES: "Toques",
  POSSESSION_LOST: "Pos.Perd",
  LONG_BALLS: "Largos",
  LONG_BALLS_WON: "Larg+",
  AERIALS_WON: "Aereo+",
  AERIALS_LOST: "Aereo-",
  TOTAL_DUELS: "Duelos",
  DUELS_WON: "Duel+",
  DUELS_LOST: "Duel-",
  SHOTS_TOTAL: "Tiros",
  SHOTS_ON_TARGET: "T.Arco",
  SHOTS_OFF_TARGET: "T.Fuera",
  SHOTS_BLOCKED: "T.Bloq",
  BLOCKED_SHOTS: "Bloq",
  SUCCESSFUL_DRIBBLES: "Reg+",
  DRIBBLED_ATTEMPTS: "Reg",
  TOTAL_CROSSES: "Cent",
  ACCURATE_CROSSES: "Cent+",
  OFFSIDES: "Off",
  DISPOSSESSED: "Bal.Perd",
  TACKLES: "Entrad",
  INTERCEPTIONS: "Inter",
  CLEARANCES: "Desp",
  ERROR_LEAD_TO_SHOT: "Err.Tiro",
  SAVES: "Ataj",
  SAVES_INSIDE_BOX: "Atj.Area",
  GOOD_HIGH_CLAIM: "Sal.Aer",
  GOALS_CONCEDED: "Encaj.",
  GOALKEEPER_GOALS_CONCEDED: "Encaj.A",
  FOULS: "Falt",
  FOULS_DRAWN: "F.Rec",
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

function color(text: string, ...codes: string[]): string {
  return `${codes.join("")}${text}${ANSI.reset}`;
}

function badge(text: string, fg: string, bg: string): string {
  return color(` ${text} `, ANSI.bold, fg, bg);
}

function ratingBadge(value: string): string {
  if (value === "-") return badge("--", ANSI.white, ANSI.bgGray);
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return badge(value, ANSI.white, ANSI.bgGray);
  if (numeric >= 7.5) return badge(value, ANSI.black, ANSI.bgGreen);
  if (numeric >= 7) return badge(value, ANSI.black, ANSI.bgCyan);
  if (numeric >= 6.5) return badge(value, ANSI.black, ANSI.bgYellow);
  if (numeric >= 6) return badge(value, ANSI.white, ANSI.bgOrange);
  return badge(value, ANSI.white, ANSI.bgRed);
}

function roleBadge(role: string): string {
  switch (role) {
    case "TIT":
      return badge(role, ANSI.white, ANSI.bgBlue);
    case "SUP":
      return badge(role, ANSI.black, ANSI.bgYellow);
    default:
      return badge(role, ANSI.white, ANSI.bgGray);
  }
}

function stateBadge(state: string): string {
  const normalized = normalizeText(state).replace(/\s+/g, "_");
  if (normalized === "ft") return badge("FT", ANSI.white, ANSI.bgGreen);
  if (normalized === "ht") return badge("HT", ANSI.black, ANSI.bgYellow);
  if (normalized.includes("live")) return badge(state, ANSI.white, ANSI.bgRed);
  return badge(state, ANSI.white, ANSI.bgGray);
}

function teamBadge(kind: "home" | "away" | "unknown"): string {
  switch (kind) {
    case "home":
      return badge("LOCAL", ANSI.white, ANSI.bgBlue);
    case "away":
      return badge("VISITA", ANSI.white, ANSI.bgPurple);
    default:
      return badge("SIN EQ", ANSI.white, ANSI.bgGray);
  }
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function visibleLength(value: string): number {
  return stripAnsi(value).length;
}

function pad(value: string, length: number): string {
  const clean = stripAnsi(value);
  if (clean.length >= length) return value;
  return `${value}${" ".repeat(length - clean.length)}`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function truncateVisible(value: string, maxLength: number): string {
  const clean = stripAnsi(value);
  if (clean.length <= maxLength) return value;
  return truncate(clean, maxLength);
}

function padAlign(value: string, length: number, align: "left" | "right" = "left"): string {
  const cleanLength = visibleLength(value);
  if (cleanLength >= length) return value;
  const padding = " ".repeat(length - cleanLength);
  return align === "right" ? `${padding}${value}` : `${value}${padding}`;
}

function wrapText(value: string, width: number): string[] {
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
}

function printRule(char = "─", width = REPORT_WIDTH): void {
  console.log(color(char.repeat(width), ANSI.gray));
}

function printBox(title: string, lines: string[], accent = ANSI.blue): void {
  const width = Math.min(
    120,
    Math.max(
      title.length + 6,
      ...lines.map((line) => visibleLength(line) + 4),
      40,
    ),
  );

  console.log(color(`┌${"─".repeat(width - 2)}┐`, accent));
  console.log(
    color("│ ", accent) +
      color(truncateVisible(title, width - 4), ANSI.bold, ANSI.white) +
      " ".repeat(Math.max(0, width - 4 - visibleLength(truncateVisible(title, width - 4)))) +
      color(" │", accent),
  );
  console.log(color(`├${"─".repeat(width - 2)}┤`, accent));

  for (const line of lines) {
    const renderedLine = truncateVisible(line, width - 4);
    console.log(
      color("│ ", accent) +
        renderedLine +
        " ".repeat(Math.max(0, width - 4 - visibleLength(renderedLine))) +
        color(" │", accent),
    );
  }

  console.log(color(`└${"─".repeat(width - 2)}┘`, accent));
}

function packInlineItems(items: string[], width: number, separator = color(" • ", ANSI.gray)): string[] {
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
}

function buildLabeledItemLines(label: string, items: string[], width: number): string[] {
  const labelPrefix = `${label} `;
  const labelWidth = visibleLength(labelPrefix);
  const availableWidth = Math.max(24, width - labelWidth);
  const lines = packInlineItems(items, availableWidth);

  if (lines.length === 0) return [];

  return lines.map((line, index) =>
    `${index === 0 ? color(labelPrefix, ANSI.bold, ANSI.white) : " ".repeat(labelWidth)}${line}`
  );
}

function buildLabeledTextLines(label: string, value: string, width: number): string[] {
  const labelPrefix = `${label} `;
  const labelWidth = visibleLength(labelPrefix);
  const availableWidth = Math.max(24, width - labelWidth);
  const wrapped = wrapText(value, availableWidth);

  return wrapped.map((line, index) =>
    `${index === 0 ? color(labelPrefix, ANSI.bold, ANSI.white) : " ".repeat(labelWidth)}${line}`
  );
}

function printCard(lines: string[], accent: string): void {
  const indent = "  ";
  const contentWidth = Math.max(72, REPORT_WIDTH - 8);

  console.log(`${indent}${color(`┌${"─".repeat(contentWidth + 2)}┐`, accent)}`);

  for (const line of lines) {
    const rendered = truncateVisible(line, contentWidth);
    console.log(
      `${indent}${color("│ ", accent)}${rendered}${" ".repeat(Math.max(0, contentWidth - visibleLength(rendered)))}${color(" │", accent)}`,
    );
  }

  console.log(`${indent}${color(`└${"─".repeat(contentWidth + 2)}┘`, accent)}`);
}

type TableColumn = {
  header: string;
  width: number;
  align?: "left" | "right";
};

type TableOptions = {
  cellPadding?: number;
  indent?: string;
};

function printTable(columns: TableColumn[], rows: string[][], accent: string, options?: TableOptions): void {
  const indent = options?.indent ?? "  ";
  const cellPadding = options?.cellPadding ?? 1;
  const paddedWidth = (column: TableColumn) => column.width + (cellPadding * 2);
  const renderBorder = (left: string, middle: string, right: string): string =>
    `${indent}${color(left, accent)}${columns
      .map((column, index) =>
        `${color("─".repeat(paddedWidth(column)), accent)}${index < columns.length - 1 ? color(middle, accent) : ""}`
      )
      .join("")}${color(right, accent)}`;

  const renderRow = (cells: string[]): string => {
    const formatted = columns.map((column, index) =>
      `${" ".repeat(cellPadding)}${padAlign(truncateVisible(cells[index] ?? "", column.width), column.width, column.align ?? "left")}${" ".repeat(cellPadding)}`
    );

    return `${indent}${color("│", accent)}${formatted.join(color("│", accent))}${color("│", accent)}`;
  };

  console.log(renderBorder("┌", "┬", "┐"));
  console.log(
    renderRow(columns.map((column) => color(column.header, ANSI.bold, ANSI.white))),
  );
  console.log(renderBorder("├", "┼", "┤"));

  rows.forEach((row, index) => {
    console.log(renderRow(row));
    if (index < rows.length - 1) {
      console.log(renderBorder("├", "┼", "┤"));
    }
  });

  console.log(renderBorder("└", "┴", "┘"));
}

function printWrappedLine(label: string, value: string, indent = 5, width = REPORT_WIDTH): void {
  const prefix = `${" ".repeat(indent)}${pad(color(`${label}:`, ANSI.bold, ANSI.gray), LABEL_WIDTH)}`;
  const continuation = `${" ".repeat(indent)}${" ".repeat(LABEL_WIDTH)}`;
  const wrapped = wrapText(value, width - prefix.length);

  wrapped.forEach((line, index) => {
    console.log(`${index === 0 ? prefix : continuation}${line}`);
  });
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-UY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Montevideo",
  }).format(value);
}

function formatDateOnly(value: Date | null | undefined): string {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-UY", {
    dateStyle: "medium",
    timeZone: "America/Montevideo",
  }).format(value);
}

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  const dayDiff = now.getUTCDate() - dateOfBirth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractNumbers(value: string | null | undefined): number[] {
  if (!value) return [];
  return [...value.matchAll(/\d+/g)].map((match) => Number(match[0])).filter(Number.isFinite);
}

function rankCandidate(query: string, entity: MatchableEntity): number {
  const normalizedQuery = normalizeText(query);
  const queryNumbers = extractNumbers(query);
  const names = [entity.name, entity.slug]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeText(value));

  let score = 0;

  if (String(entity.id) === query) score += 1000;
  if (entity.sportmonksId !== null && entity.sportmonksId !== undefined && String(entity.sportmonksId) === query) {
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
  if (queryNumbers.length > 0 && candidateNumbers.some((candidate) => queryNumbers.includes(candidate))) {
    score += 700;
  }

  return score;
}

function pickBestCandidate<T extends MatchableEntity>(
  items: T[],
  query: string,
  label: string,
): T {
  if (items.length === 0) {
    throw new Error(`No hay ${label}s cargados para resolver "${query}".`);
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

  throw new Error(`No pude encontrar ${label} para "${query}". Algunas opciones: ${sample}`);
}

function parseArgs(argv: string[]): ReportOptions {
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
  const jornada = argMap.get("jornada");
  const rawView = normalizeText(argMap.get("view"));
  const view: ReportView = rawView === "full" ? "full" : "compact";

  if (!season || !group || !jornada) {
    throw new Error(
      'Faltan argumentos. Uso: pnpm report:fixture-players --season="2026" --group="Apertura" --jornada="1" [--view="compact|full"]',
    );
  }

  return { season, group, jornada, view };
}

function normalizeStatKey(value: string | null | undefined): string {
  return (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toStatValueString(value: Prisma.JsonValue | null): string {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function toStatNumber(value: Prisma.JsonValue | null): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    return toStatNumber((value as { value?: Prisma.JsonValue | null }).value ?? null);
  }
  return null;
}

function toStatBoolean(value: Prisma.JsonValue | null): boolean {
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
    return toStatBoolean((value as { value?: Prisma.JsonValue | null }).value ?? null);
  }
  return false;
}

function resolveStatLabel(key: string, fallbackName: string | null | undefined): { label: string; short: string } {
  const known = STAT_LABELS[key];
  if (known) return known;

  const base = (fallbackName ?? key)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const title = base
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");

  return { label: title || key, short: title.slice(0, 4) || key.slice(0, 4) };
}

function resolveStatCategory(key: string, statGroup: string | null | undefined): PreparedStat["category"] {
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
}

function comparePreparedStats(left: PreparedStat, right: PreparedStat): number {
  const leftPriority = CATEGORY_PRIORITY[left.category];
  const rightPriority = CATEGORY_PRIORITY[right.category];
  if (leftPriority !== rightPriority) return leftPriority - rightPriority;

  const leftHeadlineIndex = HEADLINE_KEYS.indexOf(left.key);
  const rightHeadlineIndex = HEADLINE_KEYS.indexOf(right.key);
  const safeLeft = leftHeadlineIndex === -1 ? Number.MAX_SAFE_INTEGER : leftHeadlineIndex;
  const safeRight = rightHeadlineIndex === -1 ? Number.MAX_SAFE_INTEGER : rightHeadlineIndex;
  if (safeLeft !== safeRight) return safeLeft - safeRight;

  return left.label.localeCompare(right.label, "es");
}

function buildSyntheticPreparedStat(key: string, numericValue: number): PreparedStat {
  const labels = resolveStatLabel(key, key);

  return {
    key,
    label: labels.label,
    shortLabel: labels.short,
    value: String(numericValue),
    numericValue,
    category: resolveStatCategory(key, null),
  };
}

function buildEventFallbackTotals(events: EventWithPlayer[]): { goals: number; yellow: number; red: number } {
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
    { goals: 0, yellow: 0, red: 0 },
  );
}

function applyEventFallbackStats(stats: PreparedStat[], events: EventWithPlayer[]): PreparedStat[] {
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
}

function prepareStats(
  stats: PlayerStatWithPlayer[],
  statTypeMap: Map<number, StatTypeInfo>,
): PreparedStat[] {
  return stats
    .map((stat) => {
      const typeInfo = stat.typeId ? statTypeMap.get(stat.typeId) : null;
      const key = normalizeStatKey(typeInfo?.developerName ?? typeInfo?.name ?? `TYPE_${stat.typeId ?? "N_A"}`);
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
}

function buildStatMap(stats: PreparedStat[]): Map<string, PreparedStat> {
  return new Map(stats.map((stat) => [stat.key, stat]));
}

function getStatValue(stats: Map<string, PreparedStat>, key: string): string {
  return stats.get(key)?.value ?? "-";
}

function getStatNumber(stats: Map<string, PreparedStat>, key: string): number | null {
  return stats.get(key)?.numericValue ?? null;
}

function buildComboStat(
  stats: Map<string, PreparedStat>,
  madeKey: string,
  totalKey: string,
  label: string,
): string | null {
  const made = getStatValue(stats, madeKey);
  const total = getStatValue(stats, totalKey);
  if (made === "-" && total === "-") return null;
  if (made !== "-" && total !== "-") return `${label} ${made}/${total}`;
  return `${label} ${made !== "-" ? made : total}`;
}

function findRawStatValue(
  stats: PlayerStatWithPlayer[],
  statTypeMap: Map<number, StatTypeInfo>,
  targetKey: string,
): Prisma.JsonValue | null {
  const match = stats.find((stat) => {
    const typeInfo = stat.typeId ? statTypeMap.get(stat.typeId) : null;
    const key = normalizeStatKey(typeInfo?.developerName ?? typeInfo?.name ?? `TYPE_${stat.typeId ?? "N_A"}`);
    return key === targetKey;
  });

  return match?.value ?? null;
}

function hasCompleteMatchStats(statMap: Map<string, PreparedStat>): boolean {
  return [...COMPLETE_MATCH_STAT_KEYS].some((key) => getStatValue(statMap, key) !== "-");
}

function buildPlayerSummary(entry: ResolvedPlayerEntry, statTypeMap: Map<number, StatTypeInfo>): PlayerSummaryData {
  const stats = applyEventFallbackStats(
    prepareStats(entry.stats, statTypeMap)
      .filter((stat) => !COMPACT_HIDDEN_META_KEYS.has(stat.key)),
    entry.events,
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
}

function resolvePositionLabel(entry: ResolvedPlayerEntry): { label: string; usedFallback: boolean } {
  if (entry.lineup?.position) {
    return { label: entry.lineup.position, usedFallback: false };
  }

  const detailed = entry.player.detailedPositionId ? POSITION_LABELS[entry.player.detailedPositionId] : null;
  if (detailed) return { label: detailed, usedFallback: true };

  const general = entry.player.positionId ? POSITION_LABELS[entry.player.positionId] : null;
  if (general) return { label: general, usedFallback: true };

  return { label: "Pos no cargada", usedFallback: false };
}

function resolveRole(entry: ResolvedPlayerEntry, statMap: Map<string, PreparedStat>): string {
  if (entry.lineup?.formationPosition !== null && entry.lineup?.formationPosition !== undefined) return "TIT";

  const minutes = getStatNumber(statMap, "MINUTES_PLAYED");
  if ((minutes ?? 0) > 0 || entry.stats.length > 0 || entry.events.length > 0) return "SUP";

  return "BAN";
}

function summarizeEvents(events: EventWithPlayer[]): string {
  if (events.length === 0) return "Sin eventos";

  return events
    .map((event) => {
      const minute = event.minute !== null
        ? `${event.minute}${event.extraMinute ? `+${event.extraMinute}` : ""}'`
        : "s/min";

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
          const parts = [event.info, event.addition].filter((value): value is string => Boolean(value));
          return `📝 ${minute} ${parts.join(" ").trim()}`.trim();
        }
      }
    })
    .join(" | ");
}

function buildProfileItems(entry: ResolvedPlayerEntry): string[] {
  const age = calculateAge(entry.player.dateOfBirth);

  return [
    `🌍 ${entry.player.country?.name ?? "Pais s/dato"}`,
    age !== null ? `🎂 ${age}a` : null,
    entry.player.height ? `📏 ${entry.player.height} cm` : null,
    entry.player.weight ? `⚖️ ${entry.player.weight} kg` : null,
    entry.player.dateOfBirth ? `📅 ${formatDateOnly(entry.player.dateOfBirth)}` : null,
  ].filter((value): value is string => Boolean(value));
}

function buildContextItems(entry: ResolvedPlayerEntry, position: { label: string; usedFallback: boolean }): string[] {
  return [
    entry.teamName ? `🏟 ${entry.teamName}` : null,
    entry.player.commonName && entry.player.commonName !== entry.player.displayName ? `🪪 ${entry.player.commonName}` : null,
    `🆔 Player ${entry.player.id}`,
    entry.player.sportmonksId ? `🧩 SM ${entry.player.sportmonksId}` : null,
    entry.lineup ? `📋 Lineup ${entry.lineup.id}` : "📋 Sin lineup",
    entry.lineup?.formationPosition !== null && entry.lineup?.formationPosition !== undefined
      ? `🧭 XI ${entry.lineup.formationPosition}`
      : null,
    position.usedFallback ? "🛟 Posicion inferida desde ficha" : null,
    position.label === "Pos no cargada" ? "🚫 Posicion sin dato" : null,
  ].filter((value): value is string => Boolean(value));
}

function buildSummaryMetricItems(statMap: Map<string, PreparedStat>): string[] {
  const items = [
    getStatValue(statMap, "MINUTES_PLAYED") !== "-" ? `⏱ ${getStatValue(statMap, "MINUTES_PLAYED")} min` : null,
    getStatValue(statMap, "RATING") !== "-" ? `⭐ Rating ${getStatValue(statMap, "RATING")}` : null,
    getStatValue(statMap, "GOALS") !== "-" ? `⚽ Goles ${getStatValue(statMap, "GOALS")}` : null,
    getStatValue(statMap, "ASSISTS") !== "-" ? `🅰 Asist ${getStatValue(statMap, "ASSISTS")}` : null,
    getStatValue(statMap, "YELLOWCARDS") !== "-" ? `🟨 Amarillas ${getStatValue(statMap, "YELLOWCARDS")}` : null,
    getStatValue(statMap, "REDCARDS") !== "-" ? `🟥 Rojas ${getStatValue(statMap, "REDCARDS")}` : null,
    buildComboStat(statMap, "ACCURATE_PASSES", "PASSES", "🎯 Pases"),
    buildComboStat(statMap, "DUELS_WON", "TOTAL_DUELS", "🤺 Duelos"),
    buildComboStat(statMap, "SHOTS_ON_TARGET", "SHOTS_TOTAL", "🥅 Tiros"),
    buildComboStat(statMap, "SUCCESSFUL_DRIBBLES", "DRIBBLED_ATTEMPTS", "🪄 Gambetas"),
    buildComboStat(statMap, "ACCURATE_CROSSES", "TOTAL_CROSSES", "📨 Centros"),
    buildComboStat(statMap, "LONG_BALLS_WON", "LONG_BALLS", "🚀 Largos"),
    getStatValue(statMap, "TOUCHES") !== "-" ? `👟 Toques ${getStatValue(statMap, "TOUCHES")}` : null,
    getStatValue(statMap, "POSSESSION_LOST") !== "-" ? `📉 Perdidas ${getStatValue(statMap, "POSSESSION_LOST")}` : null,
    getStatValue(statMap, "SAVES") !== "-" ? `🧤 Atajadas ${getStatValue(statMap, "SAVES")}` : null,
    getStatValue(statMap, "GOALS_CONCEDED") !== "-" ? `🥅 Goles recibidos ${getStatValue(statMap, "GOALS_CONCEDED")}` : null,
  ].filter((value): value is string => Boolean(value));

  return items.length > 0 ? items : ["Sin resumen estadistico"];
}

function formatStatComboCell(
  stats: Map<string, PreparedStat>,
  madeKey: string,
  totalKey: string,
): string {
  const made = getStatValue(stats, madeKey);
  const total = getStatValue(stats, totalKey);

  if (made === "-" && total === "-") return "-";
  if (made !== "-" && total !== "-") return `${made}/${total}`;
  return made !== "-" ? made : total;
}

function formatCompactPositionLabel(value: string): string {
  switch (value) {
    case "Lateral der.":
      return "Lat. der.";
    case "Lateral izq.":
      return "Lat. izq.";
    case "Volante cont.":
      return "Vol. cont.";
    case "Volante mixto":
      return "Vol. mixt.";
    case "Extremo der.":
      return "Ext. der.";
    case "Extremo izq.":
      return "Ext. izq.";
    case "Media punta":
      return "Med. punta";
    case "Segundo punta":
      return "2do punta";
    case "Mediocampo":
      return "Medio";
    case "Delantero":
      return "Delant.";
    case "Carrilero":
      return "Carril.";
    default:
      return value;
  }
}

function resolveDenseStatCategory(stat: PreparedStat): DenseStatCategory | null {
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
}

function resolveDenseStatHeader(stat: PreparedStat): string {
  return STAT_COLUMN_HEADERS[stat.key] ?? stat.shortLabel ?? stat.label.slice(0, 5);
}

function sortStatKeys(left: string, right: string): number {
  const leftIndex = STAT_COLUMN_ORDER.indexOf(left);
  const rightIndex = STAT_COLUMN_ORDER.indexOf(right);
  const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
  const safeRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

  if (safeLeft !== safeRight) return safeLeft - safeRight;
  return left.localeCompare(right, "es");
}

function buildColumnLegend(statKeys: string[]): string[] {
  const items = ["Dors=dorsal", "Punt=puntuacion"];

  if (statKeys.some((key) => key.includes("ACCURATE") || key.endsWith("_WON"))) {
    items.push("+= acertado/ganado");
  }
  if (statKeys.includes("POSSESSION_LOST")) {
    items.push("Pos.Perd=posesiones perdidas");
  }
  if (statKeys.includes("DISPOSSESSED")) {
    items.push("Bal.Perd=balones perdidos");
  }
  if (statKeys.includes("GOOD_HIGH_CLAIM")) {
    items.push("Sal.Aer=salidas aereas");
  }
  if (statKeys.includes("SAVES_INSIDE_BOX")) {
    items.push("Atj.Area=atajadas dentro del area");
  }
  if (statKeys.some((key) => key === "GOALS_CONCEDED" || key === "GOALKEEPER_GOALS_CONCEDED")) {
    items.push("Encaj.=goles encajados/recibidos");
  }
  if (statKeys.includes("ERROR_LEAD_TO_SHOT")) {
    items.push("Err.Tiro=error que termina en tiro");
  }

  return items;
}

function printDenseStatTables(rows: TeamPlayerRow[], kind: "home" | "away" | "unknown"): void {
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
      { header: "Jug", width: 14 },
      ...statKeys.map((key) => {
        const stat = bucket.get(key)!;
        const header = resolveDenseStatHeader(stat);
        const width = Math.max(
          visibleLength(header),
          ...rows.map((row) => visibleLength(getStatValue(row.summary.statMap, key))),
          1,
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
        color(truncate(row.entry.player.displayName ?? row.entry.player.name, 14), ANSI.bold, ANSI.white),
        ...statKeys.map((key) => getStatValue(row.summary.statMap, key)),
      ]),
      accentForTeamKind(kind),
      { cellPadding: 0 },
    );
    console.log("");
  }
}

function buildStatSections(stats: PreparedStat[]): StatSection[] {
  const excluded = new Set([...HEADLINE_KEYS, "YELLOWCARDS", "REDCARDS"]);
  const buildItems = (items: PreparedStat[], extraExcluded?: Set<string>) =>
    items
      .filter((stat) => !excluded.has(stat.key) && !(extraExcluded?.has(stat.key) ?? false))
      .map((stat) => `${stat.label}: ${stat.value}`);

  const sections: StatSection[] = [
    {
      title: "🎮 Juego",
      accent: ANSI.cyan,
      items: buildItems(stats.filter((stat) => stat.category === "overall")),
    },
    {
      title: "⚔️ Ataque",
      accent: ANSI.orange,
      items: buildItems(stats.filter((stat) => stat.category === "offensive")),
    },
    {
      title: "🛡️ Defensa",
      accent: ANSI.blue,
      items: buildItems(stats.filter((stat) => stat.category === "defensive")),
    },
    {
      title: "🚨 Disciplina",
      accent: ANSI.red,
      items: buildItems(
        stats.filter((stat) => stat.category === "discipline" || ["FOULS", "FOULS_DRAWN"].includes(stat.key)),
        new Set(["FOULS", "FOULS_DRAWN"]),
      ).concat(
        stats
          .filter((stat) => ["FOULS", "FOULS_DRAWN"].includes(stat.key))
          .map((stat) => `${stat.label}: ${stat.value}`),
      ),
    },
    {
      title: "🧩 Otros",
      accent: ANSI.purple,
      items: buildItems(stats.filter((stat) => stat.category === "other")),
    },
  ];

  return sections.filter((section) => section.items.length > 0);
}

function comparePlayerEntries(left: ResolvedPlayerEntry, right: ResolvedPlayerEntry): number {
  const leftFormation = left.lineup?.formationPosition ?? Number.MAX_SAFE_INTEGER;
  const rightFormation = right.lineup?.formationPosition ?? Number.MAX_SAFE_INTEGER;
  if (leftFormation !== rightFormation) return leftFormation - rightFormation;

  const leftJersey = left.lineup?.jerseyNumber ?? Number.MAX_SAFE_INTEGER;
  const rightJersey = right.lineup?.jerseyNumber ?? Number.MAX_SAFE_INTEGER;
  if (leftJersey !== rightJersey) return leftJersey - rightJersey;

  return (left.player.displayName ?? left.player.name).localeCompare(
    right.player.displayName ?? right.player.name,
    "es",
  );
}

function resolveTeamBucket(
  fixture: FixtureWithDetails,
  teamId: number | null,
): { teamBucket: "home" | "away" | "unknown"; teamName: string | null } {
  if (teamId !== null && fixture.homeTeamId === teamId) {
    return { teamBucket: "home", teamName: fixture.homeTeam?.name ?? "Local" };
  }
  if (teamId !== null && fixture.awayTeamId === teamId) {
    return { teamBucket: "away", teamName: fixture.awayTeam?.name ?? "Visitante" };
  }
  return { teamBucket: "unknown", teamName: null };
}

function resolveMembershipTeamId(
  memberships: SquadMembershipLite[],
  fixture: FixtureWithDetails,
  playerId: number,
): number | null {
  const fixtureDate = fixture.kickoffAt ?? new Date();
  const membership = memberships.find((item) =>
    item.playerId === playerId &&
    item.seasonId === fixture.seasonId &&
    (item.teamId === fixture.homeTeamId || item.teamId === fixture.awayTeamId) &&
    item.from <= fixtureDate &&
    (item.to === null || item.to >= fixtureDate),
  );

  return membership?.teamId ?? null;
}

function prepareFixture(
  fixture: FixtureWithDetails,
  statTypeMap: Map<number, StatTypeInfo>,
  squadMemberships: SquadMembershipLite[],
  stateMap: Map<number, FixtureStateInfo>,
): PreparedFixtureReport {
  const lineupByPlayerId = new Map<number, LineupWithPlayer>(
    fixture.lineups.map((lineup) => [lineup.playerId, lineup]),
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
      if (role === "TIT") acc.starters += 1;
      if (role === "SUP") acc.substitutes += 1;
      if (role === "BAN") acc.benchOnly += 1;
      if (position.usedFallback) acc.fallbackPositionCount += 1;
      if (position.label === "Pos no cargada") acc.unresolvedPositionCount += 1;
      if (!playerEntry.player.country || !playerEntry.player.dateOfBirth || !playerEntry.player.displayName) {
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
    },
  );

  const resolvedState = fixture.stateId ? stateMap.get(fixture.stateId) ?? null : null;
  const stateLabel = resolvedState?.state ?? resolvedState?.name ?? "Sin estado";

  return {
    fixture,
    stateLabel,
    resolvedState,
    players,
    quality,
  };
}

function buildGlobalQuality(reports: PreparedFixtureReport[]): GlobalQuality {
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
    },
  );
}

function printQualityBox(globalQuality: GlobalQuality): void {
  printBox("📊 Lectura Rápida", [
    `👥 Jugadores ${globalQuality.playersTotal} | 🧱 Titulares ${globalQuality.starters} | 🔁 Suplentes ${globalQuality.substitutes} | 🪑 Banco ${globalQuality.benchOnly}`,
    `🧭 Posición inferida ${globalQuality.fallbackPositionCount} | ❓ Posición vacía ${globalQuality.unresolvedPositionCount}`,
    `🧬 Fichas incompletas ${globalQuality.missingBioCount} | 📉 Sin stats ${globalQuality.withoutStatsCount} | 🚫 Equipos sin resolver ${globalQuality.unresolvedTeamCount}`,
    `🗂 Fixtures sin groupId ${globalQuality.fixturesWithoutGroup} (puede ser normal si la competencia vive por stage)`,
  ], ANSI.purple);
  console.log("");
}

function accentForTeamKind(kind: "home" | "away" | "unknown"): string {
  switch (kind) {
    case "home":
      return ANSI.teal;
    case "away":
      return ANSI.pink;
    default:
      return ANSI.gray;
  }
}

function teamNameColor(kind: "home" | "away" | "unknown"): string {
  switch (kind) {
    case "home":
      return ANSI.cyan;
    case "away":
      return ANSI.magenta;
    default:
      return ANSI.white;
  }
}

function formatAverageRating(players: ResolvedPlayerEntry[], statTypeMap: Map<number, StatTypeInfo>): string {
  const ratings = players
    .map((player) => Number(buildPlayerSummary(player, statTypeMap).rating))
    .filter((value) => Number.isFinite(value));

  if (ratings.length === 0) return "-";

  return (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2);
}

function printPlayerCard(
  entry: ResolvedPlayerEntry,
  index: number,
  statTypeMap: Map<number, StatTypeInfo>,
  kind: "home" | "away" | "unknown",
): void {
  const accent = accentForTeamKind(kind);
  const contentWidth = Math.max(72, REPORT_WIDTH - 8);
  const summary = buildPlayerSummary(entry, statTypeMap);
  const position = resolvePositionLabel(entry);
  const role = resolveRole(entry, summary.statMap);
  const name = truncate(entry.player.displayName ?? entry.player.name, 34);
  const positionColor = position.label === "Arquero"
    ? ANSI.cyan
    : position.label.includes("Lateral") || position.label === "Zaguero" || position.label === "Defensa"
      ? ANSI.blue
      : position.label.includes("Volante") || position.label === "Mediocampo" || position.label === "Enganche" || position.label === "Media punta"
        ? ANSI.yellow
        : position.label === "Pos no cargada"
          ? ANSI.red
          : ANSI.magenta;

  const headerLines = packInlineItems(
    [
      color(`${String(index + 1).padStart(2, "0")}.`, ANSI.gray),
      color(entry.lineup?.jerseyNumber ? `#${entry.lineup.jerseyNumber}` : "#-", ANSI.bold, ANSI.white),
      color(name, ANSI.bold, ANSI.white),
      summary.captain ? badge("C", ANSI.black, ANSI.bgYellow) : null,
      roleBadge(role),
      color(position.label, positionColor, ANSI.bold),
      ratingBadge(summary.rating),
    ].filter((value): value is string => Boolean(value)),
    contentWidth,
    color("  ", ANSI.gray),
  );

  const lines: string[] = [
    ...headerLines,
    ...buildLabeledItemLines("👤 Perfil", buildProfileItems(entry), contentWidth),
    ...buildLabeledItemLines("📌 Claves", buildSummaryMetricItems(summary.statMap), contentWidth),
    ...buildLabeledItemLines("🧭 Contexto", buildContextItems(entry, position), contentWidth),
    ...buildLabeledTextLines("🎬 Eventos", summarizeEvents(entry.events), contentWidth),
  ];

  const sections = buildStatSections(summary.stats);
  for (const section of sections) {
    lines.push(color(section.title, ANSI.bold, section.accent));
    const statLines = packInlineItems(section.items, Math.max(24, contentWidth - 2));
    lines.push(...statLines.map((line) => `  ${line}`));
  }

  printCard(lines, accent);
}

function printTeamSection(
  kind: "home" | "away" | "unknown",
  title: string,
  players: ResolvedPlayerEntry[],
  statTypeMap: Map<number, StatTypeInfo>,
  view: ReportView,
): void {
  const accent = accentForTeamKind(kind);
  const highlight = teamNameColor(kind);
  const teamPlayers = players.length;
  const starters = players.filter((player) => {
    const summary = buildPlayerSummary(player, statTypeMap);
    return resolveRole(player, summary.statMap) === "TIT";
  }).length;
  const subs = players.filter((player) => {
    const summary = buildPlayerSummary(player, statTypeMap);
    return resolveRole(player, summary.statMap) === "SUP";
  }).length;
  const bench = Math.max(0, teamPlayers - starters - subs);
  const averageRating = formatAverageRating(players, statTypeMap);

  console.log(`${teamBadge(kind)} ${color(title, ANSI.bold, highlight)}`);
  const summaryLines = packInlineItems(
    [
      `👥 ${teamPlayers} jugadores`,
      `🧱 ${starters} titulares`,
      `🔁 ${subs} suplentes`,
      `🪑 ${bench} solo banco`,
      `⭐ Rating medio ${averageRating}`,
    ],
    REPORT_WIDTH - 4,
  );
  summaryLines.forEach((line) => console.log(`  ${line}`));
  console.log("");

  if (players.length === 0) {
    console.log(color("  Sin jugadores en este bloque", ANSI.dim));
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
  const teamHasPartialOnlyStats = !teamHasCompleteStats && teamRows.some((row) => row.summary.stats.length > 0);

  const statKeys = [...new Set(
    teamRows.flatMap((row) =>
      row.summary.stats
        .filter((stat) => !BASE_TABLE_STAT_KEYS.has(stat.key))
        .filter((stat) => !COMPACT_HIDDEN_META_KEYS.has(stat.key))
        .filter((stat) => teamHasCompleteStats || !PARTIAL_STATS_NOISE_KEYS.has(stat.key))
        .map((stat) => stat.key)
    ),
  )].sort(sortStatKeys);

  console.log(color(`  📋 ${view === "full" ? "Resumen jugadores" : "Jugadores"}`, ANSI.bold, highlight));
  if (teamHasPartialOnlyStats) {
    console.log(color("  ⚠️ Stats parciales: llegaron solo ratings/datos base; oculto columnas ruidosas hasta tener stats completas.", ANSI.yellow));
  }
  const legendLines = packInlineItems(buildColumnLegend(statKeys), REPORT_WIDTH - 4);
  legendLines.forEach((line) => console.log(color(`  ℹ ${line}`, ANSI.dim)));
  printTable(
    [
      { header: "#", width: 2, align: "right" },
      { header: "Dors", width: 4, align: "right" },
      { header: "Jugador", width: 17 },
      { header: "Rol", width: 5 },
      { header: "Posic", width: 10 },
      { header: "Min", width: 3, align: "right" },
      { header: "Goles", width: 5, align: "right" },
      { header: "Asist", width: 5, align: "right" },
      { header: "Amar", width: 4, align: "right" },
      { header: "Rojas", width: 5, align: "right" },
      { header: "Punt", width: 6, align: "right" },
      ...statKeys.map((key) => {
        const sample = teamRows
          .flatMap((row) => row.summary.stats)
          .find((stat) => stat.key === key);
        const header = sample ? resolveDenseStatHeader(sample) : key.slice(0, 4);
        const width = Math.max(
          visibleLength(header),
          ...teamRows.map((row) => visibleLength(getStatValue(row.summary.statMap, key))),
          1,
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
      color(truncate(`${row.entry.player.displayName ?? row.entry.player.name}${row.summary.captain ? " (C)" : ""}`, 17), ANSI.bold, ANSI.white),
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
    { cellPadding: 0 },
  );

  if (view === "full") {
    console.log("");
    console.log(color("  🧾 Fichas completas", ANSI.bold, highlight));
    console.log("");

    players.forEach((entry, index) => {
      printPlayerCard(entry, index, statTypeMap, kind);
      if (index < players.length - 1) {
        console.log("");
      }
    });
  }

  console.log("");
}

function normalizeFixtureStateText(state: FixtureStateInfo | null): string {
  return [
    state?.state,
    state?.name,
    state?.shortName,
    state?.developerName,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function fixtureHasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildFixtureDataNotice(
  fixture: FixtureWithDetails,
  stateLabel: string,
  resolvedState: FixtureStateInfo | null,
): string[] {
  const hasAnyDetailFeed = fixture.lineups.length > 0 || fixture.playerStats.length > 0 || fixture.events.length > 0 || fixture.teamStats.length > 0;
  const hasMatchBasics = fixture.homeScore !== null || fixture.awayScore !== null || (fixture.stateId !== null && fixture.stateId !== 1);
  const stateText = normalizeFixtureStateText(resolvedState);
  const kickoffInFuture = fixture.kickoffAt ? fixture.kickoffAt.getTime() > Date.now() : false;
  const isNotStartedLike = fixtureHasKeyword(stateText, ["not started", "pending", "tba", "to be announced", "ns"]);
  const isDelayedLike = fixtureHasKeyword(stateText, ["postponed", "suspended", "delayed", "cancelled", "abandoned", "walk over", "awarded"]);

  if (isNotStartedLike) {
    if (kickoffInFuture) {
      return [
        "⏳ Este partido todavía no se jugó; por eso no tiene sentido pintar tabla de jugadores ni stats.",
        `📦 Estado actual: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | eventos ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
      ];
    }

    return [
      "⏳ Este partido sigue figurando como no iniciado o pendiente de actualización en el feed.",
      `📦 Estado actual: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | eventos ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
    ];
  }

  if (isDelayedLike && !hasAnyDetailFeed && !hasMatchBasics) {
    return [
      "⏸️ Este partido figura como aplazado, suspendido o cancelado; por eso no se muestra tabla de jugadores.",
      `📦 Estado actual: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | eventos ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
    ];
  }

  if (hasAnyDetailFeed || hasMatchBasics) {
    return [
      "⚠️ La cabecera del partido ya llegó, pero el detalle de jugadores todavía no está completo en esta sync.",
      `⏳ Estado actual: ${stateLabel} | lineups ${fixture.lineups.length} | playerStats ${fixture.playerStats.length} | eventos ${fixture.events.length} | teamStats ${fixture.teamStats.length}.`,
    ];
  }

  return [
    "⏳ Todavía no hay alineaciones ni estadísticas de jugadores para este partido.",
    "📦 Por ahora solo tenemos la ficha base del fixture; cuando llegue el detalle, esta vista se llenará sola.",
  ];
}

function printFixtureReport(
  report: PreparedFixtureReport,
  statTypeMap: Map<number, StatTypeInfo>,
  fixtureIndex: number,
  totalFixtures: number,
  view: ReportView,
): void {
  const { fixture, players, stateLabel, resolvedState, quality } = report;
  const homePlayers = players.filter((player) => player.teamBucket === "home");
  const awayPlayers = players.filter((player) => player.teamBucket === "away");
  const unknownPlayers = players.filter((player) => player.teamBucket === "unknown");

  const title = `Partido ${fixtureIndex}/${totalFixtures} · ${fixture.homeTeam?.name ?? "Local"} ${fixture.homeScore ?? "-"} - ${fixture.awayScore ?? "-"} ${fixture.awayTeam?.name ?? "Visitante"}`;

  const boxLines = [
    ...packInlineItems(
      [
        `🗓 ${formatDate(fixture.kickoffAt)}`,
        stateBadge(stateLabel),
        `🏁 Jornada ${fixture.round?.name ?? "?"}`,
        `🧱 ${fixture.stage?.name ?? "Sin stage"}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray),
    ),
    ...packInlineItems(
      [
        `🏟 ${fixture.venue?.name ?? "Sin estadio"}`,
        `🧑‍⚖️ ${fixture.referee?.name ?? "Sin arbitro"}`,
        `🆔 ${fixture.id} / ${fixture.sportmonksId}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray),
    ),
    ...packInlineItems(
      [
        `👥 Local ${homePlayers.length}`,
        `👥 Visita ${awayPlayers.length}`,
        `❓ Sin equipo ${unknownPlayers.length}`,
        `📉 Sin stats ${quality.withoutStatsCount}`,
        `🧬 Bio incompleta ${quality.missingBioCount}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray),
    ),
    ...packInlineItems(
      [
        `📋 Lineups ${fixture.lineups.length}`,
        `📈 P.Stats ${fixture.playerStats.length}`,
        `🎬 Eventos ${fixture.events.length}`,
        `📊 T.Stats ${fixture.teamStats.length}`,
      ],
      REPORT_WIDTH - 4,
      color("  |  ", ANSI.gray),
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

  printTeamSection("home", `${fixture.homeTeam?.name ?? "Local"}`, homePlayers, statTypeMap, view);
  printTeamSection("away", `${fixture.awayTeam?.name ?? "Visitante"}`, awayPlayers, statTypeMap, view);

  if (unknownPlayers.length > 0) {
    printTeamSection("unknown", "Jugadores sin equipo resuelto", unknownPlayers, statTypeMap, view);
  }

  printRule();
  console.log("");
}

export async function reportFixturePlayerDetails(
  deps: ReportDependencies,
  rawOptions?: Partial<ReportOptions>,
): Promise<void> {
  const options: ReportOptions = rawOptions?.season && rawOptions?.group && rawOptions?.jornada
    ? {
        season: rawOptions.season,
        group: rawOptions.group,
        jornada: rawOptions.jornada,
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
    "temporada",
  );

  const seasonRecord = seasons.find((item) => item.id === season.id);
  if (!seasonRecord) {
    throw new Error(`No pude cargar la temporada resuelta con ID ${season.id}.`);
  }

  const groups = seasonRecord.stages.flatMap((stage) => {
    if (stage.groups.length === 0) {
      return [{
        id: stage.id,
        sportmonksId: stage.sportmonksId,
        name: stage.name,
        stageId: stage.id,
        stageName: stage.name,
        actualGroupId: null,
      } satisfies GroupScopeCandidate];
    }

    return stage.groups.map((group) => ({
      ...group,
      name: group.name ?? stage.name,
      stageId: stage.id,
      stageName: stage.name,
      actualGroupId: group.id,
    } satisfies GroupScopeCandidate));
  });

  const matchedGroup = pickBestCandidate(groups, options.group, "grupo");
  const matchedStage = seasonRecord.stages.find((stage) => stage.id === matchedGroup.stageId);
  if (!matchedStage) {
    throw new Error(`No pude resolver el stage del grupo ${matchedGroup.name ?? matchedGroup.id}.`);
  }

  const rounds = matchedStage.rounds.map((round) => ({
    ...round,
    slug: round.slug ?? undefined,
  }));
  const matchedRound = pickBestCandidate(rounds, options.jornada, "jornada");

  const fixtures = await db.fixture.findMany({
    where: {
      seasonId: seasonRecord.id,
      stageId: matchedStage.id,
      roundId: matchedRound.id,
      ...(matchedGroup.actualGroupId !== null ? { groupId: matchedGroup.actualGroupId } : {}),
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
      `No encontré partidos para season="${seasonRecord.name}", group="${matchedGroup.name ?? matchedStage.name}" y jornada="${matchedRound.name}".`,
    );
  }

  const statTypeIds = [...new Set(
    fixtures.flatMap((fixture) => fixture.playerStats.map((stat) => stat.typeId)).filter(
      (id): id is number => id !== null,
    ),
  )];
  const fixtureStateIds = [...new Set(
    fixtures.map((fixture) => fixture.stateId).filter((id): id is number => id !== null),
  )];
  const playerIds = [...new Set(fixtures.flatMap((fixture) => [
    ...fixture.lineups.map((lineup) => lineup.playerId),
    ...fixture.playerStats.map((stat) => stat.playerId),
    ...fixture.events.map((event) => event.playerId).filter((id): id is number => id !== null),
  ]))];
  const teamIds = [...new Set(fixtures.flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId]).filter(
    (id): id is number => id !== null,
  ))];

  const statTypes = statTypeIds.length > 0
    ? await db.statType.findMany({ where: { id: { in: statTypeIds } } })
    : [];
  const states = fixtureStateIds.length > 0
    ? await db.fixtureState.findMany({ where: { id: { in: fixtureStateIds } } })
    : [];
  const squadMemberships = playerIds.length > 0 && teamIds.length > 0
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
    statTypes.map((type) => [type.id, {
      name: type.name,
      developerName: type.developerName,
      statGroup: type.statGroup,
    }]),
  );
  const stateMap = new Map(states.map((state) => [state.id, state]));

  const preparedReports = fixtures.map((fixture) =>
    prepareFixture(fixture, statTypeMap, squadMemberships, stateMap)
  );
  const globalQuality = buildGlobalQuality(preparedReports);

  printBox("⚽ Reporte profesional por jornada", [
    `🏆 Temporada ${seasonRecord.name} (${seasonRecord.league.name})`,
    `🧱 Grupo/Stage ${matchedGroup.name ?? "Sin nombre"}  |  Stage real ${matchedStage.name}  |  🏁 Jornada ${matchedRound.name}`,
    `📦 Fixtures ${preparedReports.length}  |  👁 Vista ${options.view.toUpperCase()}  |  🔎 --season="${options.season}" --group="${options.group}" --jornada="${options.jornada}"`,
  ], ANSI.orange);
  console.log("");

  printQualityBox(globalQuality);

  preparedReports.forEach((report, index) => {
    printFixtureReport(report, statTypeMap, index + 1, preparedReports.length, options.view);
  });
}
