import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft, Camera, LogOut, ChevronRight,
  Flame, Dumbbell, Clock, Trophy, Medal, Target,
  Bell, HelpCircle, Shield
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";

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
  const S = useSolar();
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
    if (!subscriptionLoading && !user) { navigate("/app/login"); return; }
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

    if (profileRes.data) setProfile(profileRes.data);

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
    const { error } = await supabase.storage.from("body-photos").upload(filePath, file, { upsert: true });
    if (error) {
      toast.error("Erro ao fazer upload da foto");
    } else {
      const { data } = await supabase.storage.from("body-photos").createSignedUrl(filePath, 3600);
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: S.bg }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottomColor: S.orange, borderWidth: 2, borderColor: S.cardBorder }} />
      </div>
    );
  }

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.5rem",
    boxShadow: `0 2px 12px rgba(234,88,12,0.04)`,
  };

  const statItems = [
    { icon: Dumbbell, label: "Treinos", value: stats.totalWorkouts.toString(), gradient: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", iconColor: S.orange },
    { icon: Clock, label: "Minutos", value: stats.totalMinutes.toString(), gradient: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", iconColor: "#3B82F6" },
    { icon: Flame, label: "Sequência", value: `${stats.currentStreak} dias`, gradient: "linear-gradient(135deg, #FEF3C7, #FDE68A)", iconColor: S.amber },
    { icon: Trophy, label: "Recorde", value: `${stats.longestStreak} dias`, gradient: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", iconColor: "#16a34a" },
  ];

  const settingsItems = [
    { icon: Bell, label: "Notificações", sub: "Lembretes de treino", action: () => toast.info("Em breve!") },
    { icon: Target, label: "Metas", sub: "Objetivos semanais", action: () => toast.info("Em breve!") },
    { icon: Shield, label: "Privacidade", sub: "Dados e permissões", action: () => toast.info("Em breve!") },
    { icon: HelpCircle, label: "Suporte", sub: "Dúvidas e feedback", action: () => toast.info("Em breve!") },
  ];

  return (
    <SolarPage>
      <SolarHeader title="Meu Perfil" showBack />

      {/* Avatar + Name */}
      <section className="px-5 pt-4 pb-6">
        <div className="max-w-lg mx-auto flex flex-col items-center">
          <div className="relative mb-4">
            <div
              className="w-24 h-24 overflow-hidden flex items-center justify-center"
              style={{
                borderRadius: "2rem",
                backgroundColor: S.card,
                border: `2px solid ${S.orange}30`,
                boxShadow: `0 0 0 4px ${S.glow}`,
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span
                  className="text-4xl font-display"
                  style={{ fontWeight: 800, color: S.orange }}
                >
                  {profile?.name ? profile.name[0].toUpperCase() : "👤"}
                </span>
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center cursor-pointer"
              style={{
                borderRadius: "0.75rem",
                background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                boxShadow: `0 4px 12px ${S.glowStrong}`,
              }}
            >
              <Camera size={14} style={{ color: "#fff" }} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>

          <h2 className="font-display text-xl mb-0.5" style={{ fontWeight: 800, color: S.text }}>
            {profile?.name || "Usuário"}
          </h2>
          <p className="text-sm" style={{ color: S.textMuted }}>{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="px-3 py-1 text-xs font-semibold"
              style={{
                borderRadius: "0.75rem",
                background: "rgba(22,163,74,0.1)",
                color: "#16a34a",
              }}
            >
              {profile?.subscription_status === "active" ? "Premium" : profile?.subscription_status === "trial" ? "Trial" : "Ativa"}
            </span>
            {memberSince && (
              <span className="text-xs" style={{ color: S.textMuted }}>Membro desde {memberSince}</span>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-5 pb-5">
        <div className="max-w-lg mx-auto">
          <h3 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>
            Suas Estatísticas
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {statItems.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4"
                style={cardStyle}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center mb-2"
                  style={{ borderRadius: "0.75rem", background: stat.gradient }}
                >
                  <stat.icon size={16} style={{ color: stat.iconColor }} strokeWidth={2.5} />
                </div>
                <p className="font-display text-lg" style={{ fontWeight: 800, color: S.text }}>{stat.value}</p>
                <p className="text-[11px]" style={{ color: S.textMuted }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="px-5 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app/history")}
            className="w-full flex items-center justify-between p-4 group transition-all active:scale-[0.98]"
            style={cardStyle}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 flex items-center justify-center"
                style={{ borderRadius: "0.75rem", background: "linear-gradient(135deg, #F3E8FF, #E9D5FF)" }}
              >
                <Medal size={16} style={{ color: "#7C3AED" }} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>Conquistas</p>
                <p className="text-[11px]" style={{ color: S.textMuted }}>
                  {stats.badges > 0 ? `${stats.badges} badges conquistados` : "Complete treinos para desbloquear"}
                </p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: S.cardBorder }} />
          </button>
        </div>
      </section>

      {/* Settings */}
      <section className="px-5 pb-5">
        <div className="max-w-lg mx-auto">
          <h3 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>Configurações</h3>
          <div className="overflow-hidden" style={{ ...cardStyle, padding: 0 }}>
            {settingsItems.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center gap-3 p-4 transition-all active:scale-[0.98]"
                style={{
                  borderBottom: i < settingsItems.length - 1 ? `1px solid ${S.cardBorder}` : "none",
                }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center"
                  style={{ borderRadius: "0.75rem", background: "#FFF7ED" }}
                >
                  <item.icon size={16} style={{ color: S.textSub }} strokeWidth={2} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{item.label}</p>
                  <p className="text-[11px]" style={{ color: S.textMuted }}>{item.sub}</p>
                </div>
                <ChevronRight size={16} style={{ color: S.cardBorder }} />
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
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all"
            style={{
              borderRadius: "1.5rem",
              border: `1px solid #FECACA`,
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
            }}
          >
            <LogOut size={16} />
            Sair da Conta
          </motion.button>
        </div>
      </section>
    </SolarPage>
  );
};

export default AppProfile;
