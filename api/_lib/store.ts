export type RelevanceLevel = 'High' | 'Medium' | 'Low';

export interface StoredCaseOpinion {
  caseName: string;
  court: string;
  dateFiled: string;
  docketNumber: string;
  url: string;
  snippet: string;
  summary: string;
  relevance: RelevanceLevel | null;
}

export interface StoredSavedMatter {
  id: string;
  matterName: string;
  problemDescription: string;
  searchQuery: string;
  savedAt: string;
  cases: StoredCaseOpinion[];
  brief: string;
}

// In-memory data store kept inside /api at project root
export const searchCache = new Map<string, StoredCaseOpinion[]>();
export const savedMattersStore: StoredSavedMatter[] = [];

export function normalizeQueryKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function stripHtml(raw: string): string {
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
