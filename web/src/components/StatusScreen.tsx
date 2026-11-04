import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

// Full-page state for the moments a whole screen can't render: the 404 page
// and the crash boundary. Same vocabulary as the landing page — the
// rising-dots mark, a Space Grotesk headline, muted Inter body, one indigo
// action — so falling off a path still looks like Misuq.
export function StatusScreen({
  eyebrow,
  title,
  detail,
  children,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-6 text-center">
        <Link href="/" aria-label="Misuq home" className="flex items-center gap-2.5">
          <Logo size={44} />
        </Link>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted-3">{eyebrow}</span>
          <h1 className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]">{title}</h1>
          <p className="text-[15px] leading-[1.6] text-text-muted">{detail}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">{children}</div>
      </div>
    </main>
  );
}

export const PRIMARY_ACTION =
  "rounded-full bg-indigo px-5 py-2.5 text-[14px] font-semibold text-on-indigo shadow-[0_10px_22px_-8px_rgba(91,79,233,0.55)] transition-colors hover:bg-indigo-hover";
export const SECONDARY_ACTION = "text-[14px] font-medium text-text-muted-2 transition-colors hover:text-indigo";
