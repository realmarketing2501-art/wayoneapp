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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          confirmations: number | null
          confirmed_at: string | null
          created_at: string
          from_address: string | null
          id: string
          network: string
          status: string
          to_address: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          amount: number
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string
          from_address?: string | null
          id?: string
          network?: string
          status?: string
          to_address: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          confirmations?: number | null
          confirmed_at?: string | null
          created_at?: string
          from_address?: string | null
          id?: string
          network?: string
          status?: string
          to_address?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fund_investments: {
        Row: {
          amount: number
          created_at: string
          fund_id: string
          id: string
          status: string
          total_earned: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fund_id: string
          id?: string
          status?: string
          total_earned?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fund_id?: string
          id?: string
          status?: string
          total_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_investments_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "special_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      income_records: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_plans: {
        Row: {
          created_at: string
          daily_return: number
          duration: number
          id: string
          max_invest: number
          min_invest: number
          min_level: Database["public"]["Enums"]["level_name"]
          name: string
          pool_filled: number
          pool_total: number
          status: string
        }
        Insert: {
          created_at?: string
          daily_return: number
          duration: number
          id?: string
          max_invest: number
          min_invest: number
          min_level?: Database["public"]["Enums"]["level_name"]
          name: string
          pool_filled?: number
          pool_total: number
          status?: string
        }
        Update: {
          created_at?: string
          daily_return?: number
          duration?: number
          id?: string
          max_invest?: number
          min_invest?: number
          min_level?: Database["public"]["Enums"]["level_name"]
          name?: string
          pool_filled?: number
          pool_total?: number
          status?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          days_remaining: number
          earned: number
          id: string
          plan_id: string
          plan_name: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          days_remaining: number
          earned?: number
          id?: string
          plan_id: string
          plan_name: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          days_remaining?: number
          earned?: number
          id?: string
          plan_id?: string
          plan_name?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      network_tree: {
        Row: {
          branch_position: number
          created_at: string
          id: string
          investment_amount: number | null
          is_active: boolean | null
          level: number
          parent_id: string | null
          user_id: string
        }
        Insert: {
          branch_position: number
          created_at?: string
          id?: string
          investment_amount?: number | null
          is_active?: boolean | null
          level?: number
          parent_id?: string | null
          user_id: string
        }
        Update: {
          branch_position?: number
          created_at?: string
          id?: string
          investment_amount?: number | null
          is_active?: boolean | null
          level?: number
          parent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          target_audience: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          target_audience?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          target_audience?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      popup_notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          message: string
          target_audience: string | null
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message: string
          target_audience?: string | null
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          message?: string
          target_audience?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          direct_referrals: number
          id: string
          language: string | null
          level: Database["public"]["Enums"]["level_name"]
          network_volume: number
          referral_code: string
          referred_by: string | null
          total_earned: number
          total_network: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          direct_referrals?: number
          id?: string
          language?: string | null
          level?: Database["public"]["Enums"]["level_name"]
          network_volume?: number
          referral_code: string
          referred_by?: string | null
          total_earned?: number
          total_network?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          direct_referrals?: number
          id?: string
          language?: string | null
          level?: Database["public"]["Enums"]["level_name"]
          network_volume?: number
          referral_code?: string
          referred_by?: string | null
          total_earned?: number
          total_network?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      special_funds: {
        Row: {
          badge: string
          close_date: string
          created_at: string
          duration: number
          goal: number
          id: string
          max_invest: number
          min_invest: number
          name: string
          open_date: string
          raised: number
          status: string
          total_return: number
        }
        Insert: {
          badge: string
          close_date: string
          created_at?: string
          duration: number
          goal: number
          id?: string
          max_invest: number
          min_invest: number
          name: string
          open_date: string
          raised?: number
          status?: string
          total_return: number
        }
        Update: {
          badge?: string
          close_date?: string
          created_at?: string
          duration?: number
          goal?: number
          id?: string
          max_invest?: number
          min_invest?: number
          name?: string
          open_date?: string
          raised?: number
          status?: string
          total_return?: number
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          reward: number
          title: string
          total: number
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          reward: number
          title: string
          total?: number
          type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          reward?: number
          title?: string
          total?: number
          type?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          task_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          task_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          address: string
          created_at: string
          id: string
          label: string | null
          network: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          label?: string | null
          network?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          label?: string | null
          network?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          fee: number
          id: string
          net: number
          status: string
          tx_hash: string | null
          type: string
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee: number
          id?: string
          net: number
          status?: string
          tx_hash?: string | null
          type: string
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee?: number
          id?: string
          net?: number
          status?: string
          tx_hash?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      level_name:
        | "PRE"
        | "BRONZ"
        | "SILVER"
        | "SILVER_ELITE"
        | "GOLD"
        | "ZAFFIRO"
        | "DIAMANTE"
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
    Enums: {
      app_role: ["admin", "user"],
      level_name: [
        "PRE",
        "BRONZ",
        "SILVER",
        "SILVER_ELITE",
        "GOLD",
        "ZAFFIRO",
        "DIAMANTE",
      ],
    },
  },
} as const
