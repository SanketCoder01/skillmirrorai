import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

const Login = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="flex items-center justify-center min-h-screen pt-16">
      <div className="glass-card p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>
        <p className="text-center text-muted-foreground text-sm">
          Authentication coming soon.{" "}
          <Link to="/register" className="text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  </div>
);

export default Login;
