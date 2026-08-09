import { CaptureFlow } from "@/components/CaptureFlow";

// New route for the product screens (distinct from "/", the marketing
// landing page). A reasonable minimal choice for this narrow slice — no
// existing "/app" or dashboard shell to fit into yet, so this is a bare
// top-level route rather than invented nesting.
export default function CapturePage() {
  return <CaptureFlow />;
}
