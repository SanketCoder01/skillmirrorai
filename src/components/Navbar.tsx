import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "How It Works", to: "/#timeline" },
  { label: "About", to: "/#about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (to === "/") {
      e.preventDefault();
      if (location.pathname !== "/" || location.hash) {
        navigate("/");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (to.startsWith("/#")) {
      e.preventDefault();
      const id = to.slice(2);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(to);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold gradient-text">SkillMirror AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={(e) => handleNavClick(e, l.to)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button size="sm" className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="btn-glow bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden glass-card border-t border-border/30 px-4 pb-4"
        >
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={(e) => {
                handleNavClick(e, l.to);
                setMobileOpen(false);
              }}
              className="block py-2 text-sm text-muted-foreground hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            {user ? (
              <>
                <Link to="/dashboard" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full btn-glow bg-primary text-primary-foreground">Dashboard</Button>
                </Link>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sign Out</Button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full btn-glow bg-primary text-primary-foreground">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
