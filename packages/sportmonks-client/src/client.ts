const BASE_URL = "https://api.sportmonks.com/v3/football";

export interface FetchOptions {
  /** Max items per page (1–50 default, up to 1000 with filters=populate) */
  perPage?: number;
  /** Page number (1-based) */
  page?: number;
  /** Include relations, e.g. "country,seasons" */
  include?: string;
  /** Filters, e.g. "populate" for higher per_page limit */
  filters?: string;
}

export interface SportMonksClientConfig {
  apiToken: string;
  baseUrl?: string;
}

/**
 * HTTP client for SportMonks Football API v3.
 * Auth via api_token query param.
 */
export function createSportMonksClient(config: SportMonksClientConfig) {
  const { apiToken, baseUrl = BASE_URL } = config;

  function buildUrl(
    path: string,
    options: FetchOptions = {}
  ): string {
    const url = new URL(
      path.startsWith("http")
        ? path
        : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`
    );
    url.searchParams.set("api_token", apiToken);

    if (options.perPage !== undefined) {
      url.searchParams.set("per_page", String(options.perPage));
    }
    if (options.page !== undefined) {
      url.searchParams.set("page", String(options.page));
    }
    if (options.include) {
      url.searchParams.set("include", options.include);
    }
    if (options.filters) {
      url.searchParams.set("filters", options.filters);
    }

    return url.toString();
  }

  /**
   * Fetch a single resource by path (e.g. "/countries/123").
   */
  async function get<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const url = buildUrl(path, options);
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`SportMonks API error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as { data?: T } & Record<string, unknown>;
    return (json.data ?? json) as T;
  }

  /**
   * Fetch all pages of a list endpoint using pagination.
   * Uses per_page and page; stops when has_more is false or data is empty.
   */
  async function getAllPages<T>(
    path: string,
    options: Omit<FetchOptions, "page"> & {
      perPage?: number;
      onPage?: (data: T[], page: number) => void | Promise<void>;
    } = {}
  ): Promise<T[]> {
    const { onPage, perPage = 50, ...rest } = options;
    const results: T[] = [];
    let page = 1;

    while (true) {
      const url = buildUrl(path, { ...rest, perPage, page });
      const res = await fetch(url);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`SportMonks API error ${res.status}: ${text}`);
      }

      const json = (await res.json()) as {
        data: T | T[];
        pagination?: { has_more?: boolean };
      };

      const data = Array.isArray(json.data)
        ? json.data
        : json.data
          ? [json.data]
          : [];
      results.push(...data);

      if (onPage) {
        await onPage(data, page);
      }

      const hasMore = json.pagination?.has_more ?? false;
      if (!hasMore || data.length === 0) {
        break;
      }

      page += 1;
    }

    return results;
  }

  return {
    get,
    getAllPages,
    buildUrl,
  };
}
