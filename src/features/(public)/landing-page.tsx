import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import InstallBanner from "./components/InstallBanner";
import Footer from "./components/Footer";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black antialiased">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <InstallBanner />
      <Footer />
    </main>
  );
}

export default LandingPage;
