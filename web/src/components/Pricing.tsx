const tiers = [
  {
    name: "Starter",
    price: "$19",
    description: "One email list, one wide channel. Unlimited drafts and staging.",
    cta: "Choose Starter",
    featured: false,
  },
  {
    name: "Growth",
    price: "$49",
    description: "Three channels, plus voice and tone memory across your stories.",
    cta: "Choose Growth",
    featured: true,
    badge: "Popular",
  },
  {
    name: "Scale",
    price: "$99",
    description: "Unlimited channels and priority access to cross-founder insights.",
    cta: "Choose Scale",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1080px] px-6 pb-24 sm:px-10 sm:pb-32">
      <div className="mb-11 flex max-w-[48ch] flex-col gap-3.5 sm:mb-13">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">
          Pricing
        </span>
        <h2 className="font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[38px]">
          Flat tiers. No per-draft metering.
        </h2>
        <p className="text-[16px] leading-[1.6] text-text-muted sm:text-[17px]">
          The loop is meant to be slow and considered, so you&apos;re never
          charged to think.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={
              "flex flex-col gap-5.5 rounded-[18px] border p-8 " +
              (tier.featured
                ? "border-indigo bg-indigo shadow-[var(--shadow-feat)]"
                : "border-border-hairline bg-card")
            }
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span
                  className={
                    "font-display text-[19px] font-semibold " +
                    (tier.featured ? "text-white" : "text-deep-ink")
                  }
                >
                  {tier.name}
                </span>
                {tier.badge && (
                  <span className="rounded-full bg-on-dark-heading px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo">
                    {tier.badge}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={
                    "font-display text-4xl font-semibold tracking-[-0.02em] " +
                    (tier.featured ? "text-white" : "text-deep-ink")
                  }
                >
                  {tier.price}
                </span>
                <span
                  className={
                    "text-[15px] " +
                    (tier.featured ? "text-[#C9C3FF]" : "text-text-muted-3")
                  }
                >
                  /mo
                </span>
              </div>
              <span
                className={
                  "text-sm leading-[1.5] " +
                  (tier.featured ? "text-[#DCD8FB]" : "text-text-muted-2")
                }
              >
                {tier.description}
              </span>
            </div>
            <button
              className={
                "cursor-pointer rounded-[11px] p-3 text-[15px] font-medium transition-colors " +
                (tier.featured
                  ? "bg-on-indigo text-indigo hover:bg-white"
                  : "border border-border-input bg-transparent text-deep-ink hover:bg-ground")
              }
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
