import { useState } from 'react';
import { ArrowRight, Clock, FileText, BookOpenCheck, Scale } from 'lucide-react';

interface ProductTabProps {
  onStartTrial: () => void;
  onViewPricing: () => void;
}

const HERO_IMAGE_PATH = '/src/assets/images/legal_research_desk_1794547029126.jpg';

const BENEFITS = [
  {
    number: '01',
    title: 'Faster intake',
    description:
      'Turn a client’s plain-language habitability complaint—mold, prolonged lack of heat, broken plumbing, or pests—into a targeted California case law query in seconds.',
    detail: 'Cuts initial intake research from hours to under three minutes.',
    icon: Clock,
  },
  {
    number: '02',
    title: 'Plain-English case summaries',
    description:
      'Every matching appellate and Supreme Court opinion is distilled into two clear sentences explaining the holding, housing defect, and remedy for intake staff.',
    detail: 'Ranked automatically by High, Medium, or Low factual relevance.',
    icon: BookOpenCheck,
  },
  {
    number: '03',
    title: 'Exportable intake briefs',
    description:
      'Generate a single-paragraph case assessment ready for supervising attorney review, copy it into your practice management system, or save it to the matter log.',
    detail: 'Consistent screening notes across every paralegal and clinic volunteer.',
    icon: FileText,
  },
];

export function ProductTab({ onStartTrial, onViewPricing }: ProductTabProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="bg-slate-50">
      {/* Hero section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-6 py-14 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="mb-4 text-sm font-semibold tracking-wide text-blue-800">
              Built for California tenant-side law firms and legal-aid clinics
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
              Screen tenant habitability claims against real case law in minutes, not hours.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Case Finder helps intake teams verify whether a tenant’s complaint—unrepaired heating,
              bedroom mold, sewage backups, or chronic pests—is backed by published California
              opinions before opening a file.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onStartTrial}
                className="inline-flex min-h-[50px] items-center gap-2.5 rounded-lg bg-blue-800 px-7 py-3.5 text-base font-semibold text-white transition-colors duration-150 hover:bg-blue-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Start free trial
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onViewPricing}
                className="inline-flex min-h-[50px] items-center rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Compare firm plans
              </button>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200 pt-8">
              <div>
                <dt className="text-sm font-medium text-slate-500">Jurisdiction</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">California courts</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Typical intake screen</dt>
                <dd className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  &lt; 3 min
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Source archive</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">CourtListener</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-5">
            <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {!imageFailed ? (
                <img
                  src={HERO_IMAGE_PATH}
                  alt="Sunlit California legal research desk with bound case reporters and intake folders"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-8 text-center">
                  <Scale className="h-12 w-12 text-slate-500" aria-hidden="true" />
                  <p className="mt-4 font-display text-xl font-semibold text-slate-800">
                    California Habitability Case Law
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Published appellate &amp; Supreme Court opinions ready for intake screening
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Three benefit cards */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Designed for high-volume tenant intake teams
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-slate-600">
            Give paralegals, intake coordinators, and housing attorneys an immediate legal footing
            during the first client call.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-blue-800 tabular-nums">
                      {benefit.number}
                    </span>
                    <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-bold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {benefit.description}
                  </p>
                </div>
                <p className="mt-6 border-t border-slate-100 pt-4 text-sm font-medium text-slate-700">
                  {benefit.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Intake workflow proof section */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">
                From client description to cited precedent in three steps
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Intake staff do not need boolean search expertise. Enter the tenant’s facts,
                review the suggested query, and export a brief grounded in published California
                decisions.
              </p>
              <button
                type="button"
                onClick={onStartTrial}
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-base font-semibold text-blue-800 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-sm"
              >
                Try the interactive Workspace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="font-mono text-xs font-semibold text-slate-500">STEP 1</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Describe complaint</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  “No heating for 3 months and mold growing along bedroom walls.”
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="font-mono text-xs font-semibold text-slate-500">STEP 2</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Verify query</p>
                <p className="mt-2 font-mono text-sm leading-relaxed text-blue-900">
                  habitability heating mold
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="font-mono text-xs font-semibold text-slate-500">STEP 3</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Save intake brief</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  3 High-relevance California cases summarised and ready for attorney review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
