import { memo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, User } from "lucide-react";
import type { InsightCard } from "@/lib/quizResultUtils";

interface InsightCardsProps {
  insights: InsightCard[];
}

const iconMap = {
  bottleneck: AlertTriangle,
  potential: TrendingUp,
  profile: User,
};

const colorMap = {
  bottleneck: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: "#EF4444", text: "#FCA5A5" },
  potential: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", icon: "#10B981", text: "#6EE7B7" },
  profile: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", icon: "#3B82F6", text: "#93C5FD" },
};

const InsightCards = memo(({ insights }: InsightCardsProps) => {
  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const Icon = iconMap[insight.type];
        const colors = colorMap[insight.type];
        return (
          <motion.div
            key={insight.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="rounded-2xl p-4"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${colors.icon}20` }}
              >
                <Icon size={20} color={colors.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className="text-sm font-bold"
                    style={{ color: colors.text, fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {insight.title}
                  </h4>
                  {insight.value && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${colors.icon}20`, color: colors.icon }}
                    >
                      {insight.value}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default InsightCards;
