import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSearch,
  FolderOpen,
  Info,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CaseFinderApiError,
  generateQuery,
  getCachedPipelineResult,
  isQueryCached,
  searchCases,
  setCachedPipelineResult,
  summariseCases,
  writeBrief,
} from '../services/caseFinderApi';
import {
  ApiErrorState,
  CaseOpinion,
  FirmPlan,
  RelevanceLevel,
  SavedMatter,
} from '../types/caseFinder';

interface WorkspaceTabProps {
  firmName: string;
  currentPlan: FirmPlan;
  searchesUsed: number;
  onIncrementUsage: () => void;
  savedMatters: SavedMatter[];
  onSaveMatter: (matter: SavedMatter) => void;
  onGoToPricing: () => void;
}

const SAMPLE_COMPLAINT =
  "Landlord hasn't fixed the heating for 3 months and there's mould in the bedroom.";
const SAMPLE_MATTER_NAME = 'Alvarez — 412 Valencia St #3B';

const RELEVANCE_ORDER: Record<RelevanceLevel, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

export function WorkspaceTab({
  firmName,
  currentPlan,
  searchesUsed,
  onIncrementUsage,
  savedMatters,
  onSaveMatter,
  onGoToPricing,
}: WorkspaceTabProps) {
  const [matterName, setMatterName] = useState<string>('');
  const [problemText, setProblemText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cases, setCases] = useState<CaseOpinion[]>([]);
  const [brief, setBrief] = useState<string>('');
  const [activeMatterId, setActiveMatterId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const [hideLowRelevance, setHideLowRelevance] = useState<boolean>(false);
  const [isGeneratingQuery, setIsGeneratingQuery] = useState<boolean>(false);
  const [isSearchingCases, setIsSearchingCases] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorState, setErrorState] = useState<ApiErrorState | null>(null);

  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [selectedOpinion, setSelectedOpinion] = useState<CaseOpinion | null>(null);

  const isLimitReached = searchesUsed >= currentPlan.monthlyLimit;
  const usagePercent = Math.min(
    100,
    Math.round((searchesUsed / currentPlan.monthlyLimit) * 100)
  );

  const sortedAndFilteredCases = useMemo(() => {
    const sorted = [...cases].sort((a, b) => {
      const aRank = a.relevance ? RELEVANCE_ORDER[a.relevance] : 3;
      const bRank = b.relevance ? RELEVANCE_ORDER[b.relevance] : 3;
      return aRank - bRank;
    });
    if (hideLowRelevance) {
      return sorted.filter((c) => c.relevance !== 'Low');
    }
    return sorted;
  }, [cases, hideLowRelevance]);

  const hiddenLowCount = useMemo(
    () => cases.filter((c) => c.relevance === 'Low').length,
    [cases]
  );

  const handleFillSample = () => {
    setErrorState(null);
    setMatterName(SAMPLE_MATTER_NAME);
    setProblemText(SAMPLE_COMPLAINT);
  };

  const handleNewIntake = () => {
    setErrorState(null);
    setMatterName('');
    setProblemText('');
    setSearchQuery('');
    setCases([]);
    setBrief('');
    setActiveMatterId(null);
    setHasSearched(false);
  };

  const handleGenerateSearch = async () => {
    setErrorState(null);
    setIsGeneratingQuery(true);
    try {
      const generated = await generateQuery(problemText);
      setSearchQuery(generated);
    } catch (err) {
      if (err instanceof CaseFinderApiError) {
        setErrorState({
          statusCode: err.statusCode,
          message: err.message,
          url: err.url,
        });
      } else {
        setErrorState({
          statusCode: 500,
          message: 'Unexpected error generating search query.',
          url: '/api/gemini/generate-query',
        });
      }
    } finally {
      setIsGeneratingQuery(false);
    }
  };

  const handleSearchCases = async () => {
    setErrorState(null);

    if (isLimitReached) {
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setErrorState({
        statusCode: 400,
        message: 'Search query cannot be empty.',
        url: 'https://www.courtlistener.com/api/rest/v4/search/?q=&type=o&order_by=dateFiled%20desc',
      });
      return;
    }

    const cachedPipeline = getCachedPipelineResult(trimmedQuery, problemText);
    if (cachedPipeline) {
      setCases(cachedPipeline.cases);
      setBrief(cachedPipeline.brief);
      setActiveMatterId(null);
      setHasSearched(true);
      return;
    }

    const wasQueryCached = isQueryCached(trimmedQuery);
    setIsSearchingCases(true);
    setLoadingStage(
      wasQueryCached
        ? 'Loading cached CourtListener opinions…'
        : 'Searching CourtListener court opinions…'
    );

    try {
      const rawCases = await searchCases(trimmedQuery);
      setLoadingStage('Summarising holdings in plain English…');
      const summarised = await summariseCases(problemText, rawCases);
      setLoadingStage('Drafting intake brief assessment…');
      const generatedBrief = await writeBrief(problemText, summarised);

      setCachedPipelineResult(trimmedQuery, problemText, summarised, generatedBrief);
      setCases(summarised);
      setBrief(generatedBrief);
      setActiveMatterId(null);
      setHasSearched(true);

      if (!wasQueryCached) {
        onIncrementUsage();
      }
    } catch (err) {
      if (err instanceof CaseFinderApiError) {
        setErrorState({
          statusCode: err.statusCode,
          message: err.message,
          url: err.url,
        });
      } else {
        setErrorState({
          statusCode: 500,
          message: 'Unable to complete case search. Please try again.',
        });
      }
    } finally {
      setIsSearchingCases(false);
      setLoadingStage('');
    }
  };

  const handleSelectSavedMatter = (matter: SavedMatter) => {
    setErrorState(null);
    setActiveMatterId(matter.id);
    setMatterName(matter.matterName);
    setProblemText(matter.problemDescription);
    setSearchQuery(matter.searchQuery);
    setCases(matter.cases);
    setBrief(matter.brief);
    setHasSearched(true);
  };

  const handleCopyBrief = async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(brief);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = brief;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  const handleSaveToMatter = () => {
    const resolvedName =
      matterName.trim() || `Intake — ${searchQuery.trim() || 'Habitability screening'}`;
    const newMatter: SavedMatter = {
      id: `matter-${Date.now()}`,
      matterName: resolvedName,
      problemDescription: problemText.trim(),
      searchQuery: searchQuery.trim(),
      savedAt: new Date().toISOString().slice(0, 10),
      cases,
      brief,
    };
    setMatterName(resolvedName);
    onSaveMatter(newMatter);
    setActiveMatterId(newMatter.id);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const renderRelevanceBadge = (relevance: RelevanceLevel | null) => {
    if (!relevance) {
      return null;
    }
    if (relevance === 'High') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 whitespace-nowrap shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
          High relevance
        </span>
      );
    }
    if (relevance === 'Medium') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 whitespace-nowrap shrink-0">
          <Info className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
          Medium relevance
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0">
        Low relevance
      </span>
    );
  };

  return (
    <div className="bg-slate-50 pb-16">
      {/* Workspace top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl font-bold text-slate-900">{firmName}</h1>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900 whitespace-nowrap">
              {currentPlan.badgeLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Usage meter */}
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-slate-700 tabular-nums">
                Searches this month:{' '}
                <span
                  className={`font-mono font-semibold ${
                    isLimitReached ? 'text-red-700' : 'text-slate-900'
                  }`}
                >
                  {searchesUsed} / {currentPlan.monthlyLimit}
                </span>
              </div>
              <div
                className="hidden h-2 w-28 overflow-hidden rounded-full bg-slate-200 sm:block"
                aria-hidden="true"
              >
                <div
                  className={`h-full transition-all duration-200 ${
                    isLimitReached ? 'bg-red-600' : 'bg-blue-800'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main workspace grid */}
      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-12 lg:px-8">
        {/* Saved matters sidebar */}
        <aside className="lg:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-slate-600" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Saved matters
                </h2>
              </div>
              <button
                type="button"
                onClick={handleNewIntake}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New
              </button>
            </div>

            {savedMatters.length === 0 ? (
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                No saved matters yet. Run a search and click <span className="font-semibold text-slate-700">Save to matter</span> to store results here.
              </p>
            ) : (
              <>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Select a client matter to reload its saved complaint, search query, and brief.
                </p>

                <ul className="mt-4 space-y-2">
                  {savedMatters.map((matter) => {
                    const isSelected = activeMatterId === matter.id;
                    return (
                      <li key={matter.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSavedMatter(matter)}
                          className={`w-full rounded-lg border px-3.5 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                            isSelected
                              ? 'border-blue-800 bg-blue-50/70 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <p className="text-sm font-semibold leading-snug text-slate-900">
                            {matter.matterName}
                          </p>
                          <p className="mt-1 truncate font-mono text-xs text-slate-500">
                            {matter.searchQuery}
                          </p>
                          <p className="mt-1.5 font-mono text-xs text-slate-400 tabular-nums">
                            Saved {matter.savedAt} · {matter.cases.length} cases
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </aside>

        {/* Primary workflow area */}
        <div className="space-y-6 lg:col-span-9">
          {/* Usage limit upgrade prompt */}
          {isLimitReached && (
            <div
              role="alert"
              className="flex flex-col justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 p-6 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 h-6 w-6 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-lg font-bold text-amber-950">
                    Monthly search limit reached ({searchesUsed} / {currentPlan.monthlyLimit})
                  </h2>
                  <p className="mt-1 text-base text-amber-900">
                    Your firm has used all searches included in the {currentPlan.badgeLabel}. Upgrade
                    your plan to continue screening new tenant intakes immediately.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onGoToPricing}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
              >
                Upgrade plan
              </button>
            </div>
          )}

          {/* Error banner */}
          {errorState && (
            <div
              role="alert"
              className="flex flex-col justify-between gap-4 rounded-xl border border-red-300 bg-red-50 p-5 sm:flex-row sm:items-start"
            >
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-base font-bold text-red-950">
                    <span className="font-mono">Error {errorState.statusCode}</span> — Request
                    failed
                  </p>
                  <p className="mt-0.5 text-base text-red-900">{errorState.message}</p>
                  {errorState.url && (
                    <p className="mt-1.5 break-all font-mono text-xs text-red-800">
                      URL called: {errorState.url}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSearchCases}
                  disabled={isLimitReached}
                  className="min-h-[40px] rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
                >
                  Retry search
                </button>
                <button
                  type="button"
                  onClick={() => setErrorState(null)}
                  aria-label="Dismiss error"
                  className="rounded-lg p-2 text-red-700 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Intake Input & Query Step */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="matter-name-input"
                    className="block text-base font-semibold text-slate-900"
                  >
                    Client / matter name
                  </label>
                  <button
                    type="button"
                    onClick={handleFillSample}
                    className="text-sm font-semibold text-blue-800 hover:text-blue-950 hover:underline"
                  >
                    Fill example complaint
                  </button>
                </div>
                <input
                  id="matter-name-input"
                  type="text"
                  value={matterName}
                  onChange={(e) => setMatterName(e.target.value)}
                  placeholder="e.g., Alvarez — 412 Valencia St #3B"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                />
              </div>

              <div>
                <label
                  htmlFor="problem-textarea"
                  className="block text-base font-semibold text-slate-900"
                >
                  Describe the tenant&apos;s problem
                </label>
                <textarea
                  id="problem-textarea"
                  rows={4}
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder="Landlord hasn't fixed the heating for 3 months and there's mould in the bedroom."
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-slate-500">
                    Include repair duration, landlord notices, and defects (heat, mold, plumbing,
                    pests).
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateSearch}
                    disabled={isGeneratingQuery || isSearchingCases}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-base font-semibold text-white transition-colors duration-150 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  >
                    {isGeneratingQuery ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Generate search
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Query step */}
              <div className="border-t border-slate-200 pt-6">
                <label
                  htmlFor="query-input"
                  className="block text-base font-semibold text-slate-900"
                >
                  Suggested search query
                </label>
                <p className="mt-1 text-sm text-slate-500">
                  Review or edit keywords before searching published court opinions.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="query-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="habitability heating mold"
                    className="w-full flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                  />
                  <button
                    type="button"
                    onClick={handleSearchCases}
                    disabled={isSearchingCases || isGeneratingQuery || isLimitReached}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-blue-800 px-7 py-3 text-base font-semibold text-white transition-colors duration-150 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  >
                    {isSearchingCases ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Searching…
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5" aria-hidden="true" />
                        Search cases
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Loading state */}
          {isSearchingCases && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center"
            >
              <Loader2 className="h-9 w-9 animate-spin text-blue-800" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold text-slate-900">
                {loadingStage || 'Screening case law…'}
              </p>
              <p className="mt-1 text-base text-slate-500">
                Querying CourtListener opinions and preparing plain-English summaries.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isSearchingCases && cases.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
              <FileSearch className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">
                {hasSearched ? 'No matching opinions found' : 'No case results loaded yet'}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-base text-slate-600">
                {hasSearched
                  ? 'CourtListener returned zero opinions for that query. Try broadening the keywords above and clicking Search cases again.'
                  : 'Describe the tenant’s habitability complaint above, click Generate search, and then click Search cases to screen real court opinions.'}
              </p>
              {!hasSearched && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleFillSample}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
                  >
                    Fill example complaint
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Intake brief panel + Case Results */}
          {!isSearchingCases && cases.length > 0 && (
            <>
              {/* Intake brief panel */}
              {brief && (
                <section
                  aria-labelledby="intake-brief-heading"
                  className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                    <div>
                      <h2
                        id="intake-brief-heading"
                        className="font-display text-2xl font-bold text-slate-900"
                      >
                        Intake brief
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-500">
                        One-paragraph assessment based on{' '}
                        <span className="font-mono tabular-nums">{cases.length}</span> matching
                        court opinions
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCopyBrief}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
                      >
                        {copiedBrief ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                            Copied brief
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 text-slate-600" aria-hidden="true" />
                            Copy brief
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveToMatter}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                      >
                        {savedNotice ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                            Saved to matter
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4" aria-hidden="true" />
                            Save to matter
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="mt-5 text-lg leading-relaxed text-slate-800">{brief}</p>
                </section>
              )}

              {/* Case results header & filter */}
              <section aria-labelledby="results-heading" className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2
                      id="results-heading"
                      className="font-display text-2xl font-bold text-slate-900"
                    >
                      Matching court opinions
                    </h2>
                    <p className="text-sm text-slate-600 tabular-nums">
                      Showing {sortedAndFilteredCases.length} of {cases.length} cases · Sorted by
                      highest relevance first
                    </p>
                  </div>

                  <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 select-none hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={hideLowRelevance}
                      onChange={(e) => setHideLowRelevance(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-700"
                    />
                    <span>
                      Hide Low relevance
                      {hiddenLowCount > 0 ? ` (${hiddenLowCount})` : ''}
                    </span>
                  </label>
                </div>

                {/* Case cards */}
                {sortedAndFilteredCases.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                    <p className="text-base font-medium text-slate-700">
                      All matching opinions are currently hidden by the Low relevance filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => setHideLowRelevance(false)}
                      className="mt-4 inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Show all cases
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedAndFilteredCases.map((opinion, index) => (
                      <article
                        key={`${opinion.caseName}-${opinion.docketNumber}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">
                              {opinion.caseName}
                            </h3>
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                              <span className="font-medium text-slate-700">{opinion.court}</span>
                              {opinion.dateFiled && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">{opinion.dateFiled}</span>
                                </>
                              )}
                              {opinion.docketNumber && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono">{opinion.docketNumber}</span>
                                </>
                              )}
                            </p>
                          </div>

                          {renderRelevanceBadge(opinion.relevance)}
                        </div>

                        <p className="mt-4 text-base leading-relaxed text-slate-800">
                          {opinion.summary ||
                            opinion.snippet ||
                            'No summary or excerpt returned for this opinion.'}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => setSelectedOpinion(opinion)}
                            className="inline-flex items-center gap-1.5 text-base font-semibold text-blue-800 hover:text-blue-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-sm"
                          >
                            Read full opinion
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Opinion Excerpt Drawer / Modal */}
      {selectedOpinion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="opinion-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="mb-2">{renderRelevanceBadge(selectedOpinion.relevance)}</div>
                <h2
                  id="opinion-modal-title"
                  className="font-display text-2xl font-bold text-slate-900"
                >
                  {selectedOpinion.caseName}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
                  <span>{selectedOpinion.court}</span>
                  {selectedOpinion.dateFiled && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{selectedOpinion.dateFiled}</span>
                    </>
                  )}
                  {selectedOpinion.docketNumber && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{selectedOpinion.docketNumber}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpinion(null)}
                aria-label="Close opinion details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {selectedOpinion.summary && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500">Plain-English summary</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-slate-900">
                    {selectedOpinion.summary}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-500">
                  Opinion excerpt (CourtListener archive)
                </h3>
                <p className="mt-2 text-base leading-relaxed text-slate-800">
                  {selectedOpinion.snippet
                    ? `“${selectedOpinion.snippet}”`
                    : 'No text snippet provided by CourtListener for this record.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
              <a
                href={selectedOpinion.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-950 hover:underline"
              >
                Open record on CourtListener
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setSelectedOpinion(null)}
                className="min-h-[42px] rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
