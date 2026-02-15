import { Sparkles } from "lucide-react";

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
      </div>
    </div>
  </footer>
);

export default Footer;
