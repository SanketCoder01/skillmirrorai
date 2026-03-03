import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import TimelineSection from "@/components/landing/TimelineSection";
import SkillGalaxy from "@/components/landing/SkillGalaxy";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <HeroSection />
      <StatsSection />
      <TimelineSection />
      <SkillGalaxy />
      <TestimonialsSection />
    </main>
    <Footer />
  </div>
);

export default Index;
