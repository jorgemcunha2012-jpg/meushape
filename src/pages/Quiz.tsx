import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { quizQuestions, calculateProfile } from "@/lib/quizData";
import { cn } from "@/lib/utils";

const Quiz = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = quizQuestions[currentStep];
  const totalSteps = quizQuestions.length;
  const progress = ((currentStep + 1) / (totalSteps + 1)) * 100; // +1 for email step
  const selectedOption = answers[question.id];

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handleNext = () => {
    if (!selectedOption) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Go to email collection
      navigate("/quiz/email", { state: { answers } });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-muted-foreground font-medium">
              {currentStep + 1} de {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto w-full animate-fade-in" key={question.id}>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
            {question.question}
          </h2>
          {question.subtitle && (
            <p className="text-muted-foreground text-center mb-8">{question.subtitle}</p>
          )}
          {!question.subtitle && <div className="mb-8" />}

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium",
                  selectedOption === option.id
                    ? "border-primary bg-rose-soft text-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              disabled={!selectedOption}
              onClick={handleNext}
              className="rounded-full px-10 py-6 text-base font-semibold"
            >
              {currentStep < totalSteps - 1 ? "Próxima" : "Ver meu resultado"}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
