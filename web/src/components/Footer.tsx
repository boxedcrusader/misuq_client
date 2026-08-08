import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border-hairline">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-3 px-6 py-8 sm:flex-row sm:justify-between sm:px-10">
        <div className="flex items-center gap-2.5">
          <Logo size={24} />
          <span className="font-display text-[15px] font-semibold">
            Misuq
          </span>
        </div>
        <span className="text-[13.5px] text-text-muted-3">
          The marketing copilot for indie SaaS founders.
        </span>
      </div>
    </footer>
  );
}
