import { Sparkles, Linkedin, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/30 bg-card/20 py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display font-bold gradient-text">SkillMirror AI</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 SkillMirror AI. Your Intelligent Career Copilot.
        </p>
        <div className="flex items-center gap-3">
          <a href="https://www.linkedin.com/in/sanket-gaikwad-50134a314/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Linkedin className="h-5 w-5" />
          </a>
          <a href="https://www.instagram.com/mr.sanketgofficial" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Instagram className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
