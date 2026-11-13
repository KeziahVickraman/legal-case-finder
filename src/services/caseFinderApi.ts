import { CaseOpinion, RelevanceLevel } from '../types/caseFinder';

export class CaseFinderApiError extends Error {
  statusCode: number;
  url: string;

  constructor(statusCode: number, message: string, url: string) {
    super(message);
    this.statusCode = statusCode;
    this.url = url;
  }
}

// In-memory cache keyed by normalized query string
const searchCache = new Map<string, CaseOpinion[]>();
// Full pipeline cache keyed by normalized query + description
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

function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
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
 * 1. generateQuery(description) — Gemini
 * Turns the tenant's plain-English description into a 3-5 word keyword query.
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
 * 2. searchCases(query) — CourtListener
 * Direct keyless GET to CourtListener REST API v4 (no Authorization header or token).
 * Results are cached per query in memory so repeated searches do not call the API again.
 */
export async function searchCases(query: string): Promise<CaseOpinion[]> {
  const trimmed = query.trim();
  const cacheKey = normalizeQueryKey(trimmed);
  const courtListenerUrl = `https://www.courtlistener.com/api/rest/v4/search/?q=${encodeURIComponent(
    trimmed
  )}&type=o&order_by=dateFiled%20desc`;

  if (!trimmed) {
    throw new CaseFinderApiError(400, 'Search query cannot be empty.', courtListenerUrl);
  }

  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached.map((c) => ({ ...c }));
  }

  let response: Response;
  try {
    // Strictly no Authorization header or token sent to CourtListener
    response = await fetch(courtListenerUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err) {
    throw new CaseFinderApiError(
      502,
      err instanceof Error ? err.message : 'Network error calling CourtListener API.',
      courtListenerUrl
    );
  }

  if (!response.ok) {
    throw await parseErrorResponse(response, courtListenerUrl);
  }

  const data = (await response.json()) as {
    results?: Array<Record<string, unknown>>;
  };
  const rawResults = Array.isArray(data.results) ? data.results : [];

  const cases: CaseOpinion[] = rawResults.slice(0, 8).map((item) => {
    const opinions = Array.isArray(item.opinions)
      ? (item.opinions as Array<Record<string, unknown>>)
      : [];
    const firstSnippet =
      (opinions[0] && typeof opinions[0].snippet === 'string' && opinions[0].snippet) ||
      (typeof item.snippet === 'string' ? item.snippet : '');

    const absoluteUrl = typeof item.absolute_url === 'string' ? item.absolute_url : '';

    return {
      caseName:
        (typeof item.caseName === 'string' && item.caseName) ||
        (typeof item.case_name === 'string' && item.case_name) ||
        'Untitled Opinion',
      court:
        (typeof item.court === 'string' && item.court) ||
        (typeof item.court_id === 'string' && item.court_id) ||
        'Unknown Court',
      dateFiled:
        (typeof item.dateFiled === 'string' && item.dateFiled) ||
        (typeof item.date_filed === 'string' && item.date_filed) ||
        '',
      docketNumber:
        (typeof item.docketNumber === 'string' && item.docketNumber) ||
        (typeof item.docket_number === 'string' && item.docket_number) ||
        'N/A',
      url: absoluteUrl
        ? `https://www.courtlistener.com${absoluteUrl}`
        : 'https://www.courtlistener.com',
      snippet: stripHtml(firstSnippet),
      summary: '',
      relevance: null,
    };
  });

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
 * 3. summariseCases(description, cases) — Gemini, ONE request for all cases.
 * Safely falls back to returning cases without summaries if JSON parsing fails.
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
 * 4. writeBrief(description, cases) — Gemini
 * Drafts one paragraph for a lawyer ending with "Research only; not legal advice."
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
