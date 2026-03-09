import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, Users, TrendingUp, User } from "lucide-react";

/* ─── Solar palette — shared across all pages ─── */
export const S = {
  bg: "#FDFCFB",
  card: "#FFFFFF",
  cardBorder: "#F0EBE5",
  orange: "#EA580C",
  amber: "#F59E0B",
  coral: "#F87171",
  terracotta: "#C2410C",
  text: "#18181B",
  textMuted: "#A1A1AA",
  textSub: "#71717A",
  glow: "rgba(234,88,12,0.15)",
  glowStrong: "rgba(234,88,12,0.25)",
};

const NAV_ITEMS = [
  { icon: Home, label: "Início", route: "/app" },
  { icon: Dumbbell, label: "Treino", route: "/app/workouts" },
  { icon: Users, label: "Feed", route: "/app/community" },
  { icon: TrendingUp, label: "Evolução", route: "/app/history" },
  { icon: User, label: "Perfil", route: "/app/profile" },
];

export const SolarBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (route: string) => location.pathname === route;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        backgroundColor: "rgba(253,252,251,0.82)",
        backdropFilter: "blur(32px) saturate(1.8)",
        WebkitBackdropFilter: "blur(32px) saturate(1.8)",
        borderTop: `1px solid ${S.cardBorder}`,
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-7">
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(item.route);
          return (
            <button
              key={i}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 transition-all active:scale-95"
            >
              <div className="relative">
                {active && (
                  <div
                    className="absolute inset-0 -m-1.5 rounded-lg"
                    style={{ backgroundColor: "rgba(234,88,12,0.08)" }}
                  />
                )}
                <item.icon
                  size={20}
                  style={{
                    color: active ? S.orange : S.textMuted,
                    strokeWidth: active ? 2.5 : 1.8,
                    position: "relative",
                  }}
                />
                {active && (
                  <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: S.orange, boxShadow: `0 0 8px ${S.orange}` }}
                  />
                )}
              </div>
              <span
                className="text-[10px]"
                style={{
                  color: active ? S.orange : S.textMuted,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

interface SolarPageProps {
  children: React.ReactNode;
}

export const SolarPage: React.FC<SolarPageProps> = ({ children }) => (
  <div
    className="min-h-screen pb-28 overflow-x-hidden"
    style={{ backgroundColor: S.bg, fontFamily: "'Inter', sans-serif" }}
  >
    {children}
    <SolarBottomNav />
  </div>
);
