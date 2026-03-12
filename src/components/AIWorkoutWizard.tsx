import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSolar } from "@/components/SolarLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Target, CalendarDays, MapPin, Loader2, Check } from "lucide-react";

interface AIWorkoutWizardProps {
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS = [
  {
    id: "goal",
    quizKey: "t01",
    title: "Qual seu objetivo?",
    icon: Target,
    options: [
      { id: "t01a", label: "Emagrecer", emoji: "🔥" },
      { id: "t01b", label: "Definir / botar shape", emoji: "💪" },
      { id: "t01c", label: "Emagrecer e definir", emoji: "⚡" },
      { id: "t01d", label: "Começar a treinar", emoji: "🌱" },
    ],
  },
  {
    id: "days",
    quizKey: "t09",
    title: "Quantos dias por semana?",
    icon: CalendarDays,
    options: [
      { id: "t09a", label: "2 dias", emoji: "2️⃣" },
      { id: "t09b", label: "3 dias", emoji: "3️⃣" },
      { id: "t09c", label: "4 dias", emoji: "4️⃣" },
      { id: "t09d", label: "5 dias", emoji: "5️⃣" },
    ],
  },
  {
    id: "location",
    quizKey: "t11",
    title: "Onde vai treinar?",
    icon: MapPin,
    options: [
      { id: "t11a", label: "Academia", emoji: "🏋️‍♀️" },
      { id: "t11b", label: "Em casa", emoji: "🏠" },
      { id: "t11c", label: "Os dois", emoji: "🔄" },
    ],
  },
];

const AIWorkoutWizard = ({ userId, onComplete, onCancel }: AIWorkoutWizardProps) => {
  const S = useSolar();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const currentStep = STEPS[step];

  const selectOption = async (optionId: string) => {
    const newAnswers = { ...answers, [currentStep.quizKey]: optionId };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // All answered — generate!
      await generateWorkout(newAnswers);
    }
  };

  const generateWorkout = async (wizardAnswers: Record<string, string>) => {
    setGenerating(true);
    try {
      // Fetch lead quiz answers from profile if available
      let fullAnswers: Record<string, any> = { ...wizardAnswers };

      const { data: profile } = await supabase
        .from("profiles")
        .select("lead_id, profile_scores")
        .eq("id", userId)
        .single();

      if (profile?.lead_id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("quiz_answers")
          .eq("id", profile.lead_id)
          .single();

        if (lead?.quiz_answers && typeof lead.quiz_answers === "object") {
          // Merge: lead answers as base, wizard answers override
          fullAnswers = { ...(lead.quiz_answers as Record<string, any>), ...wizardAnswers };
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: {
          quiz_answers: fullAnswers,
          user_id: userId,
          scores: profile?.profile_scores || {},
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDone(true);
      toast.success("Treino gerado com sucesso! 🎉");
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      console.error("Generate workout error:", err);
      if (err.message?.includes("429") || err.message?.includes("Rate limit")) {
        toast.error("Muitas requisições. Tente novamente em alguns segundos.");
      } else if (err.message?.includes("402")) {
        toast.error("Créditos insuficientes. Contate o suporte.");
      } else {
        toast.error("Erro ao gerar treino. Tente novamente.");
      }
      setGenerating(false);
    }
  };

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.25rem",
    boxShadow: `0 2px 12px rgba(234,88,12,0.04)`,
  };

  // Generating state
  if (generating || done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <motion.div
          animate={done ? { scale: [1, 1.2, 1] } : { rotate: 360 }}
          transition={done ? { duration: 0.5 } : { duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 flex items-center justify-center mb-6"
          style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}20, ${S.amber}20)` }}
        >
          {done ? (
            <Check size={40} style={{ color: S.orange }} />
          ) : (
            <Sparkles size={40} style={{ color: S.orange }} />
          )}
        </motion.div>
        <p className="font-display text-base mb-2" style={{ fontWeight: 700, color: S.text }}>
          {done ? "Treino pronto!" : "Gerando seu treino..."}
        </p>
        <p className="text-sm" style={{ color: S.textMuted, maxWidth: 260 }}>
          {done
            ? "Seu plano personalizado foi criado com sucesso"
            : "A IA está montando um plano personalizado baseado no seu perfil"}
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

  return (
    <div className="py-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className="h-1.5 rounded-full transition-all"
            style={{
              width: i === step ? 24 : 8,
              backgroundColor: i <= step ? S.orange : `${S.cardBorder}`,
            }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step icon + title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-3"
              style={{ borderRadius: "1rem", background: `linear-gradient(135deg, ${S.orange}15, ${S.amber}15)` }}>
              <currentStep.icon size={24} style={{ color: S.orange }} />
            </div>
            <h3 className="font-display text-lg" style={{ fontWeight: 700, color: S.text }}>
              {currentStep.title}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentStep.options.map((opt, i) => (
              <motion.button key={opt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => selectOption(opt.id)}
                className="w-full text-left p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
                style={cardStyle}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="font-display text-sm" style={{ fontWeight: 600, color: S.text }}>
                  {opt.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Cancel */}
      <div className="mt-6 text-center">
        <button onClick={onCancel} className="text-xs" style={{ color: S.textMuted }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default AIWorkoutWizard;
