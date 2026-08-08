import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { HowItWorks } from "@/components/HowItWorks";
import { ReportBack } from "@/components/ReportBack";
import { Pricing } from "@/components/Pricing";
import { ClosingCta } from "@/components/ClosingCta";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-ground text-deep-ink">
      <Nav />
      <Reveal>
        <Hero />
      </Reveal>
      <Reveal>
        <Problem />
      </Reveal>
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <ReportBack />
      </Reveal>
      <Reveal>
        <Pricing />
      </Reveal>
      <Reveal>
        <ClosingCta />
      </Reveal>
      <Reveal>
        <Footer />
      </Reveal>
    </div>
  );
}
