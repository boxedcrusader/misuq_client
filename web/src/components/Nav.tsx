import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <nav className="mx-auto flex w-full max-w-[1080px] items-center justify-between px-6 py-7 sm:px-10">
      <div className="flex items-center gap-3">
        <Logo size={30} />
        <span className="font-display text-lg font-semibold tracking-tight">
          Misuq
        </span>
      </div>
      <div className="flex items-center gap-5 sm:gap-8">
        <a
          href="#how"
          className="hidden text-[14.5px] font-normal text-text-muted sm:inline"
          style={{ fontWeight: 450 }}
        >
          How it works
        </a>
        <a
          href="#pricing"
          className="hidden text-[14.5px] font-normal text-text-muted sm:inline"
          style={{ fontWeight: 450 }}
        >
          Pricing
        </a>
        <ThemeToggle />
        <button className="rounded-[10px] bg-indigo px-4.5 py-2.5 text-[14.5px] font-medium text-on-indigo transition-colors hover:bg-indigo-hover cursor-pointer">
          Start free
        </button>
      </div>
    </nav>
  );
}
