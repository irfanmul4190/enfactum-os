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
      activities: {
        Row: {
          activity_id: string
          activity_type: Database["public"]["Enums"]["activity_type"] | null
          approved_budget: number
          assigned_pmm_id: string | null
          assigned_to: string | null
          bu: Database["public"]["Enums"]["business_unit"]
          bu_array: string[] | null
          claim_deadline: string | null
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          execution_end_date: string | null
          execution_start_date: string | null
          fiscal_quarter: string | null
          funding_source: Database["public"]["Enums"]["funding_source"]
          hp_approval_email_url: string | null
          id: string
          market: string
          name: string
          partner_id: string | null
          pbm_names: string[] | null
          pdg_synced: boolean | null
          project_id: string | null
          project_lead_id: string | null
          status: Database["public"]["Enums"]["activity_status"]
          status_v3: Database["public"]["Enums"]["activity_status_v3"] | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          approved_budget: number
          assigned_pmm_id?: string | null
          assigned_to?: string | null
          bu: Database["public"]["Enums"]["business_unit"]
          bu_array?: string[] | null
          claim_deadline?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          execution_end_date?: string | null
          execution_start_date?: string | null
          fiscal_quarter?: string | null
          funding_source: Database["public"]["Enums"]["funding_source"]
          hp_approval_email_url?: string | null
          id?: string
          market: string
          name: string
          partner_id?: string | null
          pbm_names?: string[] | null
          pdg_synced?: boolean | null
          project_id?: string | null
          project_lead_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          status_v3?: Database["public"]["Enums"]["activity_status_v3"] | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          approved_budget?: number
          assigned_pmm_id?: string | null
          assigned_to?: string | null
          bu?: Database["public"]["Enums"]["business_unit"]
          bu_array?: string[] | null
          claim_deadline?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          execution_end_date?: string | null
          execution_start_date?: string | null
          fiscal_quarter?: string | null
          funding_source?: Database["public"]["Enums"]["funding_source"]
          hp_approval_email_url?: string | null
          id?: string
          market?: string
          name?: string
          partner_id?: string | null
          pbm_names?: string[] | null
          pdg_synced?: boolean | null
          project_id?: string | null
          project_lead_id?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          status_v3?: Database["public"]["Enums"]["activity_status_v3"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_stakeholders: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          stakeholder_email: string | null
          stakeholder_name: string
          stakeholder_role: string
          user_id: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          stakeholder_email?: string | null
          stakeholder_name: string
          stakeholder_role: string
          user_id?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          stakeholder_email?: string | null
          stakeholder_name?: string
          stakeholder_role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_stakeholders_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_timeline: {
        Row: {
          activity_id: string
          created_at: string
          created_by: string | null
          event_date: string
          event_description: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_id: string
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_description: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_id?: string
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_timeline_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_vendors: {
        Row: {
          activity_id: string
          budget_allocation: number | null
          created_at: string
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["vendor_role"]
          vendor_id: string
        }
        Insert: {
          activity_id: string
          budget_allocation?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["vendor_role"]
          vendor_id: string
        }
        Update: {
          activity_id?: string
          budget_allocation?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["vendor_role"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_vendors_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          activity_id: string
          created_at: string
          current_tier: number
          director_approved: boolean | null
          director_approved_at: string | null
          id: string
          ops_approved: boolean | null
          ops_approved_at: string | null
          pdg_synced: boolean | null
          project_lead_approved: boolean | null
          project_lead_approved_at: string | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          current_tier?: number
          director_approved?: boolean | null
          director_approved_at?: string | null
          id?: string
          ops_approved?: boolean | null
          ops_approved_at?: string | null
          pdg_synced?: boolean | null
          project_lead_approved?: boolean | null
          project_lead_approved_at?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          current_tier?: number
          director_approved?: boolean | null
          director_approved_at?: string | null
          id?: string
          ops_approved?: boolean | null
          ops_approved_at?: string | null
          pdg_synced?: boolean | null
          project_lead_approved?: boolean | null
          project_lead_approved_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contract_url: string | null
          created_at: string
          funding_source: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          market: string
          name: string
          updated_at: string
        }
        Insert: {
          contract_url?: string | null
          created_at?: string
          funding_source?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market: string
          name: string
          updated_at?: string
        }
        Update: {
          contract_url?: string | null
          created_at?: string
          funding_source?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      creative_approvals: {
        Row: {
          activity_id: string
          asset_name: string
          asset_type: string
          asset_url: string | null
          created_at: string
          id: string
          priority: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          revision_notes: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          asset_name: string
          asset_type: string
          asset_url?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          revision_notes?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          asset_name?: string
          asset_type?: string
          asset_url?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          revision_notes?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_approvals_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      financials: {
        Row: {
          activity_id: string
          actual_cost: number | null
          approved_budget: number
          claim_deadline: string | null
          created_at: string
          currency: string
          deviation_explanation: string | null
          id: string
          poc_required: boolean | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          actual_cost?: number | null
          approved_budget: number
          claim_deadline?: string | null
          created_at?: string
          currency?: string
          deviation_explanation?: string | null
          id?: string
          poc_required?: boolean | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          actual_cost?: number | null
          approved_budget?: number
          claim_deadline?: string | null
          created_at?: string
          currency?: string
          deviation_explanation?: string | null
          id?: string
          poc_required?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financials_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          brand_assets_url: string | null
          brand_guidelines_uploaded: boolean | null
          created_at: string
          id: string
          logo_url: string | null
          market: string
          meta_pixel_id: string | null
          name: string
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          type: Database["public"]["Enums"]["partner_type"]
          updated_at: string
        }
        Insert: {
          brand_assets_url?: string | null
          brand_guidelines_uploaded?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          market: string
          meta_pixel_id?: string | null
          name: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          type: Database["public"]["Enums"]["partner_type"]
          updated_at?: string
        }
        Update: {
          brand_assets_url?: string | null
          brand_guidelines_uploaded?: boolean | null
          created_at?: string
          id?: string
          logo_url?: string | null
          market?: string
          meta_pixel_id?: string | null
          name?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          type?: Database["public"]["Enums"]["partner_type"]
          updated_at?: string
        }
        Relationships: []
      }
      poe_records: {
        Row: {
          activity_id: string
          checklist_type: string
          comments: string | null
          created_at: string
          file_url: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          sku_list: Json | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          weekly_sales_reports: Json | null
        }
        Insert: {
          activity_id: string
          checklist_type: string
          comments?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku_list?: Json | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          weekly_sales_reports?: Json | null
        }
        Update: {
          activity_id?: string
          checklist_type?: string
          comments?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku_list?: Json | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          weekly_sales_reports?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "poe_records_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      poe_submissions: {
        Row: {
          activity_id: string
          category: Database["public"]["Enums"]["poe_category"]
          checklist_json: Json
          created_at: string
          file_attachments: Json | null
          id: string
          ops_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["poe_status"]
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          activity_id: string
          category: Database["public"]["Enums"]["poe_category"]
          checklist_json?: Json
          created_at?: string
          file_attachments?: Json | null
          id?: string
          ops_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["poe_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: string
          category?: Database["public"]["Enums"]["poe_category"]
          checklist_json?: Json
          created_at?: string
          file_attachments?: Json | null
          id?: string
          ops_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["poe_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poe_submissions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          team: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          team?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          team?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          market: string
          name: string
          project_lead_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          market: string
          name: string
          project_lead_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          market?: string
          name?: string
          project_lead_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_lead_id_fkey"
            columns: ["project_lead_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          created_by: string | null
          display_order: number
          drive_link: string | null
          file_type: Database["public"]["Enums"]["resource_file_type"]
          id: string
          is_partner_facing: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          created_by?: string | null
          display_order?: number
          drive_link?: string | null
          file_type?: Database["public"]["Enums"]["resource_file_type"]
          id?: string
          is_partner_facing?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          created_by?: string | null
          display_order?: number
          drive_link?: string | null
          file_type?: Database["public"]["Enums"]["resource_file_type"]
          id?: string
          is_partner_facing?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_approve_poe: boolean | null
          can_delete_activity: boolean | null
          can_edit_budget: boolean | null
          can_mark_paid: boolean | null
          can_view_all_regions: boolean | null
          can_view_margin: boolean | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          can_approve_poe?: boolean | null
          can_delete_activity?: boolean | null
          can_edit_budget?: boolean | null
          can_mark_paid?: boolean | null
          can_view_all_regions?: boolean | null
          can_view_margin?: boolean | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          can_approve_poe?: boolean | null
          can_delete_activity?: boolean | null
          can_edit_budget?: boolean | null
          can_mark_paid?: boolean | null
          can_view_all_regions?: boolean | null
          can_view_margin?: boolean | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accessible_regions: string[] | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          role: string
          team: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessible_regions?: string[] | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          role?: string
          team: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessible_regions?: string[] | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: string
          team?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          market_access: string[] | null
          partner_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          market_access?: string[] | null
          partner_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          market_access?: string[] | null
          partner_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          brand_guidelines_uploaded: boolean | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          market: string
          meta_pixel_id: string | null
          name: string
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          phone: string | null
          services: string[] | null
          type: Database["public"]["Enums"]["vendor_type"]
          updated_at: string
        }
        Insert: {
          brand_guidelines_uploaded?: boolean | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market: string
          meta_pixel_id?: string | null
          name: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          phone?: string | null
          services?: string[] | null
          type: Database["public"]["Enums"]["vendor_type"]
          updated_at?: string
        }
        Update: {
          brand_guidelines_uploaded?: boolean | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market?: string
          meta_pixel_id?: string | null
          name?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          phone?: string | null
          services?: string[] | null
          type?: Database["public"]["Enums"]["vendor_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_markets: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_status:
        | "Not Started"
        | "Planning"
        | "Executing"
        | "Completed"
        | "Claiming"
        | "POE Submitted"
        | "Paid"
      activity_status_v2:
        | "Briefing"
        | "Alignment"
        | "Executing"
        | "POE Collection"
        | "Review"
        | "Synced"
      activity_status_v3:
        | "Not Start"
        | "Planning"
        | "Executing"
        | "Activity Completed"
        | "Claiming"
        | "POE Submitted"
        | "Payment Documentation"
        | "Payment Submitted"
        | "Paid"
      activity_type:
        | "Digital Paid Media and Broadcast"
        | "Sales Incentives"
        | "Events and Training"
        | "Telemarketing"
        | "Print Marketing"
        | "Customer Assessment"
        | "Digital Amplifier"
        | "In-Store Fixture"
        | "Retail Product Packaging"
        | "Retail Activation & Merchandising"
        | "e-Tail Vendor Service"
      app_role:
        | "Agency Director"
        | "Ops"
        | "Project Lead"
        | "PMM"
        | "PBM"
        | "Partner"
        | "Super Admin"
      business_unit:
        | "PC"
        | "Print"
        | "HPS"
        | "Workstation"
        | "Consumer"
        | "Commercial"
      funding_source: "HP" | "Intel" | "AMD" | "Mixed"
      onboarding_status: "Pending" | "In Progress" | "Complete"
      partner_type: "Distributor" | "Reseller"
      poe_category:
        | "Event"
        | "Digital"
        | "Incentive"
        | "Retail"
        | "Training"
        | "Content"
      poe_status: "Pending" | "Approved" | "Rejected"
      project_status: "Draft" | "Active" | "Completed" | "On Hold"
      resource_category:
        | "MDF Contracts"
        | "Brand Guidelines"
        | "Strategic Assets"
        | "Alliance Partners"
        | "General Resources"
      resource_file_type:
        | "pdf"
        | "sheets"
        | "slides"
        | "docs"
        | "folder"
        | "other"
      vendor_role: "Primary" | "Secondary" | "Support"
      vendor_type:
        | "Distributor"
        | "Reseller"
        | "Agency"
        | "Event Company"
        | "Print House"
        | "Digital Agency"
        | "Media Agency"
        | "Production House"
        | "Other"
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
      activity_status: [
        "Not Started",
        "Planning",
        "Executing",
        "Completed",
        "Claiming",
        "POE Submitted",
        "Paid",
      ],
      activity_status_v2: [
        "Briefing",
        "Alignment",
        "Executing",
        "POE Collection",
        "Review",
        "Synced",
      ],
      activity_status_v3: [
        "Not Start",
        "Planning",
        "Executing",
        "Activity Completed",
        "Claiming",
        "POE Submitted",
        "Payment Documentation",
        "Payment Submitted",
        "Paid",
      ],
      activity_type: [
        "Digital Paid Media and Broadcast",
        "Sales Incentives",
        "Events and Training",
        "Telemarketing",
        "Print Marketing",
        "Customer Assessment",
        "Digital Amplifier",
        "In-Store Fixture",
        "Retail Product Packaging",
        "Retail Activation & Merchandising",
        "e-Tail Vendor Service",
      ],
      app_role: [
        "Agency Director",
        "Ops",
        "Project Lead",
        "PMM",
        "PBM",
        "Partner",
        "Super Admin",
      ],
      business_unit: [
        "PC",
        "Print",
        "HPS",
        "Workstation",
        "Consumer",
        "Commercial",
      ],
      funding_source: ["HP", "Intel", "AMD", "Mixed"],
      onboarding_status: ["Pending", "In Progress", "Complete"],
      partner_type: ["Distributor", "Reseller"],
      poe_category: [
        "Event",
        "Digital",
        "Incentive",
        "Retail",
        "Training",
        "Content",
      ],
      poe_status: ["Pending", "Approved", "Rejected"],
      project_status: ["Draft", "Active", "Completed", "On Hold"],
      resource_category: [
        "MDF Contracts",
        "Brand Guidelines",
        "Strategic Assets",
        "Alliance Partners",
        "General Resources",
      ],
      resource_file_type: [
        "pdf",
        "sheets",
        "slides",
        "docs",
        "folder",
        "other",
      ],
      vendor_role: ["Primary", "Secondary", "Support"],
      vendor_type: [
        "Distributor",
        "Reseller",
        "Agency",
        "Event Company",
        "Print House",
        "Digital Agency",
        "Media Agency",
        "Production House",
        "Other",
      ],
    },
  },
} as const
