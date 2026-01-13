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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      Chatyou_leadsProspectaIA: {
        Row: {
          created_at: string
          disparo: string | null
          empresa: string | null
          especialidades: string | null
          id: number
          rating: string | null
          resumo_lead: string | null
          review: string | null
          site: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          disparo?: string | null
          empresa?: string | null
          especialidades?: string | null
          id?: number
          rating?: string | null
          resumo_lead?: string | null
          review?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          disparo?: string | null
          empresa?: string | null
          especialidades?: string | null
          id?: number
          rating?: string | null
          resumo_lead?: string | null
          review?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      João_LeadsProspectaIA: {
        Row: {
          created_at: string
          disparo: string | null
          empresa: string | null
          especialidades: string | null
          id: number
          mensagem_inicial: string | null
          rating: string | null
          resumo_lead: string | null
          review: string | null
          site: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          disparo?: string | null
          empresa?: string | null
          especialidades?: string | null
          id?: number
          mensagem_inicial?: string | null
          rating?: string | null
          resumo_lead?: string | null
          review?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          disparo?: string | null
          empresa?: string | null
          especialidades?: string | null
          id?: number
          mensagem_inicial?: string | null
          rating?: string | null
          resumo_lead?: string | null
          review?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          empresa: string
          endereco: string | null
          especialidades: string | null
          has_email: boolean | null
          has_whatsapp: boolean | null
          id: string
          rating: string | null
          resumo_lead: string | null
          review_count: string | null
          search_id: string | null
          site: string | null
          status: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          empresa: string
          endereco?: string | null
          especialidades?: string | null
          has_email?: boolean | null
          has_whatsapp?: boolean | null
          id?: string
          rating?: string | null
          resumo_lead?: string | null
          review_count?: string | null
          search_id?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          empresa?: string
          endereco?: string | null
          especialidades?: string | null
          has_email?: boolean | null
          has_whatsapp?: boolean | null
          id?: string
          rating?: string | null
          resumo_lead?: string | null
          review_count?: string | null
          search_id?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "search_history"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      Romilto_LeadsProspectaIA: {
        Row: {
          created_at: string
          disparo: string | null
          empresa: string | null
          especialidades: string | null
          id: number
          mensagem_inicial: string | null
          rating: string | null
          resumo_lead: string | null
          review: string | null
          site: string | null
          status: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          disparo?: string | null
          empresa?: string | null
          especialidades?: string | null
          id: number
          mensagem_inicial?: string | null
          rating?: string | null
          resumo_lead?: string | null
          review?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          disparo?: string | null
          empresa?: string | null
          especialidades?: string | null
          id?: number
          mensagem_inicial?: string | null
          rating?: string | null
          resumo_lead?: string | null
          review?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          category: string | null
          company_id: string
          created_at: string
          credits_used: number | null
          id: string
          location: string | null
          query: string
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string
          credits_used?: number | null
          id?: string
          location?: string | null
          query: string
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string
          credits_used?: number | null
          id?: string
          location?: string | null
          query?: string
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string
          credits_monthly_limit: number
          credits_remaining: number
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_active: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          trial_used: boolean
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          credits_monthly_limit?: number
          credits_remaining?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          trial_used?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          credits_monthly_limit?: number
          credits_remaining?: number
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          trial_used?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "company_owner" | "admin" | "member"
      subscription_plan: "demo" | "starter" | "professional" | "enterprise"
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
      app_role: ["super_admin", "company_owner", "admin", "member"],
      subscription_plan: ["demo", "starter", "professional", "enterprise"],
    },
  },
} as const
