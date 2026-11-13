import { MOCK_CASES } from '../data/mockCases';
import { CaseOpinion } from '../types/caseFinder';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class CaseFinderApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Generates a CourtListener-ready boolean/keyword search query from a plain-English
 * tenant habitability description.
 */
export async function generateQuery(problemText: string): Promise<string> {
  await delay(500);

  const normalized = problemText.trim().toLowerCase();
  if (!normalized) {
    throw new CaseFinderApiError(400, 'Please enter a description of the tenant’s habitability problem before generating a query.');
  }

  if (normalized.includes('503') || normalized.includes('simulate error')) {
    throw new CaseFinderApiError(
      503,
      'Query generation service is temporarily unavailable. Please retry in a few moments.'
    );
  }

  const keywords: string[] = ['habitability'];
  if (normalized.includes('heat') || normalized.includes('furnace') || normalized.includes('cold')) {
    keywords.push('heating');
  }
  if (normalized.includes('mold') || normalized.includes('mould') || normalized.includes('damp')) {
    keywords.push('mold');
  }
  if (normalized.includes('plumb') || normalized.includes('leak') || normalized.includes('sewage') || normalized.includes('toilet')) {
    keywords.push('plumbing');
  }
  if (normalized.includes('pest') || normalized.includes('roach') || normalized.includes('rat') || normalized.includes('mice')) {
    keywords.push('pests');
  }

  if (keywords.length === 1) {
    return 'habitability heating mold';
  }

  return keywords.join(' ');
}

/**
 * Queries California published opinions (mocked CourtListener data for UI stage).
 */
export async function searchCases(query: string): Promise<CaseOpinion[]> {
  await delay(650);

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    throw new CaseFinderApiError(400, 'Search query cannot be empty.');
  }

  if (trimmed.includes('502') || trimmed.includes('503') || trimmed.includes('error')) {
    throw new CaseFinderApiError(
      502,
      'Upstream CourtListener archive returned Bad Gateway (502). Your monthly search quota was not charged.'
    );
  }

  if (trimmed === 'empty' || trimmed === 'no results') {
    return [];
  }

  // Return all 6 cases with subtle relevance ordering preserved
  return MOCK_CASES.map((item) => ({ ...item }));
}

/**
 * Produces plain-English 2-sentence summaries for retrieved opinions.
 */
export async function summariseCases(cases: CaseOpinion[]): Promise<CaseOpinion[]> {
  await delay(400);
  return cases.map((c) => ({
    ...c,
    summary: c.summary,
  }));
}

/**
 * Drafts a one-paragraph overall intake brief summarizing case support.
 */
export async function writeBrief(cases: CaseOpinion[], problemText: string): Promise<string> {
  await delay(450);

  if (cases.length === 0) {
    return 'No supporting California published opinions matched this search query. Broaden the search terms (e.g., "habitability California") or verify specific housing code defects with the tenant.';
  }

  const highCases = cases.filter((c) => c.relevance === 'High');
  const mediumCases = cases.filter((c) => c.relevance === 'Medium');
  const normalized = problemText.toLowerCase();

  const issueFocus =
    normalized.includes('plumb') || normalized.includes('sewage')
      ? 'plumbing failures and substandard sanitation'
      : normalized.includes('pest') || normalized.includes('roach')
      ? 'chronic pest infestation and landlord notice'
      : 'prolonged lack of heating and indoor mold';

  const topNames = highCases.slice(0, 3).map((c) => c.caseName).join(', ');

  return `Strong support: ${highCases.length} High-relevance cases (${topNames}) establish clear California precedent under the implied warranty of habitability for ${issueFocus}, confirming that tenant occupancy does not waive repair claims and supporting Civil Code § 1942.4 statutory remedies. ${mediumCases.length} Medium-relevance appellate decisions further reinforce retroactive rent abatement and companion nuisance damages. Recommend opening the matter, collecting dated repair notices and local code inspection records, and preparing a formal habitability demand.`;
}
