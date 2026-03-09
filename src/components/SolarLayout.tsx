import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Home, Dumbbell, Users, TrendingUp, User } from "lucide-react";

/* ─── Solar palette — light & dark variants ─── */
const LIGHT = {
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
  navBg: "rgba(253,252,251,0.82)",
  headerBg: "rgba(253,252,251,0.8)",
};

const DARK = {
  bg: "#1A1412",          // warm near-black (brown tint)
  card: "#231D19",        // warm dark card
  cardBorder: "#332A24",  // warm border
  orange: "#F97316",      // slightly brighter for contrast
  amber: "#FBBF24",
  coral: "#FB7185",
  terracotta: "#EA580C",
  text: "#FAF5F0",        // warm off-white
  textMuted: "#8C7E74",   // warm muted
  textSub: "#A69890",     // warm sub text
  glow: "rgba(249,115,22,0.2)",
  glowStrong: "rgba(249,115,22,0.35)",
  navBg: "rgba(26,20,18,0.85)",
  headerBg: "rgba(26,20,18,0.82)",
};

export type SolarPalette = typeof LIGHT;

export function useSolar(): SolarPalette {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? DARK : LIGHT;
}

/* ─── Backward-compat static export (light default) ─── */
export const S = LIGHT;

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
  const s = useSolar();

  const isActive = (route: string) => location.pathname === route;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        backgroundColor: s.navBg,
        backdropFilter: "blur(32px) saturate(1.8)",
        WebkitBackdropFilter: "blur(32px) saturate(1.8)",
        borderTop: `1px solid ${s.cardBorder}`,
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
                    style={{ backgroundColor: `${s.orange}14` }}
                  />
                )}
                <item.icon
                  size={20}
                  style={{
                    color: active ? s.orange : s.textMuted,
                    strokeWidth: active ? 2.5 : 1.8,
                    position: "relative",
                  }}
                />
                {active && (
                  <div
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: s.orange, boxShadow: `0 0 8px ${s.orange}` }}
                  />
                )}
              </div>
              <span
                className="text-[10px]"
                style={{
                  color: active ? s.orange : s.textMuted,
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

export const SolarPage: React.FC<SolarPageProps> = ({ children }) => {
  const s = useSolar();
  return (
    <div
      className="min-h-screen pb-28 overflow-x-hidden"
      style={{ backgroundColor: s.bg, fontFamily: "'Inter', sans-serif" }}
    >
      {children}
      <SolarBottomNav />
    </div>
  );
};
