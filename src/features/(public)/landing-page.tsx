import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Testimonials from "./components/Testimonials";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import InstallBanner from "./components/InstallBanner";
import Footer from "./components/Footer";
import { FeedbackSection } from "@/features/profile/feedback-section";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black antialiased">
      <Navbar />
      <Hero />
      <Testimonials />
      <HowItWorks />

      <Features />
      <InstallBanner />
      <section className="py-24 px-4 bg-black border-t border-zinc-900/60">
        <div className="max-w-3xl mx-auto">
          <FeedbackSection />
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default LandingPage;

