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
          country: string | null
          created_at: string
          id: string
          industry: string | null
          name: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          tier: string | null
          updated_at: string
          vendor_flags: Json
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          tier?: string | null
          updated_at?: string
          vendor_flags?: Json
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          tier?: string | null
          updated_at?: string
          vendor_flags?: Json
          website?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          account_id: string | null
          actual_close_date: string | null
          created_at: string
          currency: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          loss_reason: string | null
          mdf_amount: number | null
          mdf_eligible: boolean | null
          notes: string | null
          owner_id: string | null
          product_lines: Json
          stage: string | null
          title: string
          updated_at: string
          value: number | null
          win_probability: number | null
        }
        Insert: {
          account_id?: string | null
          actual_close_date?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          mdf_amount?: number | null
          mdf_eligible?: boolean | null
          notes?: string | null
          owner_id?: string | null
          product_lines?: Json
          stage?: string | null
          title: string
          updated_at?: string
          value?: number | null
          win_probability?: number | null
        }
        Update: {
          account_id?: string | null
          actual_close_date?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          loss_reason?: string | null
          mdf_amount?: number | null
          mdf_eligible?: boolean | null
          notes?: string | null
          owner_id?: string | null
          product_lines?: Json
          stage?: string | null
          title?: string
          updated_at?: string
          value?: number | null
          win_probability?: number | null
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
          skills: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
          skills?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
          skills?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string | null
          id: string
          module: string | null
          occurred_at: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string | null
          id?: string
          module?: string | null
          occurred_at?: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string | null
          id?: string
          module?: string | null
          occurred_at?: string
          payload?: Json
        }
        Relationships: []
      }
      account_tags: {
        Row: {
          id: string
          account_id: string | null
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          account_id?: string | null
          tag: string
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string | null
          tag?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_tags_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      vendor_attachments: {
        Row: {
          id: string
          vendor_id: string | null
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          attachment_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          attachment_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          attachment_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_attachments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          }
        ]
      }
      cm_managers: {
        Row: {
          id: string
          name: string
          email: string | null
          mobile: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          mobile?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          mobile?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cm_clients: {
        Row: {
          id: string
          manager_id: string | null
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manager_id?: string | null
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manager_id?: string | null
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_clients_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "cm_managers"
            referencedColumns: ["id"]
          }
        ]
      }
      cm_projects: {
        Row: {
          id: string
          client_id: string | null
          deal_id: string | null
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          deal_id?: string | null
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          deal_id?: string | null
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cm_clients"
            referencedColumns: ["id"]
          }
        ]
      }
      cm_documents: {
        Row: {
          id: string
          project_id: string | null
          title: string
          source: string | null
          file_path: string | null
          link_url: string | null
          file_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          title: string
          source?: string | null
          file_path?: string | null
          link_url?: string | null
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string
          source?: string | null
          file_path?: string | null
          link_url?: string | null
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cm_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      vendors: {
        Row: {
          id: string
          name: string
          country: string | null
          services: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          payment_terms: string | null
          bank_details: string | null
          website: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country?: string | null
          services?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          payment_terms?: string | null
          bank_details?: string | null
          website?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string | null
          services?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          payment_terms?: string | null
          bank_details?: string | null
          website?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      account_contacts: {
        Row: {
          id: string
          account_id: string | null
          name: string
          email: string | null
          role: string | null
          phone: string | null
          is_primary: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          account_id?: string | null
          name: string
          email?: string | null
          role?: string | null
          phone?: string | null
          is_primary?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string | null
          name?: string
          email?: string | null
          role?: string | null
          phone?: string | null
          is_primary?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      deal_documents: {
        Row: {
          id: string
          deal_id: string | null
          account_id: string | null
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id?: string | null
          account_id?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string | null
          account_id?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_documents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      cm_managers: {
        Row: {
          id: string
          name: string
          email: string
          mobile: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          mobile?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          mobile?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cm_clients: {
        Row: {
          id: string
          manager_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manager_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manager_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_clients_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "cm_managers"
            referencedColumns: ["id"]
          }
        ]
      }
      cm_projects: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "cm_clients"
            referencedColumns: ["id"]
          }
        ]
      }
      cm_documents: {
        Row: {
          id: string
          project_id: string
          title: string
          source: string
          file_path: string | null
          link_url: string | null
          file_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          source?: string
          file_path?: string | null
          link_url?: string | null
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          source?: string
          file_path?: string | null
          link_url?: string | null
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cm_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cm_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      margins: {
        Row: {
          approved: boolean
          cost_of_goods: number | null
          cost_of_services: number | null
          created_at: string
          deal_id: string
          gp_percent: number | null
          gross_profit: number | null
          id: string
          mdf_subsidy: number | null
          revenue: number | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          cost_of_goods?: number | null
          cost_of_services?: number | null
          created_at?: string
          deal_id: string
          gp_percent?: number | null
          gross_profit?: number | null
          id?: string
          mdf_subsidy?: number | null
          revenue?: number | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          cost_of_goods?: number | null
          cost_of_services?: number | null
          created_at?: string
          deal_id?: string
          gp_percent?: number | null
          gross_profit?: number | null
          id?: string
          mdf_subsidy?: number | null
          revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "margins_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margins_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "v_deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_cm_documents: {
        Row: {
          id: string | null
          title: string | null
          source: string | null
          file_path: string | null
          link_url: string | null
          file_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string | null
          updated_at: string | null
          project_id: string | null
          project_name: string | null
          client_id: string | null
          client_name: string | null
          manager_id: string | null
          manager_name: string | null
          manager_email: string | null
          manager_mobile: string | null
        }
        Relationships: []
      }
      v_deals: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_vendor_flags: Json | null
          actual_close_date: string | null
          cost_of_goods: number | null
          cost_of_services: number | null
          currency: string | null
          deal_created_at: string | null
          deal_updated_at: string | null
          description: string | null
          expected_close_date: string | null
          gp_percent: number | null
          gross_profit: number | null
          id: string | null
          industry: string | null
          margin_approved: boolean | null
          margin_gp: number | null
          margin_gp_percent: number | null
          margin_revenue: number | null
          mdf_amount: number | null
          mdf_eligible: boolean | null
          mdf_subsidy: number | null
          owner_email: string | null
          owner_id: string | null
          owner_name: string | null
          product_lines: Json | null
          revenue: number | null
          stage: string | null
          tier: string | null
          title: string | null
          value: number | null
          win_probability: number | null
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
