import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Testimonials from "./components/Testimonials";
import HowItWorks from "./components/HowItWorks";
import ProductGallery from "./components/ProductGallery";
import Features from "./components/Features";
import InstallBanner from "./components/InstallBanner";
import Footer from "./components/Footer";
import { useLandingSettings, usePublicFeedbacks } from "@/api/services/feedback-service";

export function LandingPage() {
  const { data: settings } = useLandingSettings();
  const { data: curatedFeedbacks } = usePublicFeedbacks();

  const desktopVideoUrl = settings?.desktop_video_url;
  const mobileVideoUrl = settings?.mobile_video_url;
  const desktopGallery = settings?.desktop_gallery || [];
  const mobileGallery = settings?.mobile_gallery || [];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black antialiased">
      <Navbar />
      <Hero desktopVideoUrl={desktopVideoUrl} mobileVideoUrl={mobileVideoUrl} />

      <div className="border-t border-zinc-900/40">
        <Testimonials curatedFeedbacks={curatedFeedbacks} />
      </div>
      <div className="border-t border-zinc-900/40">
        <HowItWorks />
      </div>
      <div className="border-t border-zinc-900/40">
        <ProductGallery desktopImages={desktopGallery} mobileImages={mobileGallery} />
      </div>
      <div className="border-t border-zinc-900/40">
        <Features />
      </div>
      <div className="border-t border-zinc-900/40">
        <InstallBanner />
      </div>
      <div className="border-t border-zinc-900/40">
        <Footer />
      </div>
    </main>
  );
}

export default LandingPage;
