import { CaseOpinion, RelevanceLevel, SavedMatter } from '../types/caseFinder';

export class CaseFinderApiError extends Error {
  statusCode: number;
  url: string;

  constructor(statusCode: number, message: string, url: string) {
    super(message);
    this.statusCode = statusCode;
    this.url = url;
  }
}

// Client-side in-memory cache keyed by normalized query string
const searchCache = new Map<string, CaseOpinion[]>();
const summarisedBriefCache = new Map<
  string,
  { cases: CaseOpinion[]; brief: string }
>();

function normalizeQueryKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePipelineKey(query: string, description: string): string {
  return `${normalizeQueryKey(query)}::${description.trim().toLowerCase()}`;
}

export function isQueryCached(query: string): boolean {
  const key = normalizeQueryKey(query);
  return key.length > 0 && searchCache.has(key);
}

export function getCachedPipelineResult(
  query: string,
  description: string
): { cases: CaseOpinion[]; brief: string } | null {
  return summarisedBriefCache.get(normalizePipelineKey(query, description)) ?? null;
}

export function setCachedPipelineResult(
  query: string,
  description: string,
  cases: CaseOpinion[],
  brief: string
): void {
  summarisedBriefCache.set(normalizePipelineKey(query, description), {
    cases: cases.map((c) => ({ ...c })),
    brief,
  });
}

async function parseErrorResponse(
  response: Response,
  fallbackUrl: string
): Promise<CaseFinderApiError> {
  try {
    const body = (await response.json()) as {
      statusCode?: number;
      message?: string;
      detail?: string;
      error?: string;
      url?: string;
    };
    return new CaseFinderApiError(
      body.statusCode ?? response.status,
      body.message ??
        body.detail ??
        body.error ??
        `Request failed with HTTP ${response.status}.`,
      body.url ?? fallbackUrl
    );
  } catch {
    return new CaseFinderApiError(
      response.status,
      `Request failed with HTTP ${response.status} (${response.statusText || 'Error'}).`,
      fallbackUrl
    );
  }
}

/**
 * 1. generateQuery(description) — calls /api/gemini/generate-query
 */
export async function generateQuery(description: string): Promise<string> {
  const endpointUrl = '/api/gemini/generate-query';
  const trimmed = description.trim();
  if (!trimmed) {
    throw new CaseFinderApiError(
      400,
      'Please enter a description of the tenant’s habitability problem before generating a query.',
      endpointUrl
    );
  }

  let response: Response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: trimmed }),
    });
  } catch (err) {
    throw new CaseFinderApiError(
      502,
      err instanceof Error ? err.message : 'Network error calling query generator.',
      endpointUrl
    );
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, endpointUrl);
  }

  const data = (await response.json()) as { query?: string };
  return (data.query ?? '').trim();
}

/**
 * 2. searchCases(query) — calls /api/courtlistener/search
 * Cached in memory per normalized query so repeated searches do not re-call the API.
 */
export async function searchCases(query: string): Promise<CaseOpinion[]> {
  const trimmed = query.trim();
  const cacheKey = normalizeQueryKey(trimmed);
  const endpointUrl = `/api/courtlistener/search?q=${encodeURIComponent(trimmed)}`;

  if (!trimmed) {
    throw new CaseFinderApiError(400, 'Search query cannot be empty.', endpointUrl);
  }

  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached.map((c) => ({ ...c }));
  }

  let response: Response;
  try {
    response = await fetch(endpointUrl, { method: 'GET' });
  } catch (err) {
    throw new CaseFinderApiError(
      502,
      err instanceof Error ? err.message : 'Network error calling CourtListener endpoint.',
      endpointUrl
    );
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, endpointUrl);
  }

  const data = (await response.json()) as { cases?: CaseOpinion[] };
  const cases = Array.isArray(data.cases) ? data.cases : [];

  searchCache.set(
    cacheKey,
    cases.map((c) => ({ ...c }))
  );

  return cases;
}

/**
 * Safely strips ```json markdown fences and parses JSON without throwing.
 */
export function safeParseGeminiJson<T>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/**
 * 3. summariseCases(description, cases) — calls /api/gemini/summarise-cases
 */
export async function summariseCases(
  description: string,
  cases: CaseOpinion[]
): Promise<CaseOpinion[]> {
  if (cases.length === 0) {
    return [];
  }

  const endpointUrl = '/api/gemini/summarise-cases';
  let response: Response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, cases }),
    });
  } catch (err) {
    throw new CaseFinderApiError(
      502,
      err instanceof Error ? err.message : 'Network error summarising court opinions.',
      endpointUrl
    );
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, endpointUrl);
  }

  const rawText = await response.text();
  const parsed = safeParseGeminiJson<{
    summaries?: Array<{ index: number; summary: string; relevance: string }>;
    parseFailed?: boolean;
  }>(rawText);

  if (!parsed || parsed.parseFailed || !Array.isArray(parsed.summaries)) {
    return cases.map((c) => ({ ...c, summary: '', relevance: null }));
  }

  const summaryMap = new Map<
    number,
    { summary: string; relevance: RelevanceLevel }
  >();
  for (const entry of parsed.summaries) {
    if (typeof entry.index === 'number') {
      const rel: RelevanceLevel =
        entry.relevance === 'High' ||
        entry.relevance === 'Medium' ||
        entry.relevance === 'Low'
          ? entry.relevance
          : 'Low';
      summaryMap.set(entry.index, {
        summary: typeof entry.summary === 'string' ? entry.summary : '',
        relevance: rel,
      });
    }
  }

  return cases.map((c, idx) => {
    const match = summaryMap.get(idx);
    if (!match) {
      return { ...c, summary: '', relevance: null };
    }
    return {
      ...c,
      summary: match.summary,
      relevance: match.relevance,
    };
  });
}

/**
 * 4. writeBrief(description, cases) — calls /api/gemini/write-brief
 */
export async function writeBrief(
  description: string,
  cases: CaseOpinion[]
): Promise<string> {
  const endpointUrl = '/api/gemini/write-brief';
  let response: Response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, cases }),
    });
  } catch (err) {
    throw new CaseFinderApiError(
      502,
      err instanceof Error ? err.message : 'Network error drafting intake brief.',
      endpointUrl
    );
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, endpointUrl);
  }

  const data = (await response.json()) as { brief?: string };
  return (data.brief ?? '').trim();
}

export async function fetchSavedMatters(): Promise<SavedMatter[]> {
  try {
    const res = await fetch('/api/matters');
    if (!res.ok) return [];
    const data = (await res.json()) as { matters?: SavedMatter[] };
    return Array.isArray(data.matters) ? data.matters : [];
  } catch {
    return [];
  }
}

export async function persistSavedMatter(matter: SavedMatter): Promise<void> {
  try {
    await fetch('/api/matters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matter),
    });
  } catch {
    // Client state remains intact even if background sync fails
  }
}
