import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft, Camera, LogOut, ChevronRight,
  Flame, Dumbbell, Clock, Trophy, Medal, Target,
  Bell, HelpCircle, Shield, Mail
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  email: string;
  created_at: string;
  subscription_status: string;
}

interface StatsData {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  badges: number;
}

const AppProfile = () => {
  const navigate = useNavigate();
  const { user, subscribed, subscriptionLoading, signOut } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData>({
    totalWorkouts: 0, totalMinutes: 0, currentStreak: 0, longestStreak: 0, badges: 0,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    if (user) fetchAll();
  }, [user, subscribed, subscriptionLoading]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [profileRes, logsRes, streakRes, badgesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("workout_logs").select("id, duration_minutes").eq("user_id", user.id),
      supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
      supabase.from("user_badges").select("id").eq("user_id", user.id),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
    }

    // Check for avatar
    const { data: avatarData } = await supabase.storage
      .from("body-photos")
      .createSignedUrl(`avatars/${user.id}.jpg`, 3600);
    if (avatarData?.signedUrl) setAvatarUrl(avatarData.signedUrl);

    setStats({
      totalWorkouts: logsRes.data?.length || 0,
      totalMinutes: logsRes.data?.reduce((a, l) => a + (l.duration_minutes || 0), 0) || 0,
      currentStreak: streakRes.data?.current_streak || 0,
      longestStreak: streakRes.data?.longest_streak || 0,
      badges: badgesRes.data?.length || 0,
    });

    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filePath = `avatars/${user.id}.jpg`;

    const { error } = await supabase.storage
      .from("body-photos")
      .upload(filePath, file, { upsert: true });

    if (error) {
      toast.error("Erro ao fazer upload da foto");
    } else {
      const { data } = await supabase.storage
        .from("body-photos")
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) setAvatarUrl(data.signedUrl);
      toast.success("Foto atualizada!");
    }
    setUploading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/app/login");
  };

  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(profile.created_at))
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="px-5 pt-10 pb-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/app")}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold font-sans">Meu Perfil</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Avatar + Name */}
      <section className="px-5 pt-4 pb-6">
        <div className="max-w-lg mx-auto flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-card border-2 border-primary/30 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">
                  {profile?.name ? profile.name[0].toUpperCase() : "👤"}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg shadow-primary/25">
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <h2 className="text-xl font-bold mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
            {profile?.name || "Usuária"}
          </h2>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
              {profile?.subscription_status === "active" ? "Premium" : profile?.subscription_status === "trial" ? "Trial" : "Ativa"}
            </span>
            {memberSince && (
              <span className="text-xs text-muted-foreground">
                Membro desde {memberSince}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-5 pb-4">
        <div className="max-w-lg mx-auto">
          <h3 className="text-sm font-semibold mb-3 font-sans">Suas Estatísticas</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Dumbbell, label: "Treinos", value: stats.totalWorkouts.toString(), color: "text-primary", bg: "bg-primary/10" },
              { icon: Clock, label: "Minutos", value: stats.totalMinutes.toString(), color: "text-info", bg: "bg-info/10" },
              { icon: Flame, label: "Sequência", value: `${stats.currentStreak} dias`, color: "text-warning", bg: "bg-warning/10" },
              { icon: Trophy, label: "Maior Sequência", value: `${stats.longestStreak} dias`, color: "text-success", bg: "bg-success/10" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Badges Preview */}
      <section className="px-5 pb-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app/history")}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center">
                <Medal className="w-4 h-4 text-purple" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold font-sans">Conquistas</p>
                <p className="text-xs text-muted-foreground">
                  {stats.badges > 0 ? `${stats.badges} badges conquistados` : "Complete treinos para desbloquear"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </section>

      {/* Settings */}
      <section className="px-5 pb-4">
        <div className="max-w-lg mx-auto">
          <h3 className="text-sm font-semibold mb-3 font-sans">Configurações</h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {[
              { icon: Bell, label: "Notificações", sub: "Lembretes de treino", action: () => toast.info("Em breve!") },
              { icon: Target, label: "Metas", sub: "Objetivos semanais", action: () => toast.info("Em breve!") },
              { icon: Shield, label: "Privacidade", sub: "Dados e permissões", action: () => toast.info("Em breve!") },
              { icon: HelpCircle, label: "Suporte", sub: "Dúvidas e feedback", action: () => toast.info("Em breve!") },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium font-sans">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </section>

      {/* Logout */}
      <section className="px-5 pb-6">
        <div className="max-w-lg mx-auto">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive font-semibold text-sm font-sans hover:bg-destructive/10 transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </motion.button>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-20">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-6">
          <button onClick={() => navigate("/app")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">🏠</span>
            <span className="text-[10px] text-muted-foreground">Home</span>
          </button>
          <button onClick={() => navigate("/app/workouts")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">🏋️‍♀️</span>
            <span className="text-[10px] text-muted-foreground">Treinos</span>
          </button>
          <button onClick={() => navigate("/app/community")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">👥</span>
            <span className="text-[10px] text-muted-foreground">Social</span>
          </button>
          <button onClick={() => navigate("/app/history")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">📊</span>
            <span className="text-[10px] text-muted-foreground">Progresso</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg">👤</span>
            <span className="text-[10px] font-semibold text-primary">Perfil</span>
            <div className="w-1 h-1 rounded-full bg-primary" />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AppProfile;
