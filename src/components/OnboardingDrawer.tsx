import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSolar } from "@/components/SolarLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import { Target, CalendarDays, MapPin, Crosshair, ShieldAlert, Ruler, ChevronLeft, Check } from "lucide-react";

interface OnboardingDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  initialData?: Record<string, any>;
}

interface StepConfig {
  id: string;
  key: string;
  title: string;
  icon: any;
  type: "single" | "multi" | "biometrics";
  options?: { id: string; label: string; emoji: string }[];
}

const STEPS: StepConfig[] = [
  {
    id: "goal", key: "goal", title: "Qual seu objetivo principal?", icon: Target, type: "single",
    options: [
      { id: "lose_weight", label: "Emagrecer", emoji: "🔥" },
      { id: "tone_up", label: "Definir / botar shape", emoji: "💪" },
      { id: "lose_and_tone", label: "Emagrecer e definir", emoji: "⚡" },
      { id: "start_training", label: "Começar a treinar", emoji: "🌱" },
    ],
  },
  {
    id: "days", key: "days_per_week", title: "Quantos dias por semana?", icon: CalendarDays, type: "single",
    options: [
      { id: "2", label: "2 dias", emoji: "2️⃣" },
      { id: "3", label: "3 dias", emoji: "3️⃣" },
      { id: "4", label: "4 dias", emoji: "4️⃣" },
      { id: "5", label: "5 dias", emoji: "5️⃣" },
    ],
  },
  {
    id: "location", key: "workout_location", title: "Onde vai treinar?", icon: MapPin, type: "single",
    options: [
      { id: "gym", label: "Academia", emoji: "🏋️‍♀️" },
      { id: "home", label: "Em casa", emoji: "🏠" },
      { id: "hybrid", label: "Os dois", emoji: "🔄" },
    ],
  },
  {
    id: "focus", key: "focus_areas", title: "Áreas de foco (pode marcar várias)", icon: Crosshair, type: "multi",
    options: [
      { id: "abs", label: "Abdome", emoji: "🎯" },
      { id: "legs_glutes", label: "Pernas e Glúteos", emoji: "🍑" },
      { id: "arms", label: "Braços", emoji: "💪" },
      { id: "back", label: "Costas", emoji: "🔙" },
      { id: "full_body", label: "Corpo inteiro", emoji: "✨" },
    ],
  },
  {
    id: "pain", key: "pain_areas", title: "Alguma dor ou restrição?", icon: ShieldAlert, type: "multi",
    options: [
      { id: "none", label: "Nenhuma", emoji: "✅" },
      { id: "back", label: "Costas", emoji: "🔙" },
      { id: "knees", label: "Joelhos", emoji: "🦵" },
      { id: "shoulders", label: "Ombros", emoji: "💆‍♀️" },
      { id: "elbows", label: "Cotovelos", emoji: "💪" },
    ],
  },
  {
    id: "biometrics", key: "biometrics", title: "Seus dados", icon: Ruler, type: "biometrics",
  },
];

