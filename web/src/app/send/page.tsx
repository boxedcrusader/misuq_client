import { Suspense } from "react";
import { SendFlow } from "@/components/SendFlow";
import { RequireAuth } from "@/components/RequireAuth";

// Mirrors /capture's route shape — a bare top-level route, no dashboard
// shell exists yet to nest under.
export default function SendPage() {
  return (
    <RequireAuth>
      {/* Required by useSearchParams (the ?story= deep link) under static export. */}
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
        <SendFlow />
      </Suspense>
    </RequireAuth>
  );
}
