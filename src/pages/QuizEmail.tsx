import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Mail, Shield } from "lucide-react";

const QuizEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const answers = (location.state as any)?.answers || {};

  const [step, setStep] = useState<"email" | "name" | "optin">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = name.trim().length > 1;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;
    setStep("name");
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) return;
    setStep("optin");
  };

  const handleFinish = async (optedIn: boolean) => {
    setLoading(true);
    setError("");
    try {
      // Calculate profile scores from answers
      const { calculateAxisScores } = await import("@/lib/quizData");
      const scores = calculateAxisScores(answers || {});

      // Save lead to database
      await supabase.from("leads").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        opted_in: optedIn,
        quiz_answers: answers || {},
        profile_scores: scores || {},
      });

      // Track funnel step
      const sessionId = sessionStorage.getItem("funnel_session") || crypto.randomUUID();
      sessionStorage.setItem("funnel_session", sessionId);
      await supabase.from("funnel_visits").insert({ step: "lead_captured", session_id: sessionId });

      navigate("/quiz/analise-corporal", {
        state: { name, email, answers, optedIn },
      });
    } catch {
      setError("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "name") setStep("email");
    else if (step === "optin") setStep("name");
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-muted-foreground font-medium">Quase lá!</span>
          </div>
          <Progress value={step === "email" ? 90 : step === "name" ? 95 : 98} className="h-2 bg-secondary" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto w-full animate-fade-in-up">
          {step === "email" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-soft rounded-full mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Coloca seu email pra receber seu plano personalizado
                </h2>
                <p className="text-muted-foreground text-sm">
                  A gente respeita sua privacidade. Vamos te mandar seu diagnóstico completo por email também.
                </p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Seu melhor email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-card text-base"
                  maxLength={255}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isEmailValid}
                  className="w-full rounded-full py-6 text-base font-semibold"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  87.342+ mulheres já usam
                </div>
              </form>
            </>
          )}

          {step === "name" && (
            <>
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Qual é seu nome?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Pra gente personalizar seu plano 💛
                </p>
              </div>
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <Input
                  placeholder="Seu primeiro nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl bg-card text-base"
                  maxLength={100}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isNameValid}
                  className="w-full rounded-full py-6 text-base font-semibold"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </form>
            </>
          )}

          {step === "optin" && (
            <>
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Quer receber dicas de treino e novidades?
                </h2>
              </div>
              <div className="space-y-3">
                <Button
                  size="lg"
                  onClick={() => handleFinish(true)}
                  disabled={loading}
                  className="w-full rounded-full py-6 text-base font-semibold"
                >
                  Sim, quero receber! 🎉
                </Button>
                <button
                  onClick={() => handleFinish(false)}
                  disabled={loading}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
                >
                  Não quero receber dicas
                </button>
              </div>
              {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizEmail;
