import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Star, Dumbbell, Wind, StretchHorizontal, Target, CalendarCheck, Flame, Check } from "lucide-react";
import { testimonials } from "@/lib/quizResultUtils";
import logoMeuShape from "@/assets/logo-meushape.png";
import { Button } from "@/components/ui/button";

const analysisMessages = [
  "Analisando seu diagnóstico...",
  "Mapeando pontos fortes e fracos...",
  "Selecionando exercícios pro seu nível...",
];

const finalizationMessages = [
  "Ajustando pro seu tempo disponível...",
  "Finalizando seu plano personalizado...",
];

const dimensionIcons = [
  { icon: Dumbbell, label: "Força" },
  { icon: Wind, label: "Resistência" },
  { icon: StretchHorizontal, label: "Flexibilidade" },
  { icon: Target, label: "Composição" },
  { icon: CalendarCheck, label: "Consistência" },
  { icon: Flame, label: "Motivação" },
];

const checkItems = [
  "Exercícios selecionados",
  "Nível ajustado",
  "Tempo personalizado",
  "Plano montado",
];

const QuizLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const answers = (location.state as any)?.answers || {};
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [visibleChecks, setVisibleChecks] = useState(0);

  const phase = progress < 40 ? 1 : progress < 75 ? 2 : 3;

  // Progress ticker (3.5 seconds total)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 70);
    return () => clearInterval(interval);
  }, []);

  // Messages
  useEffect(() => {
    const msgs = phase <= 2 ? analysisMessages : finalizationMessages;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev < msgs.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, [phase]);

  // Reset message index on phase change
  useEffect(() => {
    setMessageIndex(0);
  }, [phase]);

  // Testimonial auto-scroll
  useEffect(() => {
    if (phase !== 2) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  // Checkmarks in phase 3
  useEffect(() => {
    if (phase !== 3) return;
    setVisibleChecks(0);
    const interval = setInterval(() => {
      setVisibleChecks((prev) => {
        if (prev >= checkItems.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [phase]);

  // Visible dimension icons based on progress
  const visibleDimensions = useMemo(() => {
    if (phase !== 1) return dimensionIcons.length;
    return Math.min(dimensionIcons.length, Math.floor(progress / 6));
  }, [progress, phase]);

  const currentMessage = phase <= 2 ? analysisMessages[messageIndex] : finalizationMessages[messageIndex];

  const ringSize = phase === 1 ? 140 : 90;
  const strokeWidth = phase === 1 ? 8 : 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  const visibleTestimonials = [
    testimonials[testimonialIndex % testimonials.length],
    testimonials[(testimonialIndex + 1) % testimonials.length],
  ];

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex justify-center pt-4 pb-2">
        <img src={logoMeuShape} alt="Meu Shape" className="h-7 object-contain" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* Progress Ring */}
        <div
          className="relative mx-auto mb-4 transition-all duration-500"
          style={{ width: ringSize, height: ringSize }}
        >
          <svg
            className="-rotate-90 transition-all duration-500"
            width={ringSize}
            height={ringSize}
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold tabular-nums text-foreground"
              style={{ fontSize: phase === 1 ? 28 : 18, fontFamily: "'Montserrat', sans-serif" }}
            >
              {progress}%
            </span>
          </div>
        </div>

        {/* Phase 1: Dimension icons */}
        {phase === 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-4 max-w-[280px]">
            {dimensionIcons.map((dim, i) => (
              <div
                key={dim.label}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  i < visibleDimensions
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-75"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <dim.icon size={18} className="text-primary" />
                </div>
                <span className="text-[10px] text-muted-foreground">{dim.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Phase 2: Testimonials */}
        {phase === 2 && (
          <div className="w-full max-w-sm space-y-3 animate-fade-in">
            {/* Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Flame size={12} />
                12.000+ mulheres transformadas
              </span>
            </div>

            {/* Testimonial cards */}
            <div className="flex gap-2">
              {visibleTestimonials.map((t, i) => (
                <div
                  key={`${t.name}-${testimonialIndex}-${i}`}
                  className="flex-1 rounded-xl p-3 animate-fade-in"
                  style={{
                    background: "hsl(var(--secondary) / 0.5)",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="w-8 h-8 rounded-full object-cover"
                      loading="eager"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{t.name}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={8} fill="hsl(var(--primary))" color="hsl(var(--primary))" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    "{t.quote}"
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    {t.metrics.slice(0, 2).map((m, j) => (
                      <div
                        key={j}
                        className="flex-1 rounded-lg py-1 text-center bg-primary/10"
                      >
                        <p className="text-[10px] font-black text-primary">{m.value}</p>
                        <p className="text-[8px] text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: Checkmarks */}
        {phase === 3 && (
          <div className="w-full max-w-xs space-y-2.5 animate-fade-in">
            <h3 className="text-center text-sm font-bold text-foreground mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Seu plano está quase pronto!
            </h3>
            {checkItems.map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  i < visibleChecks ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-primary" />
                </div>
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status message */}
        <p className="text-muted-foreground text-xs mt-4 animate-pulse text-center min-h-[16px]">
          {currentMessage}
        </p>
      </div>
    </div>
  );
};

export default QuizLoading;
