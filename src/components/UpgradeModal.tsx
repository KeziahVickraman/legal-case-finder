import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Lock, Sparkles, X } from 'lucide-react';
import { UpgradeModalReason } from '../types/caseFinder';

interface UpgradeModalProps {
  isOpen: boolean;
  reason: UpgradeModalReason;
  firmName: string;
  onClose: () => void;
  onConfirmUpgrade: () => void;
}

type ModalStep = 'compare' | 'checkout' | 'success';

const COMPARISON_ROWS = [
  { label: 'Saved matters', freeValue: '3 matters', teamValue: 'Unlimited' },
  { label: 'Intake brief', freeValue: 'Preview (1st sentence)', teamValue: 'Full brief' },
  { label: 'PDF export', freeValue: 'No', teamValue: 'Yes' },
  { label: 'Searches / month', freeValue: '20', teamValue: '300' },
];

export function UpgradeModal({
  isOpen,
  reason,
  firmName,
  onClose,
  onConfirmUpgrade,
}: UpgradeModalProps) {
  const [step, setStep] = useState<ModalStep>('compare');

  useEffect(() => {
    if (isOpen) {
      setStep('compare');
    }
  }, [isOpen, reason]);

  if (!isOpen) {
    return null;
  }

  const isSaveLimit = reason === 'save-limit';
  const heading = isSaveLimit
    ? "You've used all 3 free saves"
    : 'Upgrade to the Team plan';
  const subcopy = isSaveLimit
    ? 'Your firm is getting value from Case Finder. Upgrade to keep saving matters and unlock full intake briefs.'
    : 'Unlock full intake briefs, PDF export, unlimited saved matters, and 300 monthly searches for your firm.';

  const handleConfirmDemoCheckout = () => {
    onConfirmUpgrade();
    setStep('success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        {step === 'compare' && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  <Sparkles className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                  Premium
                </span>
                <h2
                  id="upgrade-modal-title"
                  className="mt-3 font-display text-2xl font-bold text-slate-900 sm:text-3xl"
                >
                  {heading}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-slate-600">{subcopy}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close upgrade modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Side-by-side Free vs Team comparison */}
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Free column */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-bold text-slate-900">Free</h3>
                  <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Current plan
                  </span>
                </div>
                <p className="mt-2 font-display text-3xl font-bold text-slate-900 tabular-nums">
                  $0<span className="text-base font-normal text-slate-500">/month</span>
                </p>

                <dl className="mt-5 divide-y divide-slate-200 border-t border-slate-200">
                  {COMPARISON_ROWS.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <dt className="font-medium text-slate-600">{row.label}</dt>
                      <dd className="font-semibold text-slate-800 tabular-nums">
                        {row.freeValue}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Team column */}
              <div className="rounded-xl border-2 border-blue-800 bg-white p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-bold text-slate-900">Team</h3>
                  <span className="rounded-md bg-blue-800 px-2.5 py-1 text-xs font-semibold text-white">
                    Recommended
                  </span>
                </div>
                <p className="mt-2 font-display text-3xl font-bold text-slate-900 tabular-nums">
                  $199<span className="text-base font-normal text-slate-500">/month</span>
                </p>

                <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-200">
                  {COMPARISON_ROWS.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <dt className="font-medium text-slate-600">{row.label}</dt>
                      <dd className="inline-flex items-center gap-1.5 font-semibold text-blue-900 tabular-nums">
                        <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                        {row.teamValue}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-blue-800 px-6 py-2.5 text-base font-semibold text-white hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Upgrade to Team
              </button>
            </div>
          </>
        )}

        {step === 'checkout' && (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-sm font-semibold text-blue-800">Plan upgrade</p>
                <h2
                  id="upgrade-modal-title"
                  className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl"
                >
                  Team plan — $199/month
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close checkout dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="flex items-center gap-2 text-base font-semibold text-amber-950">
                  <Lock className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  Demo checkout — no payment is taken.
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  Confirming below immediately upgrades <span className="font-semibold">{firmName}</span> in
                  this browser session without collecting billing details.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-700">
                  Included in Team plan ($199/month)
                </h3>
                <ul className="mt-3 grid grid-cols-1 gap-2.5 text-base text-slate-800 sm:grid-cols-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    Unlimited saved matters
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    Full intake briefs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    Export brief as PDF
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span className="tabular-nums">300 searches / month</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setStep('compare')}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDemoCheckout}
                className="inline-flex min-h-[46px] items-center justify-center rounded-lg bg-blue-800 px-6 py-2.5 text-base font-semibold text-white hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Confirm upgrade (demo)
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-700" aria-hidden="true" />
            </div>
            <h2
              id="upgrade-modal-title"
              className="mt-5 font-display text-3xl font-bold text-slate-900"
            >
              Welcome to Team, {firmName}!
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-slate-600">
              Your account is now on the <span className="font-semibold text-slate-900">Team plan</span>.
              All intake briefs, PDF exports, unlimited saved matters, and 300 monthly searches are
              now unlocked.
            </p>
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-slate-900 px-7 py-3 text-base font-semibold text-white hover:bg-slate-800"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
