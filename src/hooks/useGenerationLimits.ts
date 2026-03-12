import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GenerationType = "plan" | "challenge" | "project";

interface LimitInfo {
  canGenerate: boolean;
  daysUntilNext: number;
  lastGeneratedAt: string | null;
  activeProgramId: string | null;
}

interface GenerationLimits {
  plan: LimitInfo;
  challenge: LimitInfo;
  project: LimitInfo;
  loading: boolean;
  refresh: () => Promise<void>;
  recordGeneration: (type: GenerationType, programId: string) => Promise<void>;
}

const COOLDOWNS: Record<GenerationType, number> = {
  plan: 7 * 24 * 60 * 60 * 1000,       // 7 days
  challenge: 30 * 24 * 60 * 60 * 1000,  // 30 days
  project: 30 * 24 * 60 * 60 * 1000,    // 30 days
};

const LS_KEYS: Record<GenerationType, string> = {
  plan: "gen:plan:lastAt",
  challenge: "gen:challenge:lastAt",
  project: "gen:project:lastAt",
};

function getLocalLimit(type: GenerationType): LimitInfo {
  const raw = localStorage.getItem(LS_KEYS[type]);
  if (!raw) return { canGenerate: true, daysUntilNext: 0, lastGeneratedAt: null, activeProgramId: null };
  const lastAt = new Date(raw).getTime();
  const elapsed = Date.now() - lastAt;
  const remaining = COOLDOWNS[type] - elapsed;
  const canGenerate = remaining <= 0;
  const daysUntilNext = canGenerate ? 0 : Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return { canGenerate, daysUntilNext, lastGeneratedAt: raw, activeProgramId: null };
}

function setLocalLimit(type: GenerationType, date: string) {
  localStorage.setItem(LS_KEYS[type], date);
}

const defaultLimit: LimitInfo = { canGenerate: true, daysUntilNext: 0, lastGeneratedAt: null, activeProgramId: null };

export function useGenerationLimits(userId: string | undefined, isAdmin = false): GenerationLimits {
  const adminLimit: LimitInfo = { canGenerate: true, daysUntilNext: 0, lastGeneratedAt: null, activeProgramId: null };
  const [limits, setLimits] = useState<Record<GenerationType, LimitInfo>>({
    plan: isAdmin ? adminLimit : defaultLimit,
    challenge: isAdmin ? adminLimit : defaultLimit,
    project: isAdmin ? adminLimit : defaultLimit,
  });
  const [loading, setLoading] = useState(!isAdmin);

  const refresh = useCallback(async () => {
    if (!userId) return;

    // Start with localStorage cache
    const localLimits: Record<GenerationType, LimitInfo> = {
      plan: getLocalLimit("plan"),
      challenge: getLocalLimit("challenge"),
      project: getLocalLimit("project"),
    };
    setLimits(localLimits);

    // Then sync from DB
    const { data } = await supabase
      .from("user_generation_limits")
      .select("*")
      .eq("user_id", userId);

    if (data) {
      const dbLimits = { ...localLimits };
      for (const row of data) {
        const type = row.generation_type as GenerationType;
        if (!COOLDOWNS[type]) continue;
        const lastAt = new Date(row.last_generated_at).getTime();
        const elapsed = Date.now() - lastAt;
        const remaining = COOLDOWNS[type] - elapsed;
        const canGenerate = remaining <= 0;
        const daysUntilNext = canGenerate ? 0 : Math.ceil(remaining / (24 * 60 * 60 * 1000));
        dbLimits[type] = {
          canGenerate,
          daysUntilNext,
          lastGeneratedAt: row.last_generated_at,
          activeProgramId: row.active_program_id,
        };
        // Sync localStorage
        setLocalLimit(type, row.last_generated_at);
      }
      setLimits(dbLimits);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordGeneration = useCallback(async (type: GenerationType, programId: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    setLocalLimit(type, now);

    await supabase
      .from("user_generation_limits")
      .upsert(
        {
          user_id: userId,
          generation_type: type,
          last_generated_at: now,
          active_program_id: programId,
        },
        { onConflict: "user_id,generation_type" }
      );

    await refresh();
  }, [userId, refresh]);

  return {
    plan: limits.plan,
    challenge: limits.challenge,
    project: limits.project,
    loading,
    refresh,
    recordGeneration,
  };
}
