import { memo, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Waves, Flame, Zap, Home } from "lucide-react";

interface ModuleCardsProps {
  profileScores?: Record<string, any>;
  location?: string[];
}

const ModuleCards = ({ profileScores, location }: ModuleCardsProps) => {
  const navigate = useNavigate();

  const modules = [
    {
      id: "warmup",
      label: "Aquecimento",
      description: "Prepare seu corpo pro treino",
      icon: Zap,
      color: "bg-orange-500/10 text-orange-500",
      onClick: () => navigate("/app/warmup?split=legs"),
      always: true,
    },
    {
      id: "stretching",
      label: "Alongamento",
      description: "Pós-treino ou dia de descanso",
      icon: Waves,
      color: "bg-blue-500/10 text-blue-500",
      onClick: () => navigate("/app/stretching?type=mobility"),
      always: true,
    },
    {
      id: "cardio",
      label: "Cardio Guiado",
      description: "LISS, HIIT e Incline Walking",
      icon: Flame,
      color: "bg-red-500/10 text-red-500",
      onClick: () => navigate("/app/cardio"),
      always: true,
    },
    {
      id: "home",
      label: "Treino em Casa",
      description: "Circuitos e treinos sem academia",
      icon: Home,
      color: "bg-green-500/10 text-green-500",
      onClick: () => navigate("/app/home-workout"),
      always: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {modules.map((mod) => {
        const Icon = mod.icon;
        return (
          <button
            key={mod.id}
            onClick={mod.onClick}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${mod.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-semibold text-foreground text-sm">{mod.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default ModuleCards;
