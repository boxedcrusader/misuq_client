export function Hero() {
  return (
    <header className="mx-auto grid max-w-[1080px] grid-cols-1 items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:py-24">
      <div className="flex flex-col gap-7">
        <span
          className="self-start rounded-full border border-border-badge px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-text-muted-3"
        >
          For indie SaaS founders
        </span>
        <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[48px] md:text-[58px] md:leading-[1.02]">
          Shipping got easy. Getting noticed didn&apos;t.
        </h1>
        <p className="max-w-[46ch] text-[17px] leading-relaxed text-text-muted sm:text-[19px] sm:leading-[1.6]">
          Misuq is a marketing copilot that drafts your build-in-public
          updates, tests them on your own small audience first, and only
          takes the winners wider. You approve everything. Nothing posts on
          its own.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3.5">
          <button className="cursor-pointer rounded-xl bg-indigo px-6.5 py-3.5 text-base font-medium text-on-indigo transition-colors hover:bg-indigo-hover">
            Draft my first update
          </button>
          <button className="cursor-pointer rounded-xl border border-border-input bg-transparent px-6.5 py-3.5 text-base font-medium text-deep-ink transition-colors hover:bg-card">
            See how it works
          </button>
        </div>
        <div className="mt-1 text-[13.5px] text-text-muted-3">
          No card required · No auto-posting, ever · Founder-paced
        </div>
      </div>

      {/* hero chat visual */}
      <div className="rounded-[20px] border border-border-hairline bg-card p-6 shadow-[var(--shadow-hero)]">
        <div className="mb-5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-text-muted-3">
          Capture
        </div>
        <div className="font-display mb-4.5 text-xl font-medium tracking-[-0.015em] sm:text-[22px]">
          What&apos;d you ship or learn?
        </div>
        <div className="min-h-[74px] rounded-xl border border-indigo bg-card p-4 text-[15px] leading-[1.55] text-deep-ink shadow-[0_0_0_3px_var(--ring)]">
          Shipped one-click CSV export. Two beta users had asked for it.
        </div>
        <div className="mt-5.5 flex flex-col gap-3">
          <div className="max-w-[88%] self-start rounded-tl-[14px] rounded-tr-[14px] rounded-bl-[4px] rounded-br-[14px] border border-context-border bg-context-fill px-4 py-3 text-[14.5px] leading-relaxed text-deep-ink">
            Nice — that&apos;s a &ldquo;someone asked, I built it&rdquo; story.
            Draft ready for your list?
          </div>
          <div className="flex gap-2.5 self-start">
            <span className="rounded-full bg-indigo px-3.5 py-1.5 text-[13px] font-medium text-on-indigo">
              Draft it
            </span>
            <span
              className="rounded-full border border-border-input px-3.5 py-1.5 text-[13px] font-normal text-text-muted-2"
              style={{ fontWeight: 450 }}
            >
              Add context
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
