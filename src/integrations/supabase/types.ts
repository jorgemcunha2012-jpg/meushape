export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checkout_events: {
        Row: {
          created_at: string
          email: string
          id: string
          lead_id: string | null
          status: string
          stripe_session_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          lead_id?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lead_id?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          user_id?: string
        }
        Relationships: []
      }
      curated_exercises: {
        Row: {
          active: boolean
          body_part: string
          common_mistakes_pt: string | null
          contraindications: string[] | null
          created_at: string
          default_reps_advanced: string
          default_reps_beginner: string
          default_reps_intermediate: string
          default_rest_advanced: number
          default_rest_beginner: number
          default_rest_intermediate: number
          default_sets_advanced: number
          default_sets_beginner: number
          default_sets_intermediate: number
          difficulty_level: number
          equipment: string
          exercisedb_id: string | null
          focus_category: string
          gif_url: string | null
          id: string
          is_female_friendly: boolean
          location: string[]
          name_en: string | null
          name_pt: string
          priority: number
          secondary_muscles: string[] | null
          simple_instruction_pt: string | null
          target: string
        }
        Insert: {
          active?: boolean
          body_part: string
          common_mistakes_pt?: string | null
          contraindications?: string[] | null
          created_at?: string
          default_reps_advanced?: string
          default_reps_beginner?: string
          default_reps_intermediate?: string
          default_rest_advanced?: number
          default_rest_beginner?: number
          default_rest_intermediate?: number
          default_sets_advanced?: number
          default_sets_beginner?: number
          default_sets_intermediate?: number
          difficulty_level?: number
          equipment: string
          exercisedb_id?: string | null
          focus_category: string
          gif_url?: string | null
          id?: string
          is_female_friendly?: boolean
          location?: string[]
          name_en?: string | null
          name_pt: string
          priority?: number
          secondary_muscles?: string[] | null
          simple_instruction_pt?: string | null
          target: string
        }
        Update: {
          active?: boolean
          body_part?: string
          common_mistakes_pt?: string | null
          contraindications?: string[] | null
          created_at?: string
          default_reps_advanced?: string
          default_reps_beginner?: string
          default_reps_intermediate?: string
          default_rest_advanced?: number
          default_rest_beginner?: number
          default_rest_intermediate?: number
          default_sets_advanced?: number
          default_sets_beginner?: number
          default_sets_intermediate?: number
          difficulty_level?: number
          equipment?: string
          exercisedb_id?: string | null
          focus_category?: string
          gif_url?: string | null
          id?: string
          is_female_friendly?: boolean
          location?: string[]
          name_en?: string | null
          name_pt?: string
          priority?: number
          secondary_muscles?: string[] | null
          simple_instruction_pt?: string | null
          target?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string
          id: string
          sets_completed: number
          workout_log_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          sets_completed?: number
          workout_log_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          sets_completed?: number
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          reps: string
          rest_seconds: number
          sets: number
          sort_order: number
          video_url: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          reps?: string
          rest_seconds?: number
          sets?: number
          sort_order?: number
          video_url?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          reps?: string
          rest_seconds?: number
          sets?: number
          sort_order?: number
          video_url?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_visits: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          step: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          step: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          step?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          opted_in: boolean
          profile_scores: Json
          quiz_answers: Json
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          opted_in?: boolean
          profile_scores?: Json
          quiz_answers?: Json
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          opted_in?: boolean
          profile_scores?: Json
          quiz_answers?: Json
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          lead_id: string | null
          name: string
          profile_scores: Json
          subscription_status: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          lead_id?: string | null
          name?: string
          profile_scores?: Json
          subscription_status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lead_id?: string | null
          name?: string
          profile_scores?: Json
          subscription_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          completed_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          completed_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_programs: {
        Row: {
          created_at: string
          days_per_week: number
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          level: string
          title: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          level?: string
          title: string
        }
        Update: {
          created_at?: string
          days_per_week?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          level?: string
          title?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          day_of_week: number | null
          description: string | null
          id: string
          program_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          id?: string
          program_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          id?: string
          program_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
