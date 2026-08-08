export function ClosingCta() {
  return (
    <section className="mx-auto max-w-[1080px] px-6 pb-24 sm:px-10 sm:pb-32">
      <div className="flex flex-col items-center gap-5.5 rounded-[24px] border border-border-hairline bg-cta-panel px-6 py-16 text-center sm:px-14 sm:py-20">
        <h2 className="max-w-[20ch] font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[42px]">
          You built it. Let&apos;s get it noticed.
        </h2>
        <p className="max-w-[44ch] text-[16px] leading-[1.6] text-text-muted sm:text-[17px]">
          Start with one update. See a draft in minutes. Nothing goes out
          until you say so.
        </p>
        <button className="mt-1.5 cursor-pointer rounded-xl bg-indigo px-7.5 py-4 text-base font-medium text-on-indigo transition-colors hover:bg-indigo-hover">
          Draft my first update
        </button>
      </div>
    </section>
  );
}
