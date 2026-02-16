import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroScene from "./HeroScene";

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
    {/* Spline background */}
    <iframe
      src="https://my.spline.design/claritystream-K3uc10VRzKOVW4sE9VhGdVYC/"
      frameBorder="0"
      className="absolute inset-0 w-full h-full z-0"
      style={{ pointerEvents: "none" }}
    />
    
    {/* 3D Scene overlay */}
    <div className="absolute inset-0 z-[1]">
      <HeroScene />
    </div>

    <div className="container mx-auto px-4 relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <span className="inline-block mb-4 px-4 py-1.5 text-xs font-medium tracking-wider uppercase rounded-full neon-border text-primary bg-primary/5">
          AI-Powered Career Intelligence
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
      >
        Your AI{" "}
        <span className="gradient-text">Career Copilot</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
      >
        Analyze. Optimize. Dominate Your Dream Job.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link to="/register">
          <Button size="lg" className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8">
            Start Free Analysis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link to="/login">
          <Button size="lg" variant="outline" className="neon-border text-foreground hover:bg-primary/5 text-base px-8">
            Sign In
          </Button>
        </Link>
      </motion.div>
    </div>

    {/* Bottom gradient fade */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
  </section>
);

export default HeroSection;
