import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Star, Dumbbell, Wind, StretchHorizontal, Target, CalendarCheck, Flame, Check } from "lucide-react";
import { testimonials } from "@/lib/quizResultUtils";
import logoMeuShape from "@/assets/logo-meushape.png";
import { Button } from "@/components/ui/button";

const analysisMessages = [
  "Cruzando suas respostas com nosso método...",
  "Avaliando seu nível e histórico...",
  "Identificando o que vai funcionar pra você...",
  "Encaixando no seu tempo disponível...",
  "Montando sua rotina de treinos...",
];

const checkItems = [
  "Treinos adaptados ao seu nível",
  "Exercícios pro seu objetivo",
  "Duração ajustada à sua rotina",
  "Progressão inteligente ativada",
];

const QuizLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { answers, name } = (location.state as any) || {};
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const visibleChecks = useMemo(() => {
    if (progress < 25) return 0;
    if (progress < 45) return 1;
    if (progress < 65) return 2;
    if (progress < 85) return 3;
    return 4;
  }, [progress]);

  const done = progress >= 100;

  // Progress ticker ~8s total
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.7;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.round(next * 10) / 10;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev < analysisMessages.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Testimonial auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const ringSize = 100;
  const strokeWidth = 7;
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

      <div className="flex-1 flex flex-col items-center px-5 pt-4 overflow-y-auto">
        {/* Progress Ring */}
        <div className="relative mx-auto mb-2" style={{ width: ringSize, height: ringSize }}>
          <svg className="-rotate-90" width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth={strokeWidth} />
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-100" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-bold tabular-nums text-foreground text-xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Status message */}
        {!done && (
          <p className="text-muted-foreground text-xs animate-pulse text-center min-h-[16px] mb-4">
            {analysisMessages[messageIndex]}
          </p>
        )}

        {done && (
          <p className="text-primary text-xs font-semibold text-center mb-4">
            Análise completa!
          </p>
        )}

        {/* Checkmarks */}
        <div className="w-full max-w-xs space-y-2 mb-5">
          {checkItems.map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-3 transition-all duration-400 ${
                i < visibleChecks ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Check size={12} className="text-primary" />
              </div>
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>

        {/* Testimonials carousel */}
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
              <Flame size={10} />
              12.000+ mulheres transformadas
            </span>
          </div>
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
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={t.photo} alt={t.name} className="w-7 h-7 rounded-full object-cover" loading="eager" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground truncate">{t.name}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={7} fill="hsl(var(--primary))" color="hsl(var(--primary))" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                  "{t.quote}"
                </p>
                <div className="flex gap-1.5 mt-1.5">
                  {t.metrics.slice(0, 2).map((m, j) => (
                    <div key={j} className="flex-1 rounded-lg py-1 text-center bg-primary/10">
                      <p className="text-[9px] font-black text-primary">{m.value}</p>
                      <p className="text-[7px] text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === testimonialIndex % testimonials.length ? "bg-primary w-3" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        {done && (
          <div className="w-full max-w-sm mt-5 mb-6 animate-fade-in">
            <Button
              onClick={() => navigate("/quiz/analise-corporal", { state: { answers, name } })}
              className="w-full h-12 text-base font-bold"
            >
              Ver Meu Diagnóstico Completo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizLoading;
