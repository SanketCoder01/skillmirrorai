import { motion } from "framer-motion";
import { Mail, Linkedin, Instagram, Sparkles, Heart, Code2, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <Sparkles className="h-4 w-4" />
                About SkillMirror AI
              </motion.div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Meet the <span className="gradient-text">Creator</span>
              </h1>
            </div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-card p-8 md:p-12 text-center mb-12"
            >
              {/* Profile Image Placeholder */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-32 h-32 mx-auto mb-6"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/30 flex items-center justify-center overflow-hidden">
                  <img
                    src="/profile-image.jpg"
                    alt="Sanket Gaikwad"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                >
                  <Code2 className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              </motion.div>

              {/* Name */}
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Sanket Gaikwad</h2>
              <p className="text-muted-foreground mb-6">Full Stack Developer & AI Enthusiast</p>

              {/* Social Links */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                {/* Email */}
                <a
                  href="mailto:sanketg367@gmail.com"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  sanketg367@gmail.com
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/sanket-gaikwad-50134a314/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/10 hover:bg-[#0077B5]/20 transition-colors text-sm text-[#0077B5]"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/mr.sanketgofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#F77737]/20 transition-colors text-sm"
                >
                  <Instagram className="h-4 w-4 text-[#E4405F]" />
                  @mr.sanketgofficial
                </a>
              </div>

              {/* Divider */}
              <div className="border-t border-border/50 pt-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Built with passion</span>
                </div>
              </div>
            </motion.div>

            {/* About the Website */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">About SkillMirror AI</h3>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  SkillMirror AI is a smart career platform built to help students and job seekers 
                  improve their resumes and plan their career journey. It uses AI to analyze your 
                  resume, check ATS compatibility, and suggest improvements.
                </p>
                <p>
                  The platform provides personalized career roadmaps, skill gap analysis, and 
                  certificate verification. Whether you're a fresh graduate or looking to switch 
                  careers, SkillMirror helps you understand where you stand and what steps to take next.
                </p>
                <p>
                  I built this project to solve a problem I faced myself – understanding what 
                  skills I needed and how to present myself better to employers. I hope it helps 
                  you as much as it helped me!
                </p>
              </div>

              {/* Features List */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: "📄", label: "Resume Analysis" },
                  { icon: "✅", label: "ATS Score" },
                  { icon: "🗺️", label: "Career Roadmap" },
                  { icon: "🏆", label: "Certificates" },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="text-center p-4 rounded-lg bg-muted/30"
                  >
                    <span className="text-2xl mb-2 block">{feature.icon}</span>
                    <span className="text-xs text-muted-foreground">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-12"
            >
              <p className="text-muted-foreground mb-4">
                Have questions, feedback, or just want to say hi?
              </p>
              <a
                href="mailto:sanketg367@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Get in Touch
              </a>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
