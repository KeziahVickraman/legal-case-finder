export type TabId = 'product' | 'workspace' | 'pricing';

export type RelevanceLevel = 'High' | 'Medium' | 'Low';

export interface CaseOpinion {
  caseName: string;
  court: string;
  dateFiled: string;
  docketNumber: string;
  url: string;
  snippet: string;
  summary: string;
  relevance: RelevanceLevel;
}

export interface SavedMatter {
  id: string;
  matterName: string;
  problemDescription: string;
  searchQuery: string;
  savedAt: string;
  cases: CaseOpinion[];
  brief: string;
}

export type PlanId = 'solo' | 'team' | 'legalaid';

export interface FirmPlan {
  id: PlanId;
  name: string;
  badgeLabel: string;
  monthlyLimit: number;
  seats: number;
}

export interface ApiErrorState {
  statusCode: number;
  message: string;
}
