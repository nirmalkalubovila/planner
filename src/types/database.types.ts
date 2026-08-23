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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_updates: {
        Row: {
          description: string
          id: string
          release_date: string
          title: string
          version: string
        }
        Insert: {
          description: string
          id?: string
          release_date?: string
          title: string
          version: string
        }
        Update: {
          description?: string
          id?: string
          release_date?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      billing_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string
          message: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      completed_tasks: {
        Row: {
          createdAt: string
          dayStr: string
          id: string
          taskIds: Json
          user_id: string | null
        }
        Insert: {
          createdAt?: string
          dayStr: string
          id?: string
          taskIds?: Json
          user_id?: string | null
        }
        Update: {
          createdAt?: string
          dayStr?: string
          id?: string
          taskIds?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      custom_tasks: {
        Row: {
          bucket: string | null
          createdAt: string
          daysOfWeek: Json
          description: string | null
          endTime: string
          id: string
          name: string
          startTime: string
          user_id: string
        }
        Insert: {
          bucket?: string | null
          createdAt?: string
          daysOfWeek?: Json
          description?: string | null
          endTime: string
          id?: string
          name: string
          startTime: string
          user_id?: string
        }
        Update: {
          bucket?: string | null
          createdAt?: string
          daysOfWeek?: Json
          description?: string | null
          endTime?: string
          id?: string
          name?: string
          startTime?: string
          user_id?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          author_name: string | null
          author_position: string | null
          category: string
          consent_to_show: boolean | null
          created_at: string
          id: string
          message: string
          rating: number | null
          show_on_landing: boolean | null
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          author_position?: string | null
          category?: string
          consent_to_show?: boolean | null
          created_at?: string
          id?: string
          message: string
          rating?: number | null
          show_on_landing?: boolean | null
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          author_position?: string | null
          category?: string
          consent_to_show?: boolean | null
          created_at?: string
          id?: string
          message?: string
          rating?: number | null
          show_on_landing?: boolean | null
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      global_email_templates: {
        Row: {
          body: string
          enabled: boolean
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          body: string
          enabled?: boolean
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          enabled?: boolean
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      global_smtp_settings: {
        Row: {
          created_at: string
          enabled: boolean
          host: string
          id: number
          min_interval: number | null
          password_encrypted: string | null
          port: number | null
          sender_email: string
          sender_name: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          host?: string
          id?: number
          min_interval?: number | null
          password_encrypted?: string | null
          port?: number | null
          sender_email?: string
          sender_name?: string
          updated_at?: string | null
          username?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          host?: string
          id?: number
          min_interval?: number | null
          password_encrypted?: string | null
          port?: number | null
          sender_email?: string
          sender_name?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          bucket: string | null
          code: string | null
          createdAt: string
          durationValue: number | null
          endDate: string
          goalType: string
          id: string
          milestones: Json | null
          name: string
          plans: Json | null
          purpose: string
          startDate: string
          title: string | null
          updatedAt: string | null
          user_id: string | null
        }
        Insert: {
          bucket?: string | null
          code?: string | null
          createdAt?: string
          durationValue?: number | null
          endDate?: string
          goalType?: string
          id?: string
          milestones?: Json | null
          name?: string
          plans?: Json | null
          purpose?: string
          startDate: string
          title?: string | null
          updatedAt?: string | null
          user_id?: string | null
        }
        Update: {
          bucket?: string | null
          code?: string | null
          createdAt?: string
          durationValue?: number | null
          endDate?: string
          goalType?: string
          id?: string
          milestones?: Json | null
          name?: string
          plans?: Json | null
          purpose?: string
          startDate?: string
          title?: string | null
          updatedAt?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      habits: {
        Row: {
          bucket: string | null
          code: string | null
          createdAt: string
          daysOfWeek: Json | null
          endDate: string | null
          endTime: string
          id: string
          name: string
          purpose: string | null
          startDate: string | null
          startTime: string
          updatedAt: string | null
          user_id: string | null
        }
        Insert: {
          bucket?: string | null
          code?: string | null
          createdAt?: string
          daysOfWeek?: Json | null
          endDate?: string | null
          endTime: string
          id?: string
          name: string
          purpose?: string | null
          startDate?: string | null
          startTime: string
          updatedAt?: string | null
          user_id?: string | null
        }
        Update: {
          bucket?: string | null
          code?: string | null
          createdAt?: string
          daysOfWeek?: Json | null
          endDate?: string | null
          endTime?: string
          id?: string
          name?: string
          purpose?: string | null
          startDate?: string | null
          startTime?: string
          updatedAt?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      landing_page_settings: {
        Row: {
          desktop_gallery: Json
          desktop_video_url: string
          id: number
          maintenance_mode: boolean
          mobile_gallery: Json
          mobile_video_url: string
          updated_at: string
        }
        Insert: {
          desktop_gallery?: Json
          desktop_video_url?: string
          id?: number
          maintenance_mode?: boolean
          mobile_gallery?: Json
          mobile_video_url?: string
          updated_at?: string
        }
        Update: {
          desktop_gallery?: Json
          desktop_video_url?: string
          id?: number
          maintenance_mode?: boolean
          mobile_gallery?: Json
          mobile_video_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      missed_tasks: {
        Row: {
          createdAt: string
          daysOfWeek: Json
          description: string | null
          endTime: string
          id: string
          name: string
          startTime: string
          user_id: string
        }
        Insert: {
          createdAt?: string
          daysOfWeek?: Json
          description?: string | null
          endTime: string
          id?: string
          name: string
          startTime: string
          user_id?: string
        }
        Update: {
          createdAt?: string
          daysOfWeek?: Json
          description?: string | null
          endTime?: string
          id?: string
          name?: string
          startTime?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_sent_log: {
        Row: {
          id: string
          notification_tag: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_tag: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_tag?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_profession: string | null
          dob: string | null
          energy_peak_time: string | null
          focus_ability: string | null
          full_name: string | null
          id: string
          is_personalized: boolean | null
          notification_prefs: Json | null
          notifications: Json | null
          payhere_customer_id: string | null
          payhere_subscription_id: string | null
          plan_day: string | null
          plan_end_time: string | null
          plan_start_time: string | null
          primary_life_focus: string | null
          sleep_duration: string | null
          sleep_start: string | null
          subscription_amount: number | null
          subscription_status: string | null
          task_shifting_ability: string | null
          updated_at: string | null
          user_id: string
          week_start: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_profession?: string | null
          dob?: string | null
          energy_peak_time?: string | null
          focus_ability?: string | null
          full_name?: string | null
          id?: string
          is_personalized?: boolean | null
          notification_prefs?: Json | null
          notifications?: Json | null
          payhere_customer_id?: string | null
          payhere_subscription_id?: string | null
          plan_day?: string | null
          plan_end_time?: string | null
          plan_start_time?: string | null
          primary_life_focus?: string | null
          sleep_duration?: string | null
          sleep_start?: string | null
          subscription_amount?: number | null
          subscription_status?: string | null
          task_shifting_ability?: string | null
          updated_at?: string | null
          user_id: string
          week_start?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_profession?: string | null
          dob?: string | null
          energy_peak_time?: string | null
          focus_ability?: string | null
          full_name?: string | null
          id?: string
          is_personalized?: boolean | null
          notification_prefs?: Json | null
          notifications?: Json | null
          payhere_customer_id?: string | null
          payhere_subscription_id?: string | null
          plan_day?: string | null
          plan_end_time?: string | null
          plan_start_time?: string | null
          primary_life_focus?: string | null
          sleep_duration?: string | null
          sleep_start?: string | null
          subscription_amount?: number | null
          subscription_status?: string | null
          task_shifting_ability?: string | null
          updated_at?: string | null
          user_id?: string
          week_start?: string | null
        }
        Relationships: []
      }
      user_stats_cache: {
        Row: {
          bio_sync: Json
          consistency_grade: string
          habit_heatmap: Json
          predictive_burnout_warning: string | null
          top_goal: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio_sync?: Json
          consistency_grade?: string
          habit_heatmap?: Json
          predictive_burnout_warning?: string | null
          top_goal?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio_sync?: Json
          consistency_grade?: string
          habit_heatmap?: Json
          predictive_burnout_warning?: string | null
          top_goal?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vault_notes: {
        Row: {
          category: string
          content: string
          createdAt: string
          id: string
          is_pinned: boolean | null
          source_page: string | null
          tags: Json | null
          title: string
          updatedAt: string | null
          user_id: string
        }
        Insert: {
          category?: string
          content?: string
          createdAt?: string
          id?: string
          is_pinned?: boolean | null
          source_page?: string | null
          tags?: Json | null
          title?: string
          updatedAt?: string | null
          user_id?: string
        }
        Update: {
          category?: string
          content?: string
          createdAt?: string
          id?: string
          is_pinned?: boolean | null
          source_page?: string | null
          tags?: Json | null
          title?: string
          updatedAt?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vault_reminders: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_active: boolean | null
          next_fire: string
          note_id: string
          remind_at: string | null
          repeat_type: string
          snooze_count: number | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          next_fire: string
          note_id: string
          remind_at?: string | null
          repeat_type?: string
          snooze_count?: number | null
          title: string
          user_id?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          next_fire?: string
          note_id?: string
          remind_at?: string | null
          repeat_type?: string
          snooze_count?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_reminders_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "vault_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      week_plans: {
        Row: {
          bucket_actions: Json | null
          createdAt: string
          id: string
          state: Json
          user_id: string | null
          week: string
        }
        Insert: {
          bucket_actions?: Json | null
          createdAt?: string
          id?: string
          state: Json
          user_id?: string | null
          week: string
        }
        Update: {
          bucket_actions?: Json | null
          createdAt?: string
          id?: string
          state?: Json
          user_id?: string | null
          week?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_notification_logs: { Args: never; Returns: undefined }
      get_admin_user_activity: {
        Args: never
        Returns: {
          completed_days_count: number
          created_at: string
          email: string
          full_name: string
          goals_count: number
          habits_count: number
          is_personalized: boolean
          last_active_at: string
          recent_goals: Json
          user_id: string
          week_plans_count: number
        }[]
      }
      get_decrypted_smtp_password: {
        Args: { p_encryption_key: string }
        Returns: string
      }
      get_global_smtp_settings: {
        Args: never
        Returns: {
          enabled: boolean
          has_password: boolean
          host: string
          min_interval: number
          port: number
          sender_email: string
          sender_name: string
          username: string
        }[]
      }
      save_global_smtp_settings: {
        Args: {
          p_enabled: boolean
          p_encryption_key: string
          p_host: string
          p_min_interval: number
          p_password: string
          p_port: number
          p_sender_email: string
          p_sender_name: string
          p_username: string
        }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
A new version of Supabase CLI is available: v2.115.0 (currently installed v2.105.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
