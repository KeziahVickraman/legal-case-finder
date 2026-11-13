import type { Request, Response } from 'express';
import { ThinkingLevel } from '@google/genai';
import {
  extractErrorDetails,
  GEMINI_MODEL,
  getGeminiClient,
} from '../_lib/gemini.ts';

export default async function generateQueryHandler(
  req: Request,
  res: Response
): Promise<void> {
  const endpointUrl = '/api/gemini/generate-query';
  const description =
    typeof req.body?.description === 'string' ? req.body.description.trim() : '';

  if (!description) {
    res.status(400).json({
      statusCode: 400,
      message:
        'Please describe the tenant’s habitability problem before generating a search.',
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

    res.status(200).json({ query: queryText });
  } catch (err) {
    const { statusCode, message } = extractErrorDetails(err);
    res.status(statusCode).json({
      statusCode,
      message,
      url: endpointUrl,
    });
  }
}
