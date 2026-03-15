import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SolarBottomNav, useSolar } from "@/components/SolarLayout";

const loadingMessages = [
  "Analisando sua foto...",
  "Identificando biotipo...",
  "Avaliando composição corporal...",
  "Preparando seu diagnóstico...",
];

const AppBodyAnalysis = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const S = useSolar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/app/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!analyzing) return;
    const interval = setInterval(() => setLoadingMsgIndex((i) => (i + 1) % loadingMessages.length), 3000);
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
    if (!preview || analyzing || !user) return;
    setAnalyzing(true);
    setLoadingMsgIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-body", {
        body: { email: user.email, image_base64: preview },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.analysis);
      toast.success("Análise concluída! 🎉");
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Erro na análise. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: S.bg }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => navigate("/app")} className="p-1" style={{ color: S.textMuted }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold" style={{ color: S.text }}>Análise Corporal IA</h1>
      </div>

      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full">
          {analyzing ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6" style={{ color: S.orange }} />
              <h2 className="font-display text-xl font-bold mb-2" style={{ color: S.text }}>
                {loadingMessages[loadingMsgIndex]}
              </h2>
              <p className="text-sm" style={{ color: S.textMuted }}>Isso pode levar até 15 segundos...</p>
            </div>
          ) : result ? (
            <div className="py-6 space-y-4">
              <div className="rounded-2xl p-5" style={{ background: `${S.orange}10`, border: `1px solid ${S.orange}20` }}>
                <h3 className="font-display text-base font-bold mb-3" style={{ color: S.text }}>Seu Diagnóstico</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: S.textMuted }}>Biotipo</span>
                    <span className="capitalize" style={{ color: S.text }}>{result.body_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: S.textMuted }}>% Gordura Estimada</span>
                    <span style={{ color: S.text }}>{result.estimated_bf_range}</span>
                  </div>
                  {result.recommendation && (
                    <p className="pt-3 mt-2 text-sm" style={{ color: S.textMuted, borderTop: `1px solid ${S.orange}15` }}>
                      ✨ {result.recommendation}
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={resetAnalysis} className="w-full rounded-xl" style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})` }}>
                Nova Análise
              </Button>
            </div>
          ) : (
            <div className="py-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: `${S.orange}15` }}>
                  <Camera className="w-7 h-7" style={{ color: S.orange }} />
                </div>
                <h2 className="font-display text-xl font-bold mb-2" style={{ color: S.text }}>Análise Corporal por IA</h2>
                <p className="text-sm leading-relaxed" style={{ color: S.textMuted }}>
                  Envie uma foto de corpo inteiro e nossa IA vai estimar seu biotipo, composição corporal e dar dicas personalizadas.
                </p>
                <p className="text-xs mt-2" style={{ color: S.textMuted }}>📸 Sua foto é usada apenas para a análise.</p>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

              {preview ? (
                <div className="mb-6">
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-h-[400px] mx-auto flex items-center justify-center" style={{ border: `1px solid ${S.orange}20`, background: S.card }}>
                    <img src={preview} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                  <button onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-sm mt-2 block mx-auto" style={{ color: S.textMuted }}>
                    Trocar foto
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-2xl p-8 flex flex-col items-center gap-3 mb-6" style={{ border: `2px dashed ${S.orange}30`, background: S.card }}>
                  <Upload className="w-8 h-8" style={{ color: S.textMuted }} />
                  <span className="text-sm" style={{ color: S.textMuted }}>Toque para enviar uma foto</span>
                  <span className="text-xs" style={{ color: S.textMuted }}>JPG ou PNG, máximo 5MB</span>
                </button>
              )}

              <Button onClick={handleAnalyze} disabled={!preview} className="w-full rounded-xl py-6 text-base font-semibold" style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
                <Camera className="w-5 h-5 mr-1" /> Analisar meu corpo
              </Button>
            </div>
          )}
        </div>
      </div>

      <SolarBottomNav />
    </div>
  );
};

export default AppBodyAnalysis;
