import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, Eye, EyeOff } from "lucide-react";
import logoMeuShape from "@/assets/logo-meushape.png";

const QuizEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const answers = (location.state as any)?.answers || {};

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    import("./QuizResult");
  }, []);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = name.trim().length > 1;
  const isPasswordValid = password.length >= 6;
  const canSubmit = isEmailValid && isNameValid && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const { calculateAxisScores } = await import("@/lib/quizData");
      const scores = calculateAxisScores(answers || {});

      // Save lead
      await supabase.from("leads").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        opted_in: true,
        quiz_answers: answers || {},
        profile_scores: scores || {},
      });

      // Track funnel
      const sessionId = sessionStorage.getItem("funnel_session") || crypto.randomUUID();
      sessionStorage.setItem("funnel_session", sessionId);
      await supabase.from("funnel_visits").insert({ step: "lead_captured", session_id: sessionId });

      // Create account
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: window.location.origin + "/app",
        },
      });
      if (signUpError) throw signUpError;

      navigate("/quiz/resultado", {
        state: { name: name.trim(), answers },
      });
    } catch (err: any) {
      setError(err.message || "Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={logoMeuShape} alt="Meu Shape" className="h-6 object-contain" />
          <div className="w-7" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="max-w-sm w-full animate-fade-in">
          <div className="text-center mb-6">
            <h2
              className="text-xl font-bold text-foreground mb-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Crie sua conta pra ver seu diagnóstico
            </h2>
            <p className="text-muted-foreground text-sm">
              Seu plano personalizado está pronto 🎉
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Seu primeiro nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-card text-base"
              maxLength={100}
              autoFocus
            />
            <Input
              type="email"
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-card text-base"
              maxLength={255}
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-card text-base pr-12"
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full h-12 text-base font-bold rounded-xl"
            >
              {loading ? "Criando conta..." : "Ver Meu Diagnóstico Completo"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
              <Shield className="w-3 h-3" />
              Seus dados estão seguros conosco
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizEmail;
