import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSolar } from "@/components/SolarLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Check, Dumbbell, Flame, Heart, Zap, Target, Timer, Trophy } from "lucide-react";
import { useGenerationLimits, type GenerationType } from "@/hooks/useGenerationLimits";

interface AIGenerationWizardProps {
  userId: string;
  type: "challenge" | "project";
  onComplete: (programId?: string) => void;
  onCancel: () => void;
  isAdmin?: boolean;
}

const TYPE_CONFIG = {
  challenge: {
    title: "Gerar Desafio com IA",
    generating: "Gerando seu desafio...",
    done: "Desafio pronto!",
    doneDesc: "Seu desafio personalizado foi criado com sucesso",
    generatingDesc: "A IA está montando um desafio intenso baseado no seu perfil",
    emoji: "🔥",
  },
  project: {
    title: "Gerar Projeto com IA",
    generating: "Gerando seu projeto...",
    done: "Projeto pronto!",
    doneDesc: "Seu projeto de transformação foi criado com sucesso",
    generatingDesc: "A IA está montando um projeto completo baseado no seu perfil",
    emoji: "🏆",
  },
};

const AIGenerationWizard = ({ userId, type, onComplete, onCancel, isAdmin = false }: AIGenerationWizardProps) => {
  const S = useSolar();
  const limits = useGenerationLimits(userId, isAdmin);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const config = TYPE_CONFIG[type];
  const workoutIcons = [Dumbbell, Flame, Heart, Zap, Target, Timer, Trophy, Sparkles];
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    if (generating && !done) {
      const interval = setInterval(() => setIconIndex(prev => (prev + 1) % workoutIcons.length), 800);
      return () => clearInterval(interval);
    }
  }, [generating, done]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_answers, profile_scores")
        .eq("id", userId)
        .single();

      const onboarding = profile?.onboarding_answers as Record<string, any> || {};

      const { data, error } = await supabase.functions.invoke("generate-challenge", {
        body: {
          user_id: userId,
          generation_type: type,
          onboarding,
          scores: profile?.profile_scores || {},
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.program_id) {
        await limits.recordGeneration(type, data.program_id);
      }
      setDone(true);
      toast.success(`${config.done} 🎉`);
      setTimeout(() => onComplete(data?.program_id), 1500);
    } catch (err: any) {
      console.error(`Generate ${type} error:`, err);
      if (err.message?.includes("429")) {
        toast.error("Muitas requisições. Tente novamente em alguns segundos.");
      } else if (err.message?.includes("402")) {
        toast.error("Créditos insuficientes. Contate o suporte.");
      } else {
        toast.error("Erro ao gerar. Tente novamente.");
      }
      setGenerating(false);
    }
  };

  if (generating || done) {
    const CurrentIcon = workoutIcons[iconIndex];
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-20 h-20 flex items-center justify-center mb-6 relative overflow-hidden"
          style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}20, ${S.amber}20)` }}
        >
          {done ? (
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
              <Check size={40} style={{ color: S.orange }} />
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={iconIndex} initial={{ y: 40, opacity: 0, scale: 0.5 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -40, opacity: 0, scale: 0.5 }} transition={{ duration: 0.35, ease: "easeOut" }}>
                <CurrentIcon size={36} style={{ color: S.orange }} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        <p className="font-display text-base mb-2" style={{ fontWeight: 700, color: S.text }}>
          {done ? config.done : config.generating}
        </p>
        <p className="text-sm" style={{ color: S.textMuted, maxWidth: 260 }}>
          {done ? config.doneDesc : config.generatingDesc}
        </p>
        {!done && (
          <motion.div className="mt-4 flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} className="w-2 h-2 rounded-full" style={{ backgroundColor: S.orange }} />
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 flex items-center justify-center mb-4 text-3xl" style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}15, ${S.amber}15)` }}>
        {config.emoji}
      </div>
      <p className="font-display text-base mb-2" style={{ fontWeight: 700, color: S.text }}>
        {config.title}
      </p>
      <p className="text-sm mb-6" style={{ color: S.textMuted, maxWidth: 280 }}>
        {type === "challenge"
          ? "A IA vai criar um desafio intenso de curta duração baseado no seu perfil e nível atual"
          : "A IA vai criar um projeto de transformação completo com progressão planejada"}
      </p>
      <Button onClick={generate} className="rounded-xl" style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
        <Sparkles size={16} className="mr-1" /> Gerar agora
      </Button>
      <button onClick={onCancel} className="text-xs mt-4" style={{ color: S.textMuted }}>Cancelar</button>
    </div>
  );
};

export default AIGenerationWizard;
