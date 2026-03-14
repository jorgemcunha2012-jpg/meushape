import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Sparkles, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { quizScreens, type QuizScreen } from "@/lib/quizData";
import { cn } from "@/lib/utils";
import logoMeushape from "@/assets/logo-meushape.png";
import ScrollPicker from "@/components/ScrollPicker";

const Quiz = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [numericValue, setNumericValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const [showNameStep, setShowNameStep] = useState(false);
  const [leadName, setLeadName] = useState("");

  // Track quiz start
  useEffect(() => {
    const sessionId = sessionStorage.getItem("funnel_session") || crypto.randomUUID();
    sessionStorage.setItem("funnel_session", sessionId);
    supabase.from("funnel_visits").insert({ step: "quiz_start", session_id: sessionId }).then();
  }, []);

  const screen = quizScreens[currentStep];
  const totalSteps = quizScreens.length;
  // MD spec: 15 etapas (14 perguntas + nome). Exclude intermediate screens from progress count.
  const questionSteps = quizScreens.filter(s => s.type !== "intermediate").length; // 14
  const totalProgressSteps = questionSteps + 1; // +1 for name = 15
  const currentQuestionIndex = quizScreens.slice(0, currentStep + 1).filter(s => s.type !== "intermediate").length;
  const progress = showNameStep ? 100 : (currentQuestionIndex / totalProgressSteps) * 100;

  const goNext = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep((s) => s + 1);
        setNumericValue("");
      } else {
        setShowNameStep(true);
      }
      setAnimating(false);
    }, 300);
  }, [currentStep, totalSteps, animating]);

  const handleSingleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [screen.id]: optionId }));
    setTimeout(goNext, 400);
  };

  const handleMultiToggle = (optionId: string) => {
    setAnswers((prev) => {
      const current = (prev[screen.id] as string[]) || [];
      const option = screen.options?.find((o) => o.id === optionId);
      if (option && (optionId.endsWith("a") || optionId.endsWith("f")) && screen.id === "t14") {
        return { ...prev, [screen.id]: current.includes(optionId) ? [] : [optionId] };
      }
      if (option && optionId === "t16f") {
        return { ...prev, [screen.id]: current.includes(optionId) ? [] : [optionId] };
      }
      const filtered = current.filter((id) => {
        if (screen.id === "t14" && id === "t14a") return false;
        if (screen.id === "t16" && id === "t16f") return false;
        return true;
      });
      if (filtered.includes(optionId)) {
        return { ...prev, [screen.id]: filtered.filter((id) => id !== optionId) };
      }
      return { ...prev, [screen.id]: [...filtered, optionId] };
    });
  };

  const handleNumericChange = (val: number) => {
    setNumericValue(String(val));
    setAnswers((prev) => ({ ...prev, [screen.id]: String(val) }));
  };

  const handleNumericSubmit = () => {
    const val = parseFloat(numericValue);
    if (isNaN(val)) return;
    if (screen.inputMin && val < screen.inputMin) return;
    if (screen.inputMax && val > screen.inputMax) return;
    goNext();
  };

  const handleBack = () => {
    if (showNameStep) {
      setShowNameStep(false);
    } else if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setNumericValue("");
    } else {
      navigate("/");
    }
  };

  const handleNameSubmit = () => {
    if (leadName.trim().length < 2) return;
    navigate("/quiz/loading", { state: { answers, name: leadName.trim() } });
  };

  const canContinueMulti = () => {
    const selected = (answers[screen.id] as string[]) || [];
    return selected.length > 0;
  };

  const canContinueNumeric = () => {
    const val = parseFloat(numericValue);
    if (isNaN(val)) return false;
    if (screen.inputMin && val < screen.inputMin) return false;
    if (screen.inputMax && val > screen.inputMax) return false;
    return true;
  };

  // Determine if this screen can fit without scrolling (few options)
  const canFitSingleScreen =
    screen.type === "single-select" && (screen.options?.length ?? 0) <= 5 ||
    screen.type === "numeric-input" ||
    screen.type === "intermediate";

  return (
    <div className={cn(
      "bg-background flex flex-col",
      canFitSingleScreen ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"
    )}>
      {/* Header: logo + back + progress */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img src={logoMeushape} alt="MeuShape" className="h-8 w-auto" />
          </div>
          {/* Back + progress */}
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Progress value={progress} className="h-2 bg-secondary flex-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "flex items-center justify-center px-4",
        canFitSingleScreen || showNameStep ? "flex-1 min-h-0 py-2" : "flex-1 py-8"
      )}>
        {showNameStep ? (
          <div className="max-w-lg mx-auto w-full text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-rose-soft rounded-full mb-6"
            >
              <Heart className="w-9 h-9 text-primary" fill="hsl(var(--primary))" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              Qual seu primeiro nome?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-muted-foreground text-sm mb-6"
            >
              Pra gente personalizar seu diagnóstico 😊
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              <Input
                placeholder="Ex: Maria"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                className="h-14 rounded-2xl bg-card text-lg text-center mb-6 border-2 border-primary/20 focus:border-primary transition-colors"
                maxLength={100}
                autoFocus
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <Button
                size="lg"
                disabled={leadName.trim().length < 2}
                onClick={handleNameSubmit}
                className="rounded-full px-10 py-6 text-base font-semibold"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </div>
        ) : (
          <div
            className={cn(
              "max-w-lg mx-auto w-full transition-all duration-300",
              animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}
            key={screen.id}
          >
            {screen.type === "intermediate" && (
              <IntermediateScreen screen={screen} onContinue={goNext} />
            )}

            {screen.type === "single-select" && (
              <SingleSelectScreen
                screen={screen}
                selected={answers[screen.id] as string}
                onSelect={handleSingleSelect}
                compact={canFitSingleScreen}
              />
            )}

            {screen.type === "multi-select" && (
              <MultiSelectScreen
                screen={screen}
                selected={(answers[screen.id] as string[]) || []}
                onToggle={handleMultiToggle}
                onContinue={goNext}
                canContinue={canContinueMulti()}
              />
            )}

            {screen.type === "numeric-input" && (
              <NumericInputScreen
                screen={screen}
                value={numericValue}
                onNumericChange={handleNumericChange}
                onSubmit={handleNumericSubmit}
                canSubmit={canContinueNumeric()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-components ---

function IntermediateScreen({ screen, onContinue }: { screen: QuizScreen; onContinue: () => void }) {
  return (
    <div className="text-center animate-fade-in-up">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-soft rounded-full mb-6">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
        {screen.headline}
      </h2>
      {screen.body && (
        <p className="text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">
          {screen.body}
        </p>
      )}
      <Button
        size="lg"
        onClick={onContinue}
        className="rounded-full px-10 py-6 text-base font-semibold"
      >
        {screen.buttonText || "Continuar"}
        <ArrowRight className="w-5 h-5 ml-1" />
      </Button>
    </div>
  );
}

function SingleSelectScreen({
  screen,
  selected,
  onSelect,
  compact = false,
}: {
  screen: QuizScreen;
  selected: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="animate-fade-in">
      <h2 className={cn(
        "font-display font-bold text-foreground text-center",
        compact ? "text-xl md:text-2xl mb-1" : "text-2xl md:text-3xl mb-2"
      )}>
        {screen.question}
      </h2>
      {screen.subtitle && (
        <p className={cn("text-muted-foreground text-center", compact ? "mb-4 text-sm" : "mb-8")}>{screen.subtitle}</p>
      )}
      {!screen.subtitle && <div className={compact ? "mb-4" : "mb-8"} />}

      <div className={compact ? "space-y-2" : "space-y-3"}>
        {screen.options?.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "w-full text-left rounded-xl border-2 transition-all font-medium",
              compact ? "px-4 py-3 text-sm" : "px-5 py-4",
              selected === option.id
                ? "border-primary bg-rose-soft text-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectScreen({
  screen,
  selected,
  onToggle,
  onContinue,
  canContinue,
}: {
  screen: QuizScreen;
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
        {screen.question}
      </h2>
      <p className="text-muted-foreground text-center mb-8 text-sm">Selecione todas que se aplicam</p>

      <div className="space-y-3">
        {screen.options?.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => onToggle(option.id)}
              className={cn(
                "w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium flex items-center justify-between",
                isSelected
                  ? "border-primary bg-rose-soft text-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
              )}
            >
              <span>{option.label}</span>
              {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={onContinue}
          className="rounded-full px-10 py-6 text-base font-semibold"
        >
          Continuar
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function NumericInputScreen({
  screen,
  value,
  onNumericChange,
  onSubmit,
  canSubmit,
}: {
  screen: QuizScreen;
  value: string;
  onNumericChange: (val: number) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}) {
  const defaultValue = screen.inputDefault ?? (
    screen.inputMin && screen.inputMax
      ? Math.round((screen.inputMin + screen.inputMax) / 2)
      : screen.inputMin ?? 0
  );
  const currentValue = value ? parseInt(value) : defaultValue;

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1 text-center">
        {screen.question}
      </h2>
      {screen.microcopy && (
        <p className="text-muted-foreground text-center mb-4 text-sm">{screen.microcopy}</p>
      )}
      {!screen.microcopy && <div className="mb-4" />}

      <ScrollPicker
        min={screen.inputMin ?? 0}
        max={screen.inputMax ?? 100}
        value={currentValue}
        onChange={onNumericChange}
        unit={screen.inputUnit}
      />

      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="rounded-full px-10 py-6 text-base font-semibold"
        >
          Continuar
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default Quiz;
