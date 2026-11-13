import https from 'node:https';
import type { Request, Response } from 'express';
import {
  normalizeQueryKey,
  searchCache,
  stripHtml,
  type StoredCaseOpinion,
} from '../_lib/store.ts';

const COURTLISTENER_TOKEN = 'PASTE_TOKEN_HERE';

function httpsGetJson(
  targetUrl: string,
  token: string
): Promise<{ statusCode: number; statusMessage: string; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CaseFinder/1.0 (legal-research)',
          Authorization: `Token ${token}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 502,
            statusMessage: res.statusMessage ?? '',
            body: data,
          });
        });
      }
    );
    req.on('error', reject);
  });
}

export default async function courtlistenerSearchHandler(
  req: Request,
  res: Response
): Promise<void> {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const encodedQuery = encodeURIComponent(q);
  const targetUrl = `https://www.courtlistener.com/api/rest/v4/search/?q=${encodedQuery}&type=o&order_by=dateFiled%20desc`;

  if (!q) {
    res.status(400).json({
      statusCode: 400,
      message: 'Search query cannot be empty.',
      url: targetUrl,
    });
    return;
  }

  const token = (process.env.COURTLISTENER_TOKEN || COURTLISTENER_TOKEN).trim();
  if (!token || token === 'PASTE_TOKEN_HERE') {
    res.status(401).json({
      statusCode: 401,
      message: 'Add your CourtListener API token to enable live search.',
      url: targetUrl,
    });
    return;
  }

  const cacheKey = normalizeQueryKey(q);
  const cached = searchCache.get(cacheKey);
  if (cached) {
    res.status(200).json({
      cases: cached.map((c) => ({ ...c })),
      cached: true,
      url: targetUrl,
    });
    return;
  }

  try {
    const upstream = await httpsGetJson(targetUrl, token);

    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = upstream.body
        ? (JSON.parse(upstream.body) as Record<string, unknown>)
        : null;
    } catch {
      parsedBody = null;
    }

    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      const rawMessage =
        (parsedBody && typeof parsedBody.detail === 'string' && parsedBody.detail) ||
        (parsedBody && typeof parsedBody.message === 'string' && parsedBody.message) ||
        (parsedBody && typeof parsedBody.error === 'string' && parsedBody.error) ||
        `CourtListener API responded with status ${upstream.statusCode} (${upstream.statusMessage || 'Error'}).`;

      const message =
        upstream.statusCode === 401 &&
        rawMessage.toLowerCase().includes('invalid token')
          ? 'Your CourtListener token is invalid. Re-copy it from your CourtListener API page.'
          : rawMessage;

      res.status(upstream.statusCode).json({
        statusCode: upstream.statusCode,
        message,
        url: targetUrl,
      });
      return;
    }

    const rawResults = Array.isArray(parsedBody?.results)
      ? (parsedBody.results as Array<Record<string, unknown>>)
      : [];

    const cases: StoredCaseOpinion[] = rawResults.slice(0, 8).map((item) => {
      const opinions = Array.isArray(item.opinions)
        ? (item.opinions as Array<Record<string, unknown>>)
        : [];
      const firstSnippet =
        (opinions[0] &&
          typeof opinions[0].snippet === 'string' &&
          opinions[0].snippet) ||
        (typeof item.snippet === 'string' ? item.snippet : '');

      const absoluteUrl =
        typeof item.absolute_url === 'string' ? item.absolute_url : '';

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

    res.status(200).json({ cases, cached: false, url: targetUrl });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Network error calling CourtListener API.';
    res.status(502).json({
      statusCode: 502,
      message,
      url: targetUrl,
    });
  }
}
