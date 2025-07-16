
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cost: number | null
          created_at: string
          date: string
          id: string
          impressions: number | null
          raw_data: Json | null
          revenue: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          date: string
          id?: string
          impressions?: number | null
          raw_data?: Json | null
          revenue?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          date?: string
          id?: string
          impressions?: number | null
          raw_data?: Json | null
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          platform: Database["public"]["Enums"]["platform_type"]
          platform_campaign_id: string
          platform_credential_id: string | null
          raw_data: Json | null
          status: string | null
          synced_at: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          platform: Database["public"]["Enums"]["platform_type"]
          platform_campaign_id: string
          platform_credential_id?: string | null
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: Database["public"]["Enums"]["platform_type"]
          platform_campaign_id?: string
          platform_credential_id?: string | null
          raw_data?: Json | null
          status?: string | null
          synced_at?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_platform_credential_id_fkey"
            columns: ["platform_credential_id"]
            isOneToOne: false
            referencedRelation: "platform_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_campaign_metrics: {
        Row: {
          clicks: number | null
          conversions: number | null
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          impressions: number | null
          manual_campaign_id: string
          revenue: number | null
          spent: number | null
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          date: string
          id?: string
          impressions?: number | null
          manual_campaign_id: string
          revenue?: number | null
          spent?: number | null
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          impressions?: number | null
          manual_campaign_id?: string
          revenue?: number | null
          spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_campaign_metrics_manual_campaign_id_fkey"
            columns: ["manual_campaign_id"]
            isOneToOne: false
            referencedRelation: "manual_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_campaigns: {
        Row: {
          budget: number | null
          clicks: number | null
          conversions: number | null
          created_at: string | null
          created_by: string | null
          external_id: string
          id: string
          impressions: number | null
          last_updated_at: string | null
          name: string
          notes: string | null
          platform: string
          revenue: number | null
          spent: number | null
          status: string
          team_id: string
          updated_by: string | null
        }
        Insert: {
          budget?: number | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          external_id: string
          id?: string
          impressions?: number | null
          last_updated_at?: string | null
          name: string
          notes?: string | null
          platform: string
          revenue?: number | null
          spent?: number | null
          status: string
          team_id: string
          updated_by?: string | null
        }
        Update: {
          budget?: number | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          created_by?: string | null
          external_id?: string
          id?: string
          impressions?: number | null
          last_updated_at?: string | null
          name?: string
          notes?: string | null
          platform?: string
          revenue?: number | null
          spent?: number | null
          status?: string
          team_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_campaigns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string
          id: string
          platform: string
          state: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          state: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          state?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_credentials: {
        Row: {
          access_token: string | null
          account_id: string
          account_name: string | null
          created_at: string
          created_by: string
          credentials: Json
          data: Json | null
          error_message: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token: string | null
          scope: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_id: string
          account_name?: string | null
          created_at?: string
          created_by: string
          credentials?: Json
          data?: Json | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          scope?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_id?: string
          account_name?: string | null
          created_at?: string
          created_by?: string
          credentials?: Json
          data?: Json | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          scope?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_credentials_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_count: number | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          records_processed: number | null
          started_at: string
          status: string | null
          success_count: number | null
          sync_type: string
          team_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          records_processed?: number | null
          started_at?: string
          status?: string | null
          success_count?: number | null
          sync_type: string
          team_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          records_processed?: number | null
          started_at?: string
          status?: string | null
          success_count?: number | null
          sync_type?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["user_role"]
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          master_user_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          master_user_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          master_user_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      call_edge_function: {
        Args: { function_name: string; payload?: Json }
        Returns: number
      }
      check_team_member_limit: {
        Args: { team_id_param: string }
        Returns: boolean
      }
      cleanup_old_oauth_states: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_team_for_user: {
        Args: { user_id: string }
        Returns: string
      }
      ensure_user_has_team: {
        Args: { user_id_param: string }
        Returns: string
      }
      ensure_user_team: {
        Args: { user_id: string }
        Returns: string
      }
      get_cron_job_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          jobid: number
          jobname: string
          schedule: string
          command: string
          active: boolean
          last_run: string
          last_status: string
          last_duration: unknown
        }[]
      }
      get_invitation_by_token: {
        Args: { invitation_token: string }
        Returns: Json
      }
      user_teams: {
        Args: { user_id: string }
        Returns: {
          team_id: string
        }[]
      }
      validate_token_migration: {
        Args: Record<PropertyKey, never>
        Returns: {
          platform: string
          total_count: number
          migrated_count: number
          missing_tokens: number
        }[]
      }
    }
    Enums: {
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      platform_type:
        | "facebook"
        | "google"
        | "kakao"
        | "naver"
        | "coupang"
        | "amazon"
        | "tiktok"
      user_role: "master" | "team_mate" | "viewer"
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
    Enums: {
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      platform_type: [
        "facebook",
        "google",
        "kakao",
        "naver",
        "coupang",
        "amazon",
        "tiktok",
      ],
      user_role: ["master", "team_mate", "viewer"],
    },
  },
} as const
