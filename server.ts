import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const GEMINI_MODEL = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
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

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractErrorDetails(err: unknown): { statusCode: number; message: string } {
  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    const statusCode =
      typeof record.status === 'number'
        ? record.status
        : typeof record.statusCode === 'number'
        ? record.statusCode
        : 500;
    const message =
      typeof record.message === 'string' && record.message.trim()
        ? record.message
        : 'Upstream API request failed.';
    return { statusCode, message };
  }
  return { statusCode: 500, message: 'Unexpected server error.' };
}

interface IncomingCase {
  caseName: string;
  court: string;
  dateFiled: string;
  docketNumber: string;
  url: string;
  snippet: string;
  summary?: string;
  relevance?: string | null;
}

interface SummaryEntry {
  index: number;
  summary: string;
  relevance: 'High' | 'Medium' | 'Low';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. Gemini: turn tenant's plain-English description into 3-5 word keyword query
  app.post('/api/gemini/generate-query', async (req, res) => {
    const endpointUrl = '/api/gemini/generate-query';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';

    if (!description) {
      res.status(400).json({
        statusCode: 400,
        message: 'Please describe the tenant’s habitability problem before generating a search.',
        url: endpointUrl,
      });
      return;
    }

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Tenant complaint:\n${description}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a California legal research assistant. Turn the tenant’s plain-English habitability complaint into a concise 3 to 5 word keyword search query for US court opinions (e.g. "habitability heating mold warranty"). Return ONLY the 3 to 5 words separated by spaces. No quotes, no punctuation, no markdown, no explanation.',
        },
      });

      const queryText = (response.text ?? '')
        .replace(/["'`.,:;!?]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!queryText) {
        res.status(502).json({
          statusCode: 502,
          message: 'Gemini returned an empty search query.',
          url: endpointUrl,
        });
        return;
      }

      res.json({ query: queryText });
    } catch (err) {
      const { statusCode, message } = extractErrorDetails(err);
      res.status(statusCode).json({
        statusCode,
        message,
        url: endpointUrl,
      });
    }
  });

  // 2. CourtListener: keyless search proxy (NO Authorization header or token)
  app.get('/api/courtlistener/search', async (req, res) => {
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

    try {
      // Strictly no Authorization header or token sent to CourtListener
      const upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const rawBody = await upstreamRes.text();
      let parsedBody: Record<string, unknown> | null = null;
      try {
        parsedBody = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;
      } catch {
        parsedBody = null;
      }

      if (!upstreamRes.ok) {
        const message =
          (parsedBody && typeof parsedBody.detail === 'string' && parsedBody.detail) ||
          (parsedBody && typeof parsedBody.message === 'string' && parsedBody.message) ||
          (parsedBody && typeof parsedBody.error === 'string' && parsedBody.error) ||
          `CourtListener API responded with status ${upstreamRes.status} (${upstreamRes.statusText || 'Error'}).`;

        res.status(upstreamRes.status).json({
          statusCode: upstreamRes.status,
          message,
          url: targetUrl,
        });
        return;
      }

      const rawResults = Array.isArray(parsedBody?.results)
        ? (parsedBody.results as Array<Record<string, unknown>>)
        : [];

      const cases = rawResults.slice(0, 8).map((item) => {
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

      res.json({ cases, url: targetUrl });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Network error calling CourtListener API.';
      res.status(502).json({
        statusCode: 502,
        message,
        url: targetUrl,
      });
    }
  });

  // 3. Gemini: ONE request to summarise all cases and assign High/Medium/Low relevance
  app.post('/api/gemini/summarise-cases', async (req, res) => {
    const endpointUrl = '/api/gemini/summarise-cases';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const cases = Array.isArray(req.body?.cases)
      ? (req.body.cases as IncomingCase[])
      : [];

    if (cases.length === 0) {
      res.json({ summaries: [], parseFailed: false });
      return;
    }

    try {
      const ai = getGeminiClient();
      const compactCases = cases.map((c, index) => ({
        index,
        caseName: c.caseName,
        court: c.court,
        dateFiled: c.dateFiled,
        snippet: c.snippet,
      }));

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: JSON.stringify({
          tenantSituation: description || 'Tenant habitability complaint',
          cases: compactCases,
        }),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are assisting a tenant-side law firm intake team. Given a tenant situation and a list of court opinion snippets, return a JSON array ONLY containing one object per case: { "index": number, "summary": string, "relevance": "High" | "Medium" | "Low" }. Each summary must be exactly 2 plain-English sentences explaining the legal principle and relevance to the tenant. Rate relevance for this specific tenant situation as "High", "Medium", or "Low".',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                summary: { type: Type.STRING },
                relevance: { type: Type.STRING },
              },
              required: ['index', 'summary', 'relevance'],
            },
          },
        },
      });

      const rawText = stripCodeFences(response.text ?? '');
      try {
        const parsed = JSON.parse(rawText);
        if (!Array.isArray(parsed)) {
          res.json({ summaries: [], parseFailed: true });
          return;
        }
        const sanitized: SummaryEntry[] = parsed
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((item) => {
            const rel = item.relevance;
            const normalizedRelevance: 'High' | 'Medium' | 'Low' =
              rel === 'High' || rel === 'Medium' || rel === 'Low' ? rel : 'Low';
            return {
              index: typeof item.index === 'number' ? item.index : -1,
              summary: typeof item.summary === 'string' ? item.summary.trim() : '',
              relevance: normalizedRelevance,
            };
          });
        res.json({ summaries: sanitized, parseFailed: false });
      } catch {
        // Guardrail: if parsing fails, show cases without summaries rather than crashing
        res.json({ summaries: [], parseFailed: true });
      }
    } catch (err) {
      const { statusCode, message } = extractErrorDetails(err);
      res.status(statusCode).json({
        statusCode,
        message,
        url: endpointUrl,
      });
    }
  });

  // 4. Gemini: write one-paragraph intake brief for a lawyer
  app.post('/api/gemini/write-brief', async (req, res) => {
    const endpointUrl = '/api/gemini/write-brief';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const cases = Array.isArray(req.body?.cases)
      ? (req.body.cases as IncomingCase[])
      : [];

    if (cases.length === 0) {
      res.json({
        brief:
          'Weak support: No published opinions matched the current search query. Consider broadening the search keywords or verifying specific housing defects with the tenant. Research only; not legal advice.',
      });
      return;
    }

    try {
      const ai = getGeminiClient();
      const caseContext = cases.map((c) => ({
        caseName: c.caseName,
        court: c.court,
        dateFiled: c.dateFiled,
        relevance: c.relevance ?? 'Unrated',
        summary: c.summary || c.snippet,
      }));

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: JSON.stringify({
          tenantSituation: description || 'Tenant habitability complaint',
          cases: caseContext,
        }),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Write a single concise paragraph for a supervising lawyer summarizing case-law support for this tenant intake. You MUST: (1) state overall strength of support as Strong, Moderate, or Weak; (2) name the 2 to 3 most relevant cases; (3) suggest one concrete next intake step; and (4) end the paragraph with the exact sentence "Research only; not legal advice." Output plain prose only (one paragraph, no bullet points, no markdown).',
        },
      });

      let briefText = (response.text ?? '').replace(/\s+/g, ' ').trim();
      if (!briefText) {
        res.status(502).json({
          statusCode: 502,
          message: 'Gemini returned an empty intake brief.',
          url: endpointUrl,
        });
        return;
      }

      if (!briefText.endsWith('Research only; not legal advice.')) {
        briefText = `${briefText.replace(/[.\s]+$/, '')}. Research only; not legal advice.`;
      }

      res.json({ brief: briefText });
    } catch (err) {
      const { statusCode, message } = extractErrorDetails(err);
      res.status(statusCode).json({
        statusCode,
        message,
        url: endpointUrl,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Case Finder server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
