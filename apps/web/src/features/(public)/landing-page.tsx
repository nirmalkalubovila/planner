import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Testimonials from "./components/Testimonials";
import UniversalAccess from "./components/UniversalAccess";
import ProblemFix from "./components/ProblemFix";
import StartNow from "./components/StartNow";
import Footer from "./components/Footer";
import SystemsOverGoals from "./components/SystemsOverGoals";
import Faq from "./components/Faq";
import { usePageMeta } from "@/hooks/use-page-meta";
import { usePublicFeedbacks } from "@/api/services/feedback-service";

export function LandingPage() {
  const { hash } = useLocation();

  usePageMeta({
    title: "AI Weekly Planner & Goal Tracker | Legacy Life Builder",
    description: "Turn big goals into daily tasks. Time-block your week, track habits, and reset your plan in one tap when life changes.",
    path: "/",
  });

  // Deep links such as /#systems: the sections render after the route loads, so scroll once they exist
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hash]);

  const { data: curatedFeedbacks } = usePublicFeedbacks();


  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#D2A226] selection:text-black antialiased">
      <Navbar />
      <Hero />

      <div className="border-t border-zinc-900/40">
        <ProblemFix />
      </div>
      <div className="border-t border-zinc-900/40">
        <SystemsOverGoals />
      </div>
      <div className="border-t border-zinc-900/40">
        <Testimonials curatedFeedbacks={curatedFeedbacks} />
      </div>
      <div className="border-t border-zinc-900/40">
        <UniversalAccess />
      </div>
      <div className="border-t border-zinc-900/40">
        <Faq />
      </div>
      <div className="border-t border-zinc-900/40">
        <StartNow />
      </div>
      <div>
        <Footer />
      </div>
    </main>
  );
}

export default LandingPage;
