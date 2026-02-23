import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import RecruiterLogin from "./pages/RecruiterLogin";
import RecruiterLayout from "./pages/RecruiterLayout";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterProfile from "./pages/RecruiterProfile";
import RecruiterInbox from "./pages/RecruiterInbox";
import RecruiterSettings from "./pages/RecruiterSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import StudentInbox from "./pages/StudentInbox";
import StudentProfile from "./pages/StudentProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/recruiter" element={<RecruiterLogin />} />
              <Route path="/recruiter/login" element={<RecruiterLogin />} />
              <Route path="/recruiter" element={<ProtectedRoute><RecruiterLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<RecruiterDashboard />} />
                <Route path="inbox" element={<RecruiterInbox />} />
                <Route path="profile" element={<RecruiterProfile />} />
                <Route path="settings" element={<RecruiterSettings />} />
              </Route>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
