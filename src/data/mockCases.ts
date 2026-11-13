import { CaseOpinion, SavedMatter } from '../types/caseFinder';

export const MOCK_CASES: CaseOpinion[] = [
  {
    caseName: 'Green v. Superior Court',
    court: 'Supreme Court of California',
    dateFiled: '1974-01-15',
    docketNumber: 'S.F. No. 22993',
    url: 'https://www.courtlistener.com/opinion/1242009/green-v-superior-court/',
    snippet:
      'We have concluded that a warranty of habitability is implied by law in residential leases in California and that the breach of such warranty may be raised as a defense in an unlawful detainer action. The tenant documented over 80 housing code violations including lack of heat, severe bathroom plumbing failures, and persistent dampness.',
    summary:
      'Establishes California’s implied warranty of habitability in all residential leases, covering essential heat, plumbing, and weatherproofing. Tenants may withhold rent or assert uninhabitability—including prolonged lack of heat and moisture intrusion—as a direct defense and basis for rent abatement.',
    relevance: 'High',
  },
  {
    caseName: 'Knight v. Hallsthammar',
    court: 'Supreme Court of California',
    dateFiled: '1981-02-26',
    docketNumber: 'L.A. No. 31257',
    url: 'https://www.courtlistener.com/opinion/1240892/knight-v-hallsthammar/',
    snippet:
      'A tenant’s continued occupancy of premises with known defects, such as broken heating, leaky plumbing, and chronic dampness, does not constitute a waiver of the implied warranty of habitability. Nor is a new landlord excused from liability simply because defects pre-existed a change in ownership.',
    summary:
      'Confirms that a tenant does not waive habitability rights by moving into or remaining in a unit with pre-existing heating, water, or mold defects. Once a landlord has notice of substandard conditions, failure to repair within a reasonable time establishes liability regardless of lease disclaimers.',
    relevance: 'High',
  },
  {
    caseName: 'Erlach v. Sierra Asset Servicing, LLC',
    court: 'California Court of Appeal, Third District',
    dateFiled: '2014-05-22',
    docketNumber: 'C071401',
    url: 'https://www.courtlistener.com/opinion/2675498/erlach-v-sierra-asset-servicing-llc/',
    snippet:
      'Code enforcement citations for lack of functioning heat, exposed wiring, and water intrusion rendering a residence untenantable support independent claims for breach of the implied warranty of habitability and Civil Code section 1942.4 statutory damages even after ownership transfer.',
    summary:
      'Holds that prolonged lack of heat, water leaks, and code-cited substandard conditions support both breach-of-warranty claims and statutory damages under California Civil Code § 1942.4. Useful when a tenant has notified the landlord or local code enforcement and repairs remain unaddressed.',
    relevance: 'High',
  },
  {
    caseName: 'Stoiber v. Honeychuck',
    court: 'California Court of Appeal, Fifth District',
    dateFiled: '1980-02-05',
    docketNumber: '5 Civ. No. 4168',
    url: 'https://www.courtlistener.com/opinion/2156235/stoiber-v-honeychuck/',
    snippet:
      'A residential tenant alleging severe plumbing leaks, defective heating, cockroach infestation, and interior dampness is not limited to contract remedies for breach of warranty, but may also plead tort causes of action including nuisance and intentional infliction of emotional distress.',
    summary:
      'Clarifies that California tenants facing severe mold, pest infestations, or broken plumbing may pursue tort damages for nuisance and emotional distress in addition to rent restitution. Strengthens intake leverage where landlord inaction has caused health impacts or personal property damage.',
    relevance: 'Medium',
  },
  {
    caseName: 'Hinson v. Delis',
    court: 'California Court of Appeal, First District',
    dateFiled: '1972-06-30',
    docketNumber: '1 Civ. No. 29569',
    url: 'https://www.courtlistener.com/opinion/2147120/hinson-v-delis/',
    snippet:
      'Where substantial housing code violations exist—such as a leaking toilet, damp floors, and missing glass panes—the landlord’s duty to maintain habitable premises and the tenant’s duty to pay rent are mutually dependent covenants.',
    summary:
      'Early First District precedent holding that serious plumbing and moisture-related code violations reduce the fair rental value owed by the tenant. Most helpful as foundational Bay Area appellate authority when quantifying retroactive rent abatement.',
    relevance: 'Medium',
  },
  {
    caseName: 'McNairy v. C.K. Realty',
    court: 'California Court of Appeal, Second District',
    dateFiled: '2007-04-26',
    docketNumber: 'B178918',
    url: 'https://www.courtlistener.com/opinion/2276450/mcnairy-v-ck-realty/',
    snippet:
      'In a multi-plaintiff habitability action involving long-term cockroach infestation and deteriorated plumbing fixtures across an apartment complex, non-economic discomfort and annoyance damages may be awarded alongside rent reduction without requiring expert medical testimony.',
    summary:
      'Addresses calculation of discomfort and annoyance damages in multi-tenant pest and plumbing disputes without requiring expert medical proof. Less directly on point for single-unit heating and mold complaints, though useful as secondary damages support.',
    relevance: 'Low',
  },
];

