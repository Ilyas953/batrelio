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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address_line: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          insurance_coverage_area: string | null
          insurance_policy_number: string | null
          insurer_address: string | null
          insurer_name: string | null
          legal_form: Database["public"]["Enums"]["legal_form"] | null
          legal_name: string | null
          mediator_name: string | null
          mediator_website: string | null
          naf_code: string | null
          name: string
          owner_id: string
          postal_code: string | null
          region: Database["public"]["Enums"]["region"] | null
          share_capital_cents: number | null
          siret: string | null
          sms_sender_name: string
          terms_accepted_at: string | null
          terms_version: string | null
          trade: Database["public"]["Enums"]["trade"] | null
          updated_at: string
          vat_number: string | null
          vat_regime: Database["public"]["Enums"]["vat_regime"] | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          insurance_coverage_area?: string | null
          insurance_policy_number?: string | null
          insurer_address?: string | null
          insurer_name?: string | null
          legal_form?: Database["public"]["Enums"]["legal_form"] | null
          legal_name?: string | null
          mediator_name?: string | null
          mediator_website?: string | null
          naf_code?: string | null
          name: string
          owner_id: string
          postal_code?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          share_capital_cents?: number | null
          siret?: string | null
          sms_sender_name: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          trade?: Database["public"]["Enums"]["trade"] | null
          updated_at?: string
          vat_number?: string | null
          vat_regime?: Database["public"]["Enums"]["vat_regime"] | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          insurance_coverage_area?: string | null
          insurance_policy_number?: string | null
          insurer_address?: string | null
          insurer_name?: string | null
          legal_form?: Database["public"]["Enums"]["legal_form"] | null
          legal_name?: string | null
          mediator_name?: string | null
          mediator_website?: string | null
          naf_code?: string | null
          name?: string
          owner_id?: string
          postal_code?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          share_capital_cents?: number | null
          siret?: string | null
          sms_sender_name?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          trade?: Database["public"]["Enums"]["trade"] | null
          updated_at?: string
          vat_number?: string | null
          vat_regime?: Database["public"]["Enums"]["vat_regime"] | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          company_id: string
          created_at: string
          deposit_cents: number | null
          deposit_paid_at: string | null
          id: string
          request_id: string
          sent_at: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          total_cents: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          id?: string
          request_id: string
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          total_cents: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          id?: string
          request_id?: string
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_company_id_fkey"
            columns: ["request_id", "company_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      requests: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          customer_name: string | null
          customer_phone: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "requests_company_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      legal_form:
        | "ei"
        | "eurl"
        | "sarl"
        | "sasu"
        | "sas"
        | "sa"
        | "snc"
        | "autre"
      quote_status: "draft" | "sent" | "signed" | "declined"
      region:
        | "auvergne-rhone-alpes"
        | "bourgogne-franche-comte"
        | "bretagne"
        | "centre-val-de-loire"
        | "corse"
        | "grand-est"
        | "hauts-de-france"
        | "ile-de-france"
        | "normandie"
        | "nouvelle-aquitaine"
        | "occitanie"
        | "pays-de-la-loire"
        | "provence-alpes-cote-d-azur"
        | "guadeloupe"
        | "martinique"
        | "guyane"
        | "la-reunion"
        | "mayotte"
      request_status: "new" | "quoted" | "visit_proposed" | "closed"
      trade:
        | "couvreur"
        | "elagueur"
        | "paysagiste"
        | "plombier"
        | "chauffagiste"
        | "electricien"
        | "macon"
        | "menuisier"
        | "peintre"
        | "autre"
      vat_regime: "subject" | "franchise"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      legal_form: ["ei", "eurl", "sarl", "sasu", "sas", "sa", "snc", "autre"],
      quote_status: ["draft", "sent", "signed", "declined"],
      region: [
        "auvergne-rhone-alpes",
        "bourgogne-franche-comte",
        "bretagne",
        "centre-val-de-loire",
        "corse",
        "grand-est",
        "hauts-de-france",
        "ile-de-france",
        "normandie",
        "nouvelle-aquitaine",
        "occitanie",
        "pays-de-la-loire",
        "provence-alpes-cote-d-azur",
        "guadeloupe",
        "martinique",
        "guyane",
        "la-reunion",
        "mayotte",
      ],
      request_status: ["new", "quoted", "visit_proposed", "closed"],
      trade: [
        "couvreur",
        "elagueur",
        "paysagiste",
        "plombier",
        "chauffagiste",
        "electricien",
        "macon",
        "menuisier",
        "peintre",
        "autre",
      ],
      vat_regime: ["subject", "franchise"],
    },
  },
} as const
