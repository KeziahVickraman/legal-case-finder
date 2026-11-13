export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p className="font-display text-base font-semibold text-slate-900">Case Finder</p>
        <p className="text-sm leading-relaxed text-slate-600">
          Case data from CourtListener, a project of Free Law Project. For use by legal
          professionals. Research only; not legal advice.
        </p>
      </div>
    </footer>
  );
}
