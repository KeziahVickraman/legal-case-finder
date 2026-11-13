import React, { useState } from 'react';
import { Check, Building2, X, CheckCircle2 } from 'lucide-react';
import { PlanId } from '../types/caseFinder';

interface PricingTabProps {
  currentPlanId: PlanId;
  onSelectPlan: (planId: PlanId) => void;
  onOpenTeamUpgrade?: () => void;
}

export function PricingTab({
  currentPlanId,
  onSelectPlan,
  onOpenTeamUpgrade,
}: PricingTabProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !email.trim() || !email.includes('@')) {
      setContactError('Please enter your organization name and a valid work email address.');
      return;
    }
    setContactError('');
    setContactSubmitted(true);
  };

  const resetModal = () => {
    setContactOpen(false);
    setContactSubmitted(false);
    setContactError('');
    setOrgName('');
    setEmail('');
    setNotes('');
  };

  return (
    <div className="bg-slate-50 py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Clear pricing for tenant advocates
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Built for solo practitioners, multi-attorney tenant firms, and nonprofit legal-aid
            clinics across California.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
          {/* Solo plan */}
          <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-slate-900">Solo</h2>
                {currentPlanId === 'solo' && (
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900 whitespace-nowrap">
                    Current plan
                  </span>
                )}
              </div>
              <p className="mt-2 text-base text-slate-600">
                For independent tenant attorneys screening new consultations.
              </p>

              <div className="mt-6 flex items-baseline gap-1.5 border-b border-slate-100 pb-6">
                <span className="font-display text-4xl font-bold text-slate-900 tabular-nums">
                  $49
                </span>
                <span className="text-base font-medium text-slate-500">/month</span>
              </div>

              <ul className="mt-6 space-y-4 text-base text-slate-700">
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>1 seat included</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span className="tabular-nums">100 searches/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>Plain-English California opinion summaries</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('solo')}
              className={`mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg px-5 py-3 text-base font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                currentPlanId === 'solo'
                  ? 'border border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200'
                  : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
              }`}
            >
              {currentPlanId === 'solo' ? 'Open Solo workspace' : 'Choose Solo'}
            </button>
          </article>

          {/* Team plan (Most popular) */}
          <article className="relative flex flex-col justify-between rounded-xl border-2 border-blue-800 bg-white p-8 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-slate-900">Team</h2>
                <span className="rounded-md bg-blue-800 px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                  Most popular
                </span>
              </div>
              <p className="mt-2 text-base text-slate-600">
                For tenant-side law firms managing shared intake queues and matter files.
              </p>

              <div className="mt-6 flex items-baseline gap-1.5 border-b border-slate-100 pb-6">
                <span className="font-display text-4xl font-bold text-slate-900 tabular-nums">
                  $199
                </span>
                <span className="text-base font-medium text-slate-500">/month</span>
              </div>

              <ul className="mt-6 space-y-4 text-base text-slate-700">
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span className="tabular-nums">5 seats included</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span className="tabular-nums">300 searches/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>Saved matters library across your firm</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>Exportable one-paragraph intake briefs</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                if (currentPlanId === 'free' && onOpenTeamUpgrade) {
                  onOpenTeamUpgrade();
                } else {
                  onSelectPlan('team');
                }
              }}
              className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-blue-800 px-5 py-3 text-base font-semibold text-white transition-colors duration-150 hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              {currentPlanId === 'team'
                ? 'Continue with Team plan'
                : currentPlanId === 'free'
                ? 'Upgrade to Team'
                : 'Start Team free trial'}
            </button>
          </article>

          {/* Legal Aid plan */}
          <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-bold text-slate-900">Legal Aid</h2>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Discounted
                </span>
              </div>
              <p className="mt-2 text-base text-slate-600">
                For nonprofit organisations, eviction defense clinics, and pro bono collectives.
              </p>

              <div className="mt-6 flex items-baseline gap-2 border-b border-slate-100 pb-6">
                <span className="font-display text-4xl font-bold text-slate-900">
                  Contact us
                </span>
              </div>

              <ul className="mt-6 space-y-4 text-base text-slate-700">
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>Discounted nonprofit pricing for 501(c)(3) offices</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>Custom seat counts for staff attorneys &amp; clinic volunteers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>Full saved matters &amp; exportable intake briefs</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-900 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Contact us
            </button>
          </article>
        </div>

        {/* Comparison note */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-white px-6 py-5 text-base text-slate-700">
          All plans screen claims against published California appellate and Supreme Court opinions
          archived in CourtListener and include a 14-day free trial with no setup fees.
        </div>
      </div>

      {/* Legal Aid inquiry modal */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-aid-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="legal-aid-modal-title"
                  className="font-display text-2xl font-bold text-slate-900"
                >
                  Legal Aid &amp; Nonprofit Inquiry
                </h2>
                <p className="mt-1 text-base text-slate-600">
                  Tell us about your California clinic or legal-aid office.
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                aria-label="Close inquiry dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {contactSubmitted ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-center gap-3 text-emerald-900">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
                  <p className="text-lg font-semibold">Request received</p>
                </div>
                <p className="mt-2 text-base text-emerald-800">
                  Thank you, <span className="font-semibold">{orgName}</span>. Our legal-aid
                  partnerships team will follow up at <span className="font-mono">{email}</span>{' '}
                  within one business day with discounted nonprofit access.
                </p>
                <button
                  type="button"
                  onClick={resetModal}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                {contactError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                    {contactError}
                  </p>
                )}
                <div>
                  <label
                    htmlFor="org-name"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Organization name
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g., East Bay Community Law Center"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="org-email"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Work email
                  </label>
                  <input
                    id="org-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="intake@organization.org"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="org-notes"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Approximate team size (optional)
                  </label>
                  <input
                    id="org-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., 8 intake staff and 4 housing attorneys"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-base text-slate-900 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-lg bg-blue-800 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-900"
                  >
                    Submit inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
