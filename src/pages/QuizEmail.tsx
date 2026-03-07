import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { calculateProfile } from "@/lib/quizData";

const QuizEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const answers = (location.state as any)?.answers || {};

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError("");

    try {
      const profileId = calculateProfile(answers);

      // TODO: Save to Supabase (lead + answers)
      // For now, navigate directly to result
      navigate("/quiz/resultado", {
        state: { profileId, name, email, answers },
      });
    } catch (err) {
      setError("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-muted-foreground font-medium">Quase lá!</span>
          </div>
          <Progress value={95} className="h-2 bg-secondary" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto w-full animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-soft rounded-full mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Seu resultado está pronto!
            </h2>
            <p className="text-muted-foreground">
              Informe seus dados para ver seu perfil personalizado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl bg-card text-base"
                maxLength={100}
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-card text-base"
                maxLength={255}
              />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="submit"
              size="lg"
              disabled={!isValid || loading}
              className="w-full rounded-full py-6 text-base font-semibold"
            >
              {loading ? "Carregando..." : "Ver meu perfil"}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Seus dados estão seguros e não serão compartilhados.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuizEmail;
