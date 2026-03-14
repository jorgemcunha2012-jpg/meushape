import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoadingSpinner from "@/components/LoadingSpinner";

// Eager-loaded routes (landing + quiz start)
import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes
const QuizLoading = lazy(() => import("./pages/QuizLoading"));
const QuizEmail = lazy(() => import("./pages/QuizEmail"));
const QuizResult = lazy(() => import("./pages/QuizResult"));
const QuizPitch = lazy(() => import("./pages/QuizPitch"));
const QuizCheckout = lazy(() => import("./pages/QuizCheckout"));
const QuizSuccess = lazy(() => import("./pages/QuizSuccess"));
const QuizBodyAnalysis = lazy(() => import("./pages/QuizBodyAnalysis"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AppLogin = lazy(() => import("./pages/AppLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AppDashboard = lazy(() => import("./pages/AppDashboard"));
const AppWorkout = lazy(() => import("./pages/AppWorkout"));
const AppWorkoutDashboard = lazy(() => import("./pages/AppWorkoutDashboard"));
const AppWorkoutDetail = lazy(() => import("./pages/AppWorkoutDetail"));
const AppExerciseDetail = lazy(() => import("./pages/AppExerciseDetail"));
const AppHistory = lazy(() => import("./pages/AppHistory"));
const AppCommunity = lazy(() => import("./pages/AppCommunity"));
const AppManageWorkouts = lazy(() => import("./pages/AppManageWorkouts"));
const AppStretching = lazy(() => import("./pages/AppStretching"));
const AppCardio = lazy(() => import("./pages/AppCardio"));
const AppWarmup = lazy(() => import("./pages/AppWarmup"));
const AppHomeWorkout = lazy(() => import("./pages/AppHomeWorkout"));
const AppProfile = lazy(() => import("./pages/AppProfile"));
const AppProgramDetail = lazy(() => import("./pages/AppProgramDetail"));
const AppExploreMuscleWiki = lazy(() => import("./pages/AppExploreMuscleWiki"));
const AppMuscleWikiDetail = lazy(() => import("./pages/AppMuscleWikiDetail"));
const AppMeusTreinos = lazy(() => import("./pages/AppMeusTreinos"));
const AppInstall = lazy(() => import("./pages/AppInstall"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="meu-shape-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Quiz Funnel */}
              <Route path="/" element={<Index />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz/loading" element={<QuizLoading />} />
              <Route path="/quiz/email" element={<QuizEmail />} />
              <Route path="/quiz/analise-corporal" element={<QuizBodyAnalysis />} />
              <Route path="/quiz/resultado" element={<QuizResult />} />
              <Route path="/quiz/checkout" element={<QuizCheckout />} />
              <Route path="/checkout" element={<QuizCheckout />} />
              <Route path="/quiz/success" element={<QuizSuccess />} />
              <Route path="/quiz/pitch" element={<QuizPitch />} />
              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* Workout App */}
              <Route path="/app/login" element={<AppLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/app" element={<AppDashboard />} />
              <Route path="/app/workouts" element={<AppWorkoutDashboard />} />
              <Route path="/app/workout-detail/:workoutId" element={<AppWorkoutDetail />} />
              <Route path="/app/program/:programId" element={<AppProgramDetail />} />
              <Route path="/app/workout/:workoutId" element={<AppWorkout />} />
              <Route path="/app/exercise/:exerciseId" element={<AppExerciseDetail />} />
              <Route path="/app/history" element={<AppHistory />} />
              <Route path="/app/community" element={<AppCommunity />} />
              <Route path="/app/manage" element={<AppManageWorkouts />} />
              <Route path="/app/meus-treinos" element={<AppMeusTreinos />} />
              <Route path="/app/stretching" element={<AppStretching />} />
              <Route path="/app/cardio" element={<AppCardio />} />
              <Route path="/app/cardio/:protocolId" element={<AppCardio />} />
              <Route path="/app/warmup" element={<AppWarmup />} />
              <Route path="/app/home-workout" element={<AppHomeWorkout />} />
              <Route path="/app/home-workout/:templateId" element={<AppHomeWorkout />} />
              <Route path="/app/profile" element={<AppProfile />} />
              <Route path="/app/install" element={<AppInstall />} />
              {/* MuscleWiki */}
              <Route path="/app/explore" element={<AppExploreMuscleWiki />} />
              <Route path="/app/explore/:muscleId" element={<AppMuscleWikiDetail />} />
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
