import { Suspense } from "react";
import { LoginScreen } from "@/components/LoginScreen";

// Log in / create account. Product screens (/home, /capture, /send,
// /report-back, /graduate) redirect here via RequireAuth when there's no
// session, passing ?next= so the founder lands back where they were.
// ?mode=signup opens straight on the create-account form.
//
// Suspense is required, not decorative: LoginScreen reads useSearchParams,
// which can't be known at static-export prerender time.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <LoginScreen />
    </Suspense>
  );
}
