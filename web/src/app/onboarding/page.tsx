import { OnboardingFlow } from "@/components/OnboardingFlow";
import { RequireAuth } from "@/components/RequireAuth";

// First-run setup (niche → audiences → voice). New signups land here, and
// every product screen redirects here until onboarding is finished. The one
// RequireAuth screen that doesn't itself require onboarding, so it can be
// revisited later to add an audience.
export default function OnboardingPage() {
  return (
    <RequireAuth requireOnboarded={false}>
      <OnboardingFlow />
    </RequireAuth>
  );
}
