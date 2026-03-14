import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateAxisScores } from "@/lib/quizData";
import {
  deriveSixDimensions,
  computeOverallScore,
  computePotential,
  generateInsights,
  testimonials as allTestimonials,
  dimensionLabels,
} from "@/lib/quizResultUtils";
import { ArrowRight, Lock, Loader2, Shield, Star, User, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ScoreRing from "@/components/quiz-result/ScoreRing";
import RadarChartComponent from "@/components/quiz-result/RadarChart";
import InsightCards from "@/components/quiz-result/InsightCards";
import TestimonialCarousel from "@/components/quiz-result/TestimonialCarousel";
import UrgencyModal from "@/components/quiz-result/UrgencyModal";

type TabKey = "score" | "grafico" | "insights" | "depoimentos";

const tabs: { key: TabKey; label: string }[] = [
  { key: "score", label: "Score" },
  { key: "grafico", label: "Gráfico" },
  { key: "insights", label: "Insights" },
  { key: "depoimentos", label: "Provas" },
];

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers, name: leadName, bodyAnalysis } = (location.state as any) || {};

  // Redirect if no quiz data
  useEffect(() => {
    if (!answers) {
      navigate("/quiz", { replace: true });
    }
  }, [answers, navigate]);

  const scores = calculateAxisScores(answers || {});
  const dims = deriveSixDimensions(scores);
  const potential = computePotential(dims);
  const overallScore = computeOverallScore(dims);
  const insights = generateInsights(dims, answers || {});
  const bottleneckLabel = insights[0]?.title?.split(" é ")[0] || "Consistência";

  // Filter testimonials by user profile, fallback to all
  const objetivo = getObjetivo(answers);
  const filtered = allTestimonials.filter((t) => t.profile === objetivo);
  const displayTestimonials = filtered.length >= 2 ? filtered : allTestimonials;

  const [activeTab, setActiveTab] = useState<TabKey>("score");
  const [ctaName, setCtaName] = useState(leadName || "");
  const [ctaEmail, setCtaEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const firstName = ctaName.trim().split(" ")[0] || "linda";
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ctaEmail);
  const isNameValid = ctaName.trim().length > 1;
  const canCheckout = isEmailValid && isNameValid && password.length >= 6;

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setCheckingOut(true);

    const email = ctaEmail.trim().toLowerCase();
    const name = ctaName.trim();

    // Track checkout event
    supabase.from("checkout_events").insert({ email, status: "initiated" }).then();

    try {
      // Insert lead
      await supabase.from("leads").insert({
        name,
        email,
        opted_in: true,
        quiz_answers: answers || {},
        profile_scores: scores || {},
      });

      // Track funnel
      const sessionId = sessionStorage.getItem("funnel_session") || crypto.randomUUID();
      sessionStorage.setItem("funnel_session", sessionId);
      await supabase.from("funnel_visits").insert({ step: "lead_captured", session_id: sessionId });

      // Sign up/in and checkout
      const { signUpAndCheckout } = await import("@/lib/authCheckout");
      const url = await signUpAndCheckout({ email, password, name });
      window.location.href = url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setCheckingOut(false);
    }
  };

  const scoreLabel = overallScore <= 40
    ? "Você precisa de atenção urgente. Mas calma — com o plano certo, tudo muda."
    : overallScore <= 70
    ? "Você tem potencial, mas precisa de direção. O plano personalizado vai acelerar seus resultados."
    : "Ótima base! Com ajustes pontuais, seus resultados vão explodir.";

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <section className="px-5 pt-10 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#FF6B2B" }}>
            Diagnóstico Completo
          </p>
          <h1
            className="text-2xl font-black text-white mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {firstName}, seu resultado
          </h1>
          <p className="text-sm text-white/50">
            Baseado nas suas {Object.keys(answers || {}).length} respostas
          </p>
        </motion.div>
      </section>

      {/* Tabs */}
      <nav className="px-5 mb-4">
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: activeTab === tab.key ? "#FF6B2B" : "transparent",
                color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.4)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <section className="px-5 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "score" && (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              <ScoreRing score={overallScore} label={scoreLabel} />

              {/* Dimension breakdown */}
              <div className="w-full mt-6 space-y-3">
                {(Object.keys(dims) as (keyof typeof dims)[]).map((key, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-white/50 w-24 text-right shrink-0">
                      {dimensionLabels[key]}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${dims[key] * 10}%` }}
                        transition={{ delay: 1 + i * 0.1, duration: 0.6 }}
                        style={{
                          background:
                            dims[key] <= 3 ? "#EF4444" : dims[key] <= 6 ? "#F59E0B" : "#10B981",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold w-8 text-right tabular-nums"
                      style={{
                        color:
                          dims[key] <= 3 ? "#EF4444" : dims[key] <= 6 ? "#F59E0B" : "#10B981",
                      }}
                    >
                      {dims[key]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "grafico" && (
            <motion.div
              key="grafico"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-2">
                <p className="text-xs text-white/40">Comparação: Atual vs. Potencial em 12 Semanas</p>
              </div>
              <RadarChartComponent current={dims} potential={potential} />
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#EF4444" }} />
                  <span className="text-[11px] text-white/50">Hoje</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#10B981" }} />
                  <span className="text-[11px] text-white/50">12 Semanas</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <InsightCards insights={insights} />

              {/* Body analysis if available */}
              {bodyAnalysis && bodyAnalysis.body_type !== "indefinido" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 rounded-2xl p-4"
                  style={{
                    background: "rgba(255,107,43,0.05)",
                    border: "1px solid rgba(255,107,43,0.15)",
                  }}
                >
                  <h4
                    className="text-sm font-bold text-white/90 mb-3"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    📸 Análise Corporal
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Biotipo</span>
                      <span className="text-white/80 capitalize">{bodyAnalysis.body_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">% Gordura</span>
                      <span className="text-white/80">{bodyAnalysis.estimated_bf_range}</span>
                    </div>
                    {bodyAnalysis.recommendation && (
                      <p className="text-white/60 pt-2 border-t border-white/5">
                        ✨ {bodyAnalysis.recommendation}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "depoimentos" && (
            <motion.div
              key="depoimentos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-xs text-white/40 text-center mb-4">
                Mulheres com perfil parecido com o seu
              </p>
              <TestimonialCarousel testimonials={displayTestimonials} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Social Proof Banner */}
      <section className="px-5 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {allTestimonials.slice(0, 4).map((t, i) => (
                <img key={i} src={t.photo} alt={t.name} loading="lazy" className="w-7 h-7 rounded-full border-2 object-cover" style={{ borderColor: "#0a0a0a" }} />
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill="#F59E0B" color="#F59E0B" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-white/60">4.8</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: "#FF6B2B", fontFamily: "'Montserrat', sans-serif" }}>5.200+</p>
              <p className="text-[10px] text-white/40">mulheres ativas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: "#10B981", fontFamily: "'Montserrat', sans-serif" }}>87%</p>
              <p className="text-[10px] text-white/40">viram resultados em 30 dias</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="px-5 pb-10">
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(255,107,43,0.08) 0%, rgba(255,107,43,0.02) 100%)",
            border: "1px solid rgba(255,107,43,0.2)",
          }}
        >
          <h3
            className="text-xl font-black text-white mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Acesso Imediato
          </h3>
          <p className="text-xs text-white/40 mb-5">
            Grátis por tempo limitado • Garantia de 30 dias.
          </p>

          {/* Name */}
          <div className="mb-3 text-left">
            <label className="text-[10px] text-white/30 mb-1 block">Seu primeiro nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input
                placeholder="Ex: Maria"
                value={ctaName}
                onChange={(e) => setCtaName(e.target.value)}
                className="pl-10 h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20"
                maxLength={100}
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-3 text-left">
            <label className="text-[10px] text-white/30 mb-1 block">Seu melhor email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input
                type="email"
                placeholder="seu@email.com"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20"
                maxLength={255}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4 text-left">
            <label className="text-[10px] text-white/30 mb-1 block">Crie uma senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleCheckout}
            disabled={checkingOut || !canCheckout}
            className="w-full rounded-full py-6 text-sm font-bold"
            style={{
              background: canCheckout
                ? "linear-gradient(135deg, #FF6B2B, #F59E0B)"
                : "rgba(255,255,255,0.1)",
              color: canCheckout ? "#fff" : "rgba(255,255,255,0.3)",
            }}
          >
            {checkingOut ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processando...</>
            ) : (
              <>Começar agora — Grátis <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>

          <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-white/30">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Garantia 30 dias
            </span>
            <span>•</span>
            <span>Cancele a qualquer momento</span>
          </div>
        </div>
      </section>

      {/* Urgency Modal */}
      <UrgencyModal
        firstName={firstName}
        bottleneck={bottleneckLabel}
        onCTA={scrollToCTA}
      />
    </div>
  );
};

function getObjetivo(answers: Record<string, string | string[]> | undefined): string {
  if (!answers) return "";
  const a = answers["t01"];
  const id = Array.isArray(a) ? a[0] : a;
  const map: Record<string, string> = {
    t01a: "Emagrecer",
    t01b: "Definir",
    t01c: "Emagrecer + Definir",
    t01d: "Iniciante",
  };
  return map[id] || "";
}

export default QuizResult;
