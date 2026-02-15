import { motion } from "framer-motion";
import { Upload, Brain, BarChart3, Map } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Resume", desc: "Drop your PDF resume and paste the job description." },
  { icon: Brain, title: "AI Analysis", desc: "Gemini AI evaluates skills, gaps, and career fit." },
  { icon: BarChart3, title: "Match Score", desc: "Get your match score, ATS score, and skill breakdown." },
  { icon: Map, title: "Career Plan", desc: "Receive a 30-day roadmap, projects, and certifications." },
];

const TimelineSection = () => (
  <section id="timeline" className="py-24">
    <div className="container mx-auto px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl md:text-4xl font-bold text-center mb-16"
      >
        How <span className="gradient-text">It Works</span>
      </motion.h2>

      <div className="relative max-w-3xl mx-auto">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-secondary/50 to-accent/50 hidden md:block" />

        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            className="flex items-start gap-6 mb-12 last:mb-0"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 neon-border flex items-center justify-center">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TimelineSection;
