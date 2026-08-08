function CheckTile() {
  return (
    <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] bg-indigo">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.2L4.8 8.5L9.5 3.5"
          stroke="#F7F6FC"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function ReportBack() {
  return (
    <section className="mx-auto max-w-[1080px] px-6 pb-20 sm:px-10 sm:pb-28">
      <div className="grid grid-cols-1 items-center gap-10 rounded-[24px] border border-border-hairline bg-card p-8 sm:p-14 md:grid-cols-[0.9fr_1.1fr] md:gap-14">
        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">
            Report back
          </span>
          <h2 className="font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">
            It learns your voice from what actually landed.
          </h2>
          <p className="text-[16px] leading-[1.62] text-text-muted">
            No forms, no dashboards. Just tell the copilot how it went. Over
            time it remembers the angles and tone that work for your
            audience — and flags when the signal&apos;s too small to trust.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="max-w-[85%] self-start rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[5px] border border-context-border bg-context-fill px-4.5 py-3.5 text-[15px] leading-[1.55] text-deep-ink sm:max-w-[80%]">
            How did the CSV update land?
          </div>
          <div className="max-w-[85%] self-end rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[5px] bg-indigo px-4.5 py-3.5 text-[15px] leading-[1.55] text-on-dark-heading sm:max-w-[80%]">
            Three replies, two signups. One said it was exactly what she
            needed.
          </div>
          <div className="max-w-[85%] self-start rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[5px] border border-context-border bg-context-fill px-4.5 py-3.5 text-[15px] leading-[1.55] text-deep-ink sm:max-w-[80%]">
            Small room, but a clear signal. Want to take this one to X?
          </div>
          <div className="mt-1 flex items-center gap-2.5 self-start pl-0.5">
            <CheckTile />
            <span className="font-display text-sm font-medium text-text-muted-2">
              Graduated to a validated story
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