const OnboardingDrawer = ({ open, onClose, userId, initialData }: OnboardingDrawerProps) => {
  const S = useSolar();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialData || {});
  const [saving, setSaving] = useState(false);

  // Biometrics local state
  const [height, setHeight] = useState(String(initialData?.height_cm || "165"));
  const [weight, setWeight] = useState(String(initialData?.current_weight_kg || "70"));
  const [goalWeight, setGoalWeight] = useState(String(initialData?.goal_weight_kg || "60"));
  const [age, setAge] = useState(String(initialData?.age || "28"));

  const current = STEPS[step];

  const selectSingle = (value: string) => {
    const key = current.key;
    const parsed = key === "days_per_week" ? parseInt(value) : value;
    setAnswers(prev => ({ ...prev, [key]: parsed }));
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const toggleMulti = (value: string) => {
    const key = current.key;
    const prev = (answers[key] as string[]) || [];
    if (value === "none") {
      setAnswers(a => ({ ...a, [key]: ["none"] }));
      return;
    }
    const filtered = prev.filter(v => v !== "none");
    const updated = filtered.includes(value) ? filtered.filter(v => v !== value) : [...filtered, value];
    setAnswers(a => ({ ...a, [key]: updated }));
  };

  const confirmMulti = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const saveAll = async () => {
    setSaving(true);
    const finalAnswers = {
      ...answers,
      height_cm: parseInt(height) || 165,
      current_weight_kg: parseInt(weight) || 70,
      goal_weight_kg: parseInt(goalWeight) || 60,
      age: parseInt(age) || 28,
    };
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_answers: finalAnswers })
      .eq("id", userId);
    if (error) {
      toast.error("Erro ao salvar dados");
    } else {
      toast.success("Dados salvos com sucesso! 🎉");
      onClose();
    }
    setSaving(false);
  };

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.25rem",
    boxShadow: `0 2px 12px rgba(234,88,12,0.04)`,
  };

  const inputStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1rem",
    color: S.text,
    padding: "12px 16px",
    fontSize: "16px",
    fontWeight: 600,
    width: "100%",
    outline: "none",
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[92vh]" style={{ backgroundColor: S.bg, borderColor: S.cardBorder }}>
        <DrawerHeader className="pb-0">
          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="p-1">
                <ChevronLeft size={20} style={{ color: S.textMuted }} />
              </button>
            ) : <div className="w-6" />}
            <DrawerTitle className="font-display text-base" style={{ fontWeight: 800, color: S.text }}>
              Seu Perfil de Treino
            </DrawerTitle>
            <div className="w-6" />
          </div>
        </DrawerHeader>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 px-5 py-3">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all"
              style={{ width: i === step ? 24 : 8, backgroundColor: i <= step ? S.orange : S.cardBorder }} />
          ))}
        </div>

        <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "65vh" }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.2 }}
            >
              {/* Icon + Title */}
              <div className="text-center mb-5">
                <div className="w-14 h-14 flex items-center justify-center mx-auto mb-3"
                  style={{ borderRadius: "1rem", background: `linear-gradient(135deg, ${S.orange}15, ${S.amber}15)` }}>
                  <current.icon size={24} style={{ color: S.orange }} />
                </div>
                <h3 className="font-display text-lg" style={{ fontWeight: 700, color: S.text }}>
                  {current.title}
                </h3>
              </div>

              {/* Single select */}
              {current.type === "single" && (
                <div className="space-y-2.5">
                  {current.options!.map((opt, i) => {
                    const isSelected = answers[current.key] === (current.key === "days_per_week" ? parseInt(opt.id) : opt.id);
                    return (
                      <motion.button key={opt.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => selectSingle(opt.id)}
                        className="w-full text-left p-4 flex items-center gap-3 transition-all"
                        style={{ ...cardStyle, borderColor: isSelected ? S.orange : S.cardBorder }}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className="font-display text-sm" style={{ fontWeight: 600, color: S.text }}>{opt.label}</span>
                        {isSelected && <Check size={16} className="ml-auto" style={{ color: S.orange }} />}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Multi select */}
              {current.type === "multi" && (
                <>
                  <div className="space-y-2.5">
                    {current.options!.map((opt, i) => {
                      const selected = ((answers[current.key] as string[]) || []).includes(opt.id);
                      return (
                        <motion.button key={opt.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleMulti(opt.id)}
                          className="w-full text-left p-4 flex items-center gap-3 transition-all"
                          style={{ ...cardStyle, borderColor: selected ? S.orange : S.cardBorder }}
                        >
                          <span className="text-xl">{opt.emoji}</span>
                          <span className="font-display text-sm" style={{ fontWeight: 600, color: S.text }}>{opt.label}</span>
                          {selected && <Check size={16} className="ml-auto" style={{ color: S.orange }} />}
                        </motion.button>
                      );
                    })}
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={confirmMulti}
                    className="w-full mt-4 py-3.5 text-sm font-bold text-white"
                    style={{ borderRadius: "1.25rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
                    Continuar
                  </motion.button>
                </>
              )}

              {/* Biometrics */}
              {current.type === "biometrics" && (
                <div className="space-y-4">
                  {[
                    { label: "Altura (cm)", value: height, set: setHeight, placeholder: "165" },
                    { label: "Peso atual (kg)", value: weight, set: setWeight, placeholder: "70" },
                    { label: "Peso meta (kg)", value: goalWeight, set: setGoalWeight, placeholder: "60" },
                    { label: "Idade", value: age, set: setAge, placeholder: "28" },
                  ].map((field, i) => (
                    <div key={i}>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: S.textMuted }}>
                        {field.label}
                      </label>
                      <input
                        type="number" inputMode="numeric"
                        value={field.value} onChange={(e) => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={saveAll} disabled={saving}
                    className="w-full mt-2 py-3.5 text-sm font-bold text-white disabled:opacity-50"
                    style={{ borderRadius: "1.25rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
                    {saving ? "Salvando..." : "Salvar e começar 🚀"}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default OnboardingDrawer;