export const INITIAL_SAVED_MATTERS: SavedMatter[] = [
  {
    id: 'matter-1',
    matterName: 'Alvarez — 412 Valencia St #3B',
    problemDescription:
      "Landlord hasn't fixed the heating for 3 months and there's mould in the bedroom.",
    searchQuery: 'habitability heating mold',
    savedAt: '2026-11-10',
    cases: MOCK_CASES,
    brief:
      'Strong support: 3 High-relevance cases (Green v. Superior Court, Knight v. Hallsthammar, and Erlach v. Sierra Asset Servicing, LLC) directly support an affirmative breach of the implied warranty of habitability claim and Civil Code § 1942.4 remedies for prolonged lack of heating and bedroom mold. Two Medium-relevance appellate decisions (Stoiber v. Honeychuck and Hinson v. Delis) reinforce tort nuisance damages and retroactive rent abatement. Recommend proceeding with full intake, requesting written repair logs or SF DBI inspection records, and preserving photos of the mold and thermostat readings.',
  },
  {
    id: 'matter-2',
    matterName: 'Chen — 1840 Telegraph Ave #204',
    problemDescription:
      'Raw sewage backup in kitchen sink twice this month and recurring German cockroach infestation despite 4 written texts to property manager.',
    searchQuery: 'habitability plumbing sewage pests notice',
    savedAt: '2026-11-06',
    cases: [MOCK_CASES[0], MOCK_CASES[3], MOCK_CASES[4], MOCK_CASES[5]],
    brief:
      'Moderate-to-strong support: Green v. Superior Court and Hinson v. Delis establish clear liability for sanitation and plumbing defects affecting essential facilities, while Stoiber v. Honeychuck supports companion nuisance claims for pest and sewage exposure. McNairy v. C.K. Realty provides secondary support for general discomfort damages without medical experts. Recommend documenting the four text notices and scheduling an Oakland Code Enforcement inspection.',
  },
  {
    id: 'matter-3',
    matterName: 'Morales — 925 Chestnut St #1A',
    problemDescription:
      'Roof leak above hallway closet after October storms caused peeling plaster and damp carpet; landlord says tenant must wait until spring.',
    searchQuery: 'habitability roof leak dampness repair delay',
    savedAt: '2026-10-29',
    cases: [MOCK_CASES[1], MOCK_CASES[2], MOCK_CASES[3], MOCK_CASES[4]],
    brief:
      'Strong support: Under Knight v. Hallsthammar and Erlach v. Sierra Asset Servicing, LLC, an unreasonable seasonal delay in repairing active water intrusion violates the implied warranty of habitability once the landlord receives notice. Stoiber v. Honeychuck further supports recovery if dampness spreads or damages tenant belongings. Recommend issuing a formal 14-day demand letter under Civil Code § 1942.',
  },
];
