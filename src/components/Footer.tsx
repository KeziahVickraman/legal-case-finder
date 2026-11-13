import { useState } from 'react';

interface FooterProps {
  onResetDemo: () => void;
}

export function Footer({ onResetDemo }: FooterProps) {
  const [justReset, setJustReset] = useState(false);

  const handleReset = () => {
    onResetDemo();
    setJustReset(true);
    setTimeout(() => setJustReset(false), 2000);
  };

  return (
    <footer className="border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p className="font-display text-base font-semibold text-slate-900">Case Finder</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
          <p className="text-sm leading-relaxed text-slate-600">
            Case data from CourtListener, a project of Free Law Project. For use by legal
            professionals. Research only; not legal advice.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="self-start text-xs font-medium text-slate-400 underline-offset-4 transition-colors hover:text-slate-700 hover:underline whitespace-nowrap shrink-0 sm:self-auto"
          >
            {justReset ? 'Demo reset' : 'Reset demo'}
          </button>
        </div>
      </div>
    </footer>
  );
}
