import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import DemoVideo from "@/components/landing/DemoVideo";
import Screenshots from "@/components/landing/Screenshots";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import SupportCTA from "@/components/landing/SupportCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturesGrid />
        <DemoVideo />
        <Screenshots />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <SupportCTA />
      </main>
      <Footer />
    </>
  );
}
