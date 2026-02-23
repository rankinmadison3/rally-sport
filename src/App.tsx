import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import Dashboard from "@/pages/Dashboard";
import Feedback from "@/pages/Feedback";
import ActionSteps from "@/pages/ActionSteps";
import TeamCalendar from "@/pages/TeamCalendar";
import Chat from "@/pages/Chat";
import FeedbackForm from "@/pages/FeedbackForm";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/action-steps" element={<ActionSteps />} />
            <Route path="/calendar" element={<TeamCalendar />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/feedback-form" element={<FeedbackForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MobileLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
