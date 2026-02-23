import { motion } from "framer-motion";
import { Mail, Github, Linkedin } from "lucide-react";

const AboutSection = () => (
  <section id="about" className="py-24 bg-card/20">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
          About <span className="gradient-text">SkillMirror AI</span>
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          SkillMirror AI is your intelligent career copilot that helps you analyze your resume, 
          match with job opportunities, and create a personalized career roadmap. Using advanced 
          AI technology, we provide insights into your skills, suggest improvements, and guide 
          you towards your dream career.
        </p>
        
        <div className="glass-card p-6 inline-block">
          <p className="text-sm text-muted-foreground mb-3">Created with ❤️ by</p>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">Sanket Gaikwad</h3>
          <p className="text-sm text-muted-foreground mb-4">Full Stack Developer & AI Enthusiast</p>
          
          <div className="flex justify-center gap-4">
            <a 
              href="mailto:sanketg367@gmail.com" 
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Mail className="h-4 w-4" />
              sanketg367@gmail.com
            </a>
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            <a 
              href="https://www.linkedin.com/in/sanket-gaikwad-50134a314/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-8">
          Have questions or feedback? Feel free to reach out!
        </p>
      </motion.div>
    </div>
  </section>
);

export default AboutSection;
