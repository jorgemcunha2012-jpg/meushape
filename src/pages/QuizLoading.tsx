import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const loadingMessages = [
  "Analisando seu diagnóstico...",
  "Selecionando exercícios pro seu nível...",
  "Criando demonstrações em vídeo...",
  "Ajustando pro seu tempo disponível...",
  "Finalizando seu plano personalizado...",
];

const QuizLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const answers = (location.state as any)?.answers || {};
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate("/quiz/email", { state: { answers } });
          }, 500);
          return 100;
        }
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [navigate, answers]);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < loadingMessages.length - 1 ? prev + 1 : prev
      );
    }, 700);
    return () => clearInterval(msgInterval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-sm mx-auto w-full text-center">
        {/* Animated circle */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground font-display">
              {progress}%
            </span>
          </div>
        </div>

        <h2 className="font-display text-xl font-bold text-foreground mb-3">
          Montando seu plano personalizado...
        </h2>

        <p className="text-muted-foreground text-sm animate-pulse min-h-[20px]">
          {loadingMessages[messageIndex]}
        </p>
      </div>
    </div>
  );
};

export default QuizLoading;
