import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import QuizLoading from "./pages/QuizLoading";
import QuizEmail from "./pages/QuizEmail";
import QuizResult from "./pages/QuizResult";
import QuizBodyAnalysis from "./pages/QuizBodyAnalysis";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AppLogin from "./pages/AppLogin";
import AppDashboard from "./pages/AppDashboard";
import AppWorkout from "./pages/AppWorkout";
import AppWorkoutDashboard from "./pages/AppWorkoutDashboard";
import AppWorkoutDetail from "./pages/AppWorkoutDetail";
import AppExerciseDetail from "./pages/AppExerciseDetail";
import AppHistory from "./pages/AppHistory";
import AppCommunity from "./pages/AppCommunity";
import AppManageWorkouts from "./pages/AppManageWorkouts";
import AppStretching from "./pages/AppStretching";
import AppCardio from "./pages/AppCardio";
import AppWarmup from "./pages/AppWarmup";
import AppHomeWorkout from "./pages/AppHomeWorkout";
import AppProfile from "./pages/AppProfile";
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
            <Route path="/quiz/analise-corporal" element={<QuizBodyAnalysis />} />
            <Route path="/quiz/resultado" element={<QuizResult />} />
            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Workout App */}
            <Route path="/app/login" element={<AppLogin />} />
            <Route path="/app" element={<AppDashboard />} />
            <Route path="/app/workouts" element={<AppWorkoutDashboard />} />
            <Route path="/app/workout-detail/:workoutId" element={<AppWorkoutDetail />} />
            <Route path="/app/workout/:workoutId" element={<AppWorkout />} />
            <Route path="/app/exercise/:exerciseId" element={<AppExerciseDetail />} />
            <Route path="/app/history" element={<AppHistory />} />
            <Route path="/app/community" element={<AppCommunity />} />
            <Route path="/app/manage" element={<AppManageWorkouts />} />
            <Route path="/app/stretching" element={<AppStretching />} />
            <Route path="/app/cardio" element={<AppCardio />} />
            <Route path="/app/cardio/:protocolId" element={<AppCardio />} />
            <Route path="/app/warmup" element={<AppWarmup />} />
            <Route path="/app/home-workout" element={<AppHomeWorkout />} />
            <Route path="/app/home-workout/:templateId" element={<AppHomeWorkout />} />
            <Route path="/app/profile" element={<AppProfile />} />
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
