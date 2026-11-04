import { Suspense } from "react";
import { ReportBackFlow } from "@/components/ReportBackFlow";
import { RequireAuth } from "@/components/RequireAuth";

// Mirrors /capture and /send's route shape — a bare top-level route, no
// dashboard shell exists yet to nest under.
export default function ReportBackPage() {
  return (
    <RequireAuth>
      {/* Required by useSearchParams (the ?story= deep link) under static export. */}
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
        <ReportBackFlow />
      </Suspense>
    </RequireAuth>
  );
}
