import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Camera, Upload, Loader2, SkipForward, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const loadingMessages = [
  "Analisando sua foto...",
  "Identificando biotipo...",
  "Avaliando composição corporal...",
  "Preparando seu diagnóstico...",
];

const QuizBodyAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, email, answers, optedIn } = (location.state as any) || {};
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [alreadyAnalyzed, setAlreadyAnalyzed] = useState(false);

  // Check localStorage for previous analysis
  useEffect(() => {
    if (email) {
      const cached = localStorage.getItem(`body_analysis_${email}`);
      if (cached) {
        setAlreadyAnalyzed(true);
      }
    }
  }, [email]);

  // Rotate loading messages
  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!preview || !email || analyzing || alreadyAnalyzed) return;

    setAnalyzing(true);
    setLoadingMsgIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-body", {
        body: { email, image_base64: preview },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const analysis = data.analysis;

      // Cache in localStorage to prevent re-submission
      localStorage.setItem(`body_analysis_${email}`, JSON.stringify(analysis));

      navigate("/quiz/resultado", {
        state: { name, email, answers, optedIn, bodyAnalysis: analysis },
      });
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Erro na análise. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSkip = () => {
    navigate("/quiz/resultado", {
      state: { name, email, answers, optedIn },
    });
  };

  const handleBack = () => navigate(-1);

  // If already analyzed, go straight to results with cached data
  if (alreadyAnalyzed && email) {
    const cached = localStorage.getItem(`body_analysis_${email}`);
    if (cached) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
          <div className="max-w-lg mx-auto text-center animate-fade-in-up">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Análise já realizada!
            </h2>
            <p className="text-muted-foreground mb-6">
              Sua análise corporal já foi feita. Vamos ver seu resultado completo.
            </p>
            <Button
              size="lg"
              onClick={() =>
                navigate("/quiz/resultado", {
                  state: { name, email, answers, optedIn, bodyAnalysis: JSON.parse(cached) },
                })
              }
              className="rounded-full py-6 px-8 text-base font-semibold"
            >
              Ver meu resultado
            </Button>
          </div>
        </div>
      );
    }
  }

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
            <span className="text-sm text-muted-foreground font-medium">Análise Corporal</span>
          </div>
          <Progress value={96} className="h-2 bg-secondary" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-lg mx-auto w-full animate-fade-in-up">
          {analyzing ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                {loadingMessages[loadingMsgIndex]}
              </h2>
              <p className="text-muted-foreground text-sm">
                Isso pode levar até 15 segundos...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-soft rounded-full mb-4">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Quer uma análise corporal por IA?
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Envie uma foto de corpo inteiro (de frente ou de lado) e nossa IA vai estimar seu biotipo,
                  composição corporal e dar dicas personalizadas.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  📸 Sua foto é usada apenas para a análise e não será compartilhada.
                </p>
              </div>

              {/* Upload area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {preview ? (
                <div className="mb-6">
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-card aspect-[3/4] max-h-[400px] mx-auto flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Preview da foto"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground mt-2 block mx-auto"
                  >
                    Trocar foto
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors mb-6 bg-card"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Toque para enviar uma foto
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG ou PNG, máximo 5MB
                  </span>
                </button>
              )}

              <div className="space-y-3">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!preview || analyzing}
                  className="w-full rounded-full py-6 text-base font-semibold"
                >
                  <Camera className="w-5 h-5 mr-1" />
                  Analisar meu corpo
                </Button>
                <button
                  onClick={handleSkip}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
                >
                  <SkipForward className="w-4 h-4 inline mr-1" />
                  Pular esta etapa
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizBodyAnalysis;
