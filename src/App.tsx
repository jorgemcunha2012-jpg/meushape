import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import QuizLoading from "./pages/QuizLoading";
import QuizEmail from "./pages/QuizEmail";
import QuizResult from "./pages/QuizResult";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AppLogin from "./pages/AppLogin";
import AppDashboard from "./pages/AppDashboard";
import AppWorkout from "./pages/AppWorkout";
import AppHistory from "./pages/AppHistory";
import AppCommunity from "./pages/AppCommunity";
import AppManageWorkouts from "./pages/AppManageWorkouts";
import AppStretching from "./pages/AppStretching";
import AppCardio from "./pages/AppCardio";
import AppWarmup from "./pages/AppWarmup";
import AppHomeWorkout from "./pages/AppHomeWorkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Quiz Funnel */}
            <Route path="/" element={<Index />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/loading" element={<QuizLoading />} />
            <Route path="/quiz/email" element={<QuizEmail />} />
            <Route path="/quiz/resultado" element={<QuizResult />} />
            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Workout App */}
            <Route path="/app/login" element={<AppLogin />} />
            <Route path="/app" element={<AppDashboard />} />
            <Route path="/app/workout/:workoutId" element={<AppWorkout />} />
            <Route path="/app/history" element={<AppHistory />} />
            <Route path="/app/community" element={<AppCommunity />} />
            <Route path="/app/manage" element={<AppManageWorkouts />} />
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
