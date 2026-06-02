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
      accounts: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          account_id: string | null
          auto_renew: boolean
          client_signer_email: string | null
          client_signer_name: string | null
          created_at: string
          currency: string | null
          deal_id: string | null
          deliverables: Json | null
          end_date: string | null
          enfactum_signer_id: string | null
          file_url: string | null
          id: string
          internal_notes: string | null
          metadata: Json | null
          owner_id: string | null
          payment_terms: string | null
          renewal_date: string | null
          scope_summary: string | null
          signed_at: string | null
          signed_file_url: string | null
          start_date: string | null
          status: string
          title: string
          type: string
          updated_at: string
          value: number | null
        }
        Insert: {
          account_id?: string | null
          auto_renew?: boolean
          client_signer_email?: string | null
          client_signer_name?: string | null
          created_at?: string
          currency?: string | null
          deal_id?: string | null
          deliverables?: Json | null
          end_date?: string | null
          enfactum_signer_id?: string | null
          file_url?: string | null
          id?: string
          internal_notes?: string | null
          metadata?: Json | null
          owner_id?: string | null
          payment_terms?: string | null
          renewal_date?: string | null
          scope_summary?: string | null
          signed_at?: string | null
          signed_file_url?: string | null
          start_date?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          account_id?: string | null
          auto_renew?: boolean
          client_signer_email?: string | null
          client_signer_name?: string | null
          created_at?: string
          currency?: string | null
          deal_id?: string | null
          deliverables?: Json | null
          end_date?: string | null
          enfactum_signer_id?: string | null
          file_url?: string | null
          id?: string
          internal_notes?: string | null
          metadata?: Json | null
          owner_id?: string | null
          payment_terms?: string | null
          renewal_date?: string | null
          scope_summary?: string | null
          signed_at?: string | null
          signed_file_url?: string | null
          start_date?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_enfactum_signer_id_fkey"
            columns: ["enfactum_signer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string | null
          created_at: string
          id: string
          owner_id: string | null
          stage: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          stage?: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          id?: string
          owner_id?: string | null
          stage?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          module: string
          payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          module: string
          payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          module?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_save_drafts: boolean
          created_at: string
          currency: string
          date_format: string
          default_contract_duration: string
          id: string
          notify_expiring_contracts: boolean
          notify_new_assignments: boolean
          notify_status_changes: boolean
          notify_weekly_digest: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save_drafts?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          default_contract_duration?: string
          id?: string
          notify_expiring_contracts?: boolean
          notify_new_assignments?: boolean
          notify_status_changes?: boolean
          notify_weekly_digest?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save_drafts?: boolean
          created_at?: string
          currency?: string
          date_format?: string
          default_contract_duration?: string
          id?: string
          notify_expiring_contracts?: boolean
          notify_new_assignments?: boolean
          notify_status_changes?: boolean
          notify_weekly_digest?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_contracts: {
        Row: {
          account_id: string | null
          account_name: string | null
          auto_renew: boolean | null
          client_signer_email: string | null
          client_signer_name: string | null
          created_at: string | null
          currency: string | null
          deal_id: string | null
          deal_title: string | null
          deliverables: Json | null
          end_date: string | null
          enfactum_signer_id: string | null
          file_url: string | null
          id: string | null
          internal_notes: string | null
          metadata: Json | null
          owner_id: string | null
          owner_name: string | null
          payment_terms: string | null
          renewal_date: string | null
          scope_summary: string | null
          signed_at: string | null
          signed_file_url: string | null
          start_date: string | null
          status: string | null
          title: string | null
          type: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_enfactum_signer_id_fkey"
            columns: ["enfactum_signer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
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
