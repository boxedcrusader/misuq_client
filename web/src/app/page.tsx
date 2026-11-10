import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { HowItWorks } from "@/components/HowItWorks";
import { ReportBack } from "@/components/ReportBack";
import { ClosingCta } from "@/components/ClosingCta";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { WarmUpApi } from "@/lib/warmup";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-ground text-deep-ink">
      <WarmUpApi />
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
        <ClosingCta />
      </Reveal>
      <Reveal>
        <Footer />
      </Reveal>
    </div>
  );
}
