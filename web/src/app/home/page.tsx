import { HomeHub } from "@/components/HomeHub";

// The post-onboarding landing spot — separate from "/", the marketing
// landing page, which is untouched by this route. "/home" chosen over
// "/app" to avoid any confusion with the app/ directory naming itself.
export default function HomePage() {
  return <HomeHub />;
}
