const steps = [
  {
    n: "01",
    title: "Capture",
    body: "Drop in a raw update — a shipped feature, a milestone, a lesson.",
  },
  {
    n: "02",
    title: "Draft",
    body: "The copilot shapes it into a first version for your preview list.",
  },
  {
    n: "03",
    title: "Send",
    body: "You send it to your own small audience. You're always in control.",
  },
  {
    n: "04",
    title: "Report back",
    body: "Tell it how it landed, in plain words — replies, signups, silence.",
  },
  {
    n: "05",
    title: "Graduate",
    body: "When you say it's ready, it's reshaped for X, LinkedIn, and beyond.",
    featured: true,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1080px] px-6 py-20 sm:px-10 sm:py-28">
      <div className="mb-12 flex max-w-[52ch] flex-col gap-3.5 sm:mb-14">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">
          How it works
        </span>
        <h2 className="font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[38px]">
          Preview it in the small room before opening night.
        </h2>
        <p className="text-[16px] leading-[1.6] text-text-muted sm:text-[17px]">
          Every story gets tested on people who already know you, so you
          learn what works before it hits a cold, public audience.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.n}
            className={
              "flex flex-col gap-3 rounded-2xl border p-6 " +
              (step.featured
                ? "border-indigo bg-indigo"
                : "border-border-hairline bg-card")
            }
          >
            <span
              className={
                "font-display text-sm font-semibold " +
                (step.featured ? "text-[#C9C3FF]" : "text-indigo")
              }
            >
              {step.n}
            </span>
            <span
              className={
                "font-display text-lg font-semibold tracking-[-0.01em] " +
                (step.featured ? "text-white" : "text-deep-ink")
              }
            >
              {step.title}
            </span>
            <span
              className={
                "text-sm leading-[1.55] " +
                (step.featured ? "text-[#DCD8FB]" : "text-text-muted-2")
              }
            >
              {step.body}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
