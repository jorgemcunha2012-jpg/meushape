import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSolar } from "@/components/SolarLayout";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const S = useSolar();

  const toggleTheme = () => {
    document.documentElement.classList.add("theme-transition");
    setTheme(theme === "dark" ? "light" : "dark");
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 500);
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center gap-3 p-4 transition-all active:scale-[0.98]"
    >
      <div
        className="w-9 h-9 flex items-center justify-center"
        style={{ borderRadius: "0.75rem", background: "#FFF7ED" }}
      >
        {theme === "dark" ? (
          <Moon size={16} style={{ color: S.textSub }} strokeWidth={2} />
        ) : (
          <Sun size={16} style={{ color: S.textSub }} strokeWidth={2} />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold" style={{ color: S.text }}>Aparência</p>
        <p className="text-[11px]" style={{ color: S.textMuted }}>
          {theme === "dark" ? "Tema escuro" : "Tema claro"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px]" style={{ color: S.textMuted }}>
          {theme === "dark" ? "Escuro" : "Claro"}
        </span>
        <div
          className="w-10 h-5 rounded-full relative transition-colors"
          style={{ backgroundColor: theme === "dark" ? S.orange : S.cardBorder }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
            style={{
              backgroundColor: "#fff",
              transform: theme === "dark" ? "translateX(20px)" : "translateX(2px)",
            }}
          />
        </div>
      </div>
    </button>
  );
}
