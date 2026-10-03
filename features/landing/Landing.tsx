import "./landing.css";
import { HeroBackground } from "./HeroBackground";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { SecuritySection } from "./SecuritySection";
import { ProductFlow } from "./ProductFlow";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";

/** Server component: only Navbar, HeroBackground and Reveal are client islands. */
export function Landing() {
  return (
    <div className="landing">
      <HeroBackground />
      <div className="l-content">
        <Navbar />
        <main id="main">
          <Hero />
          <HowItWorks />
          <SecuritySection />
          <ProductFlow />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
