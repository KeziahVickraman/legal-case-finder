import type { Request, Response } from 'express';
import { ThinkingLevel, Type } from '@google/genai';
import {
  extractErrorDetails,
  GEMINI_MODEL,
  getGeminiClient,
  stripCodeFences,
} from '../_lib/gemini.ts';
import type { RelevanceLevel, StoredCaseOpinion } from '../_lib/store.ts';

interface SummaryEntry {
  index: number;
  summary: string;
  relevance: RelevanceLevel;
}

export default async function summariseCasesHandler(
  req: Request,
  res: Response
): Promise<void> {
  const endpointUrl = '/api/gemini/summarise-cases';
  const description =
    typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const cases = Array.isArray(req.body?.cases)
    ? (req.body.cases as StoredCaseOpinion[])
    : [];

  if (cases.length === 0) {
    res.status(200).json({ summaries: [], parseFailed: false });
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
        res.status(200).json({ summaries: [], parseFailed: true });
        return;
      }
      const sanitized: SummaryEntry[] = parsed
        .filter((item): item is Record<string, unknown> =>
          Boolean(item && typeof item === 'object')
        )
        .map((item) => {
          const rel = item.relevance;
          const normalizedRelevance: RelevanceLevel =
            rel === 'High' || rel === 'Medium' || rel === 'Low' ? rel : 'Low';
          return {
            index: typeof item.index === 'number' ? item.index : -1,
            summary: typeof item.summary === 'string' ? item.summary.trim() : '',
            relevance: normalizedRelevance,
          };
        });
      res.status(200).json({ summaries: sanitized, parseFailed: false });
    } catch {
      res.status(200).json({ summaries: [], parseFailed: true });
    }
  } catch (err) {
    const { statusCode, message } = extractErrorDetails(err);
    res.status(statusCode).json({
      statusCode,
      message,
      url: endpointUrl,
    });
  }
}
