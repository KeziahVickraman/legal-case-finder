import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-4-hydrogen';

export function getGeminiClient(): GoogleGenAI {
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

export function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function extractErrorDetails(err: unknown): {
  statusCode: number;
  message: string;
} {
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
