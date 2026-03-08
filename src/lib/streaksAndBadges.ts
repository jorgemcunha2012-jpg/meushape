import { supabase } from "@/integrations/supabase/client";

export async function updateStreak(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!existing) {
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_workout_date: today,
    } as any);
    return 1;
  }

  const lastDate = existing.last_workout_date;
  if (lastDate === today) return existing.current_streak;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (lastDate === yesterdayStr) {
    newStreak = (existing.current_streak as number) + 1;
  } else {
    newStreak = 1;
  }

  const longest = Math.max(newStreak, existing.longest_streak as number);

  await supabase
    .from("user_streaks")
    .update({ current_streak: newStreak, longest_streak: longest, last_workout_date: today } as any)
    .eq("user_id", userId);

  return newStreak;
}

export async function checkAndAwardBadges(userId: string, totalCompleted: number, streak: number) {
  const badges: string[] = [];

  if (totalCompleted >= 1) badges.push("first_workout");
  if (streak >= 7) badges.push("7_day_streak");
  if (totalCompleted >= 30) badges.push("30_workouts");

  for (const badge of badges) {
    await supabase
      .from("user_badges")
      .upsert({ user_id: userId, badge_type: badge } as any, { onConflict: "user_id,badge_type" });
  }

  return badges;
}

export const BADGE_INFO: Record<string, { emoji: string; label: string }> = {
  first_workout: { emoji: "🏋️", label: "Primeiro Treino" },
  "7_day_streak": { emoji: "🔥", label: "7 Dias Seguidos" },
  "30_workouts": { emoji: "🏆", label: "30 Treinos" },
  community_post: { emoji: "💬", label: "Compartilhou" },
};
