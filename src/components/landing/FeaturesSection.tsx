import { motion } from "framer-motion";
import { Brain, FileSearch, Target, TrendingUp, Zap, Shield, BarChart3, Lightbulb } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced AI analyzes your resume against job descriptions to identify skill gaps and opportunities."
  },
  {
    icon: FileSearch,
    title: "ATS Score Checker",
    description: "Get your Applicant Tracking System score and optimize your resume to pass automated filters."
  },
  {
    icon: Target,
    title: "Skill Gap Detection",
    description: "Identify missing skills and competencies needed for your dream job with actionable insights."
  },
  {
    icon: TrendingUp,
    title: "Career Roadmap",
    description: "Receive a personalized 30-day roadmap with projects, certifications, and learning paths."
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get comprehensive career analysis in seconds, not hours. Fast, accurate, and actionable."
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is securely stored and never shared. Full control over your career information."
  },
  {
    icon: BarChart3,
    title: "Match Score",
    description: "See exactly how well your profile matches any job with detailed percentage breakdowns."
  },
  {
    icon: Lightbulb,
    title: "Smart Suggestions",
    description: "Get intelligent recommendations for resume improvements and career growth strategies."
  }
];

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-gradient-to-b from-background to-card/20">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Powerful <span className="gradient-text">Features</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Everything you need to optimize your career journey and land your dream job
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="glass-card-hover p-6 group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
