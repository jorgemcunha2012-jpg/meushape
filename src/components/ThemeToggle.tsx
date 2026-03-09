import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
        {theme === "dark" ? (
          <Moon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Sun className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium font-sans">Aparência</p>
        <p className="text-xs text-muted-foreground">
          {theme === "dark" ? "Tema escuro" : "Tema claro"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{theme === "dark" ? "Escuro" : "Claro"}</span>
        <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${theme === "dark" ? "left-5" : "left-0.5"}`} />
        </div>
      </div>
    </button>
  );
}
