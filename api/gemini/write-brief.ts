import type { Request, Response } from 'express';
import { ThinkingLevel } from '@google/genai';
import {
  extractErrorDetails,
  GEMINI_MODEL,
  getGeminiClient,
} from '../_lib/gemini.ts';
import type { StoredCaseOpinion } from '../_lib/store.ts';

export default async function writeBriefHandler(
  req: Request,
  res: Response
): Promise<void> {
  const endpointUrl = '/api/gemini/write-brief';
  const description =
    typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const cases = Array.isArray(req.body?.cases)
    ? (req.body.cases as StoredCaseOpinion[])
    : [];

  if (cases.length === 0) {
    res.status(200).json({
      brief:
        'Weak: No published opinions matched the current search query. Consider broadening the search keywords or verifying specific housing defects with the tenant. Research only; not legal advice.',
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

    res.status(200).json({ brief: briefText });
  } catch (err) {
    const { statusCode, message } = extractErrorDetails(err);
    res.status(statusCode).json({
      statusCode,
      message,
      url: endpointUrl,
    });
  }
}
