import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Testimonials from "./components/Testimonials";
import HowItWorks from "./components/HowItWorks";
import ProductGallery from "./components/ProductGallery";
import UniversalAccess from "./components/UniversalAccess";
import ProblemFix from "./components/ProblemFix";
import StartNow from "./components/StartNow";
import Footer from "./components/Footer";
import ResetSection from "./components/ResetSection";
import LegacyLife from "./components/LegacyLife";
import Faq from "./components/Faq";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useLandingSettings, usePublicFeedbacks } from "@/api/services/feedback-service";

export function LandingPage() {
  const { hash } = useLocation();

  usePageMeta({
    title: "AI Weekly Planner & Goal Tracker | Legacy Life Builder",
    description: "Turn big goals into daily tasks. Time-block your week, track habits, and reset your plan in one tap when life changes.",
    path: "/",
  });

  // Deep links such as /#how-it-works: the sections render after the route loads, so scroll once they exist
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [hash]);

  const { data: settings } = useLandingSettings();
  const { data: curatedFeedbacks } = usePublicFeedbacks();

  const desktopVideoUrl = settings?.desktop_video_url;
  const mobileVideoUrl = settings?.mobile_video_url;
  const desktopGallery = settings?.desktop_gallery || [];
  const mobileGallery = settings?.mobile_gallery || [];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#D2A226] selection:text-black antialiased">
      <Navbar />
      <Hero desktopVideoUrl={desktopVideoUrl} mobileVideoUrl={mobileVideoUrl} />

      <div className="border-t border-zinc-900/40">
        <LegacyLife />
      </div>
      <div className="border-t border-zinc-900/40">
        <ProblemFix />
      </div>
      <div className="border-t border-zinc-900/40">
        <HowItWorks />
      </div>
      <div className="border-t border-zinc-900/40">
        <ResetSection />
      </div>
      <div className="border-t border-zinc-900/40">
        <ProductGallery desktopImages={desktopGallery} mobileImages={mobileGallery} />
      </div>
      <div className="border-t border-zinc-900/40">
        <Testimonials curatedFeedbacks={curatedFeedbacks} />
      </div>
      <div className="border-t border-zinc-900/40">
        <UniversalAccess desktopVideoUrl={desktopVideoUrl} mobileVideoUrl={mobileVideoUrl} />
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
