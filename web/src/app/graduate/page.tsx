import { Suspense } from "react";
import { GraduateFlow } from "@/components/GraduateFlow";
import { RequireAuth } from "@/components/RequireAuth";

// Mirrors /capture, /send, /report-back's route shape — a bare top-level
// route, no dashboard shell exists yet to nest under.
export default function GraduatePage() {
  return (
    <RequireAuth>
      {/* Required by useSearchParams (the ?story= deep link) under static export. */}
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
        <GraduateFlow />
      </Suspense>
    </RequireAuth>
  );
}
