import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSolar } from "@/components/SolarLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Check, Dumbbell, Flame, Heart, Zap, Target, Timer, Trophy, Lock } from "lucide-react";
import OnboardingDrawer from "@/components/OnboardingDrawer";
import { canGeneratePlan, daysUntilNextPlan, setPlanGenerated } from "@/services/cacheService";
import { useGenerationLimits } from "@/hooks/useGenerationLimits";

interface AIWorkoutWizardProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

const AIWorkoutWizard = ({ userId, onComplete, onCancel }: AIWorkoutWizardProps) => {
  const S = useSolar();
  const limits = useGenerationLimits(userId);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasOnboardingData, setHasOnboardingData] = useState<boolean | null>(null);
  const workoutIcons = [Dumbbell, Flame, Heart, Zap, Target, Timer, Trophy, Sparkles];
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (generating && !done) {
      const interval = setInterval(() => {
        setIconIndex(prev => (prev + 1) % workoutIcons.length);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [generating, done]);

  const checkOnboarding = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_answers")
      .eq("id", userId)
      .single();
    const answers = data?.onboarding_answers as Record<string, any> | null;
    const hasData = answers && Object.keys(answers).length > 0 && answers.goal;
    setHasOnboardingData(!!hasData);
  };

  const generateWorkout = async () => {
    setGenerating(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_answers, profile_scores")
        .eq("id", userId)
        .single();

      const onboarding = profile?.onboarding_answers as Record<string, any> || {};
      
      // Map onboarding_answers to quiz format for the edge function
      const quizAnswers: Record<string, any> = {};
      
      // Goal
      const goalMap: Record<string, string> = { lose_weight: "t01a", tone_up: "t01b", lose_and_tone: "t01c", start_training: "t01d" };
      if (onboarding.goal) quizAnswers.t01 = goalMap[onboarding.goal] || "t01c";
      
      // Days
      const daysMap: Record<number, string> = { 2: "t09a", 3: "t09b", 4: "t09c", 5: "t09d" };
      if (onboarding.days_per_week) quizAnswers.t09 = daysMap[onboarding.days_per_week] || "t09b";
      
      // Location
      const locMap: Record<string, string> = { gym: "t11a", home: "t11b", hybrid: "t11c" };
      if (onboarding.workout_location) quizAnswers.t11 = locMap[onboarding.workout_location] || "t11a";
      
      // Focus areas
      const focusRevMap: Record<string, string> = { abs: "t13a", legs_glutes: "t13b", arms: "t13c", back: "t13d", full_body: "t13e" };
      if (onboarding.focus_areas?.length) quizAnswers.t13 = onboarding.focus_areas.map((a: string) => focusRevMap[a]).filter(Boolean);
      
      // Pain areas
      const painRevMap: Record<string, string> = { back: "t14b", knees: "t14c", shoulders: "t14d", elbows: "t14e" };
      if (onboarding.pain_areas?.length) {
        quizAnswers.t14 = onboarding.pain_areas[0] === "none" ? ["t14a"] : onboarding.pain_areas.map((a: string) => painRevMap[a]).filter(Boolean);
      }
      
      // Biometrics
      if (onboarding.height_cm) quizAnswers.t21 = String(onboarding.height_cm);
      if (onboarding.current_weight_kg) quizAnswers.t22 = String(onboarding.current_weight_kg);
      if (onboarding.goal_weight_kg) quizAnswers.t23 = String(onboarding.goal_weight_kg);
      if (onboarding.age) quizAnswers.t24 = String(onboarding.age);

      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: {
          quiz_answers: quizAnswers,
          user_id: userId,
          scores: profile?.profile_scores || {},
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPlanGenerated();
      // Record generation in DB + localStorage via hook
      if (data?.program_id) {
        await limits.recordGeneration("plan", data.program_id);
      }
      setDone(true);
      toast.success("Treino gerado com sucesso! 🎉");
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      console.error("Generate workout error:", err);
      if (err.message?.includes("429")) {
        toast.error("Muitas requisições. Tente novamente em alguns segundos.");
      } else if (err.message?.includes("402")) {
        toast.error("Créditos insuficientes. Contate o suporte.");
      } else {
        toast.error("Erro ao gerar treino. Tente novamente.");
      }
      setGenerating(false);
    }
  };

  // Loading state
  if (hasOnboardingData === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottomColor: S.orange, borderWidth: 2, borderColor: S.cardBorder }} />
      </div>
    );
  }


  if (generating || done) {
    const CurrentIcon = workoutIcons[iconIndex];
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-20 h-20 flex items-center justify-center mb-6 relative overflow-hidden"
          style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}20, ${S.amber}20)` }}
        >
          {done ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            >
              <Check size={40} style={{ color: S.orange }} />
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={iconIndex}
                initial={{ y: 40, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -40, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <CurrentIcon size={36} style={{ color: S.orange }} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <p className="font-display text-base mb-2" style={{ fontWeight: 700, color: S.text }}>
          {done ? "Treino pronto!" : "Gerando seu treino..."}
        </p>
        <p className="text-sm" style={{ color: S.textMuted, maxWidth: 260 }}>
          {done ? "Seu plano personalizado foi criado com sucesso" : "A IA está montando um plano baseado no seu perfil"}
        </p>
        {!done && (
          <motion.div className="mt-4 flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                className="w-2 h-2 rounded-full" style={{ backgroundColor: S.orange }} />
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // No onboarding data — show prompt to fill onboarding first
  if (!hasOnboardingData) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 flex items-center justify-center mb-4"
            style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}15, ${S.amber}15)` }}>
            <Sparkles size={32} style={{ color: S.orange }} />
          </div>
          <p className="font-display text-base mb-2" style={{ fontWeight: 700, color: S.text }}>
            Precisamos te conhecer primeiro!
          </p>
          <p className="text-sm mb-6" style={{ color: S.textMuted, maxWidth: 260 }}>
            Responda algumas perguntas rápidas para a IA criar um treino personalizado pra você
          </p>
          <Button onClick={() => setShowOnboarding(true)} className="rounded-xl"
            style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
            Preencher meu perfil
          </Button>
          <button onClick={onCancel} className="text-xs mt-4" style={{ color: S.textMuted }}>Cancelar</button>
        </div>
        <OnboardingDrawer open={showOnboarding} onClose={() => { setShowOnboarding(false); checkOnboarding(); }} userId={userId} />
      </>
    );
  }

  // Has onboarding data — 1-click generate (with cooldown check)
  const allowed = canGeneratePlan();
  const daysLeft = daysUntilNextPlan();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 flex items-center justify-center mb-4"
        style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}15, ${S.amber}15)` }}>
        {allowed ? <Sparkles size={32} style={{ color: S.orange }} /> : <Lock size={32} style={{ color: S.textMuted }} />}
      </div>
      <p className="font-display text-base mb-2" style={{ fontWeight: 700, color: S.text }}>
        {allowed ? "Gerar treino com IA" : "Plano em cooldown"}
      </p>
      <p className="text-sm mb-6" style={{ color: S.textMuted, maxWidth: 260 }}>
        {allowed
          ? "Baseado no seu perfil de treino, a IA vai montar um plano personalizado"
          : `Próximo plano disponível em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}. Você pode gerar 1 plano por semana.`}
      </p>
      {allowed ? (
        <Button onClick={generateWorkout} className="rounded-xl"
          style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
          <Sparkles size={16} className="mr-1" /> Gerar meu treino agora
        </Button>
      ) : (
        <Button disabled className="rounded-xl opacity-50 cursor-not-allowed">
          <Lock size={16} className="mr-1" /> Aguarde {daysLeft} dia{daysLeft > 1 ? "s" : ""}
        </Button>
      )}
      <button onClick={onCancel} className="text-xs mt-4" style={{ color: S.textMuted }}>Cancelar</button>
    </div>
  );
};

export default AIWorkoutWizard;
