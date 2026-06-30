import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import ScrollToTop from "@/components/ScrollToTop";
import Dashboard from "@/pages/Dashboard";
import Feedback from "@/pages/Feedback";
import Tasks from "@/pages/Tasks";
import TeamCalendar from "@/pages/TeamCalendar";
import Chat from "@/pages/Chat";
import FeedbackForm from "@/pages/FeedbackForm";
import Profile from "@/pages/Profile";
import SeasonRecord from "@/pages/SeasonRecord";
import Reflections from "@/pages/Reflections";
import FeedbackInbox from "@/pages/FeedbackInbox";

import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <AppLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><TeamCalendar /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/feedback-form" element={<ProtectedRoute><FeedbackForm /></ProtectedRoute>} />
              <Route path="/feedback/assignment/:assignmentId" element={<ProtectedRoute><FeedbackForm /></ProtectedRoute>} />
              <Route path="/feedback/form/:formId" element={<ProtectedRoute><FeedbackForm /></ProtectedRoute>} />
              <Route path="/reflections" element={<ProtectedRoute><Reflections /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/season" element={<ProtectedRoute><SeasonRecord /></ProtectedRoute>} />
              <Route path="/inbox" element={<ProtectedRoute><FeedbackInbox /></ProtectedRoute>} />
              <Route path="/__demo-seed" element={<ProtectedRoute><Demo /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
