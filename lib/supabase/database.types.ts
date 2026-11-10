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
      auto_reply_exclusions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          label: string | null
          phone: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          label?: string | null
          phone: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          label?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_reply_exclusions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address_line: string | null
          auto_reply_enabled: boolean
          call_forwarding_confirmed_at: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          greeting_intro: string | null
          greeting_voice: string | null
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
          phone_number: string | null
          phone_number_sid: string | null
          postal_code: string | null
          quote_message: string | null
          region: Database["public"]["Enums"]["region"] | null
          share_capital_cents: number | null
          siret: string | null
          sms_sender_approved: boolean
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
          auto_reply_enabled?: boolean
          call_forwarding_confirmed_at?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          greeting_intro?: string | null
          greeting_voice?: string | null
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
          phone_number?: string | null
          phone_number_sid?: string | null
          postal_code?: string | null
          quote_message?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          share_capital_cents?: number | null
          siret?: string | null
          sms_sender_approved?: boolean
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
          auto_reply_enabled?: boolean
          call_forwarding_confirmed_at?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          greeting_intro?: string | null
          greeting_voice?: string | null
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
          phone_number?: string | null
          phone_number_sid?: string | null
          postal_code?: string | null
          quote_message?: string | null
          region?: Database["public"]["Enums"]["region"] | null
          share_capital_cents?: number | null
          siret?: string | null
          sms_sender_approved?: boolean
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
      invoice_lines: {
        Row: {
          category: Database["public"]["Enums"]["quote_line_category"]
          company_id: string
          created_at: string
          designation: string
          id: string
          invoice_id: string
          position: number
          quantity: number
          unit: string
          unit_price_cents: number | null
          vat_rate_bp: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["quote_line_category"]
          company_id: string
          created_at?: string
          designation: string
          id?: string
          invoice_id: string
          position: number
          quantity: number
          unit: string
          unit_price_cents?: number | null
          vat_rate_bp?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["quote_line_category"]
          company_id?: string
          created_at?: string
          designation?: string
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          unit?: string
          unit_price_cents?: number | null
          vat_rate_bp?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_company_id_fkey"
            columns: ["invoice_id", "company_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          company_snapshot: Json | null
          created_at: string
          customer_address: string | null
          customer_name: string | null
          deposit_received_cents: number
          id: string
          issued_at: string | null
          notes: string | null
          number: string | null
          paid_at: string | null
          payment_due_days: number
          public_token: string
          quote_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents: number
          title: string | null
          total_cents: number
          updated_at: string
          vat_cents: number
          work_completed_on: string | null
        }
        Insert: {
          company_id: string
          company_snapshot?: Json | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          deposit_received_cents?: number
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string | null
          paid_at?: string | null
          payment_due_days?: number
          public_token?: string
          quote_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          title?: string | null
          total_cents?: number
          updated_at?: string
          vat_cents?: number
          work_completed_on?: string | null
        }
        Update: {
          company_id?: string
          company_snapshot?: Json | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          deposit_received_cents?: number
          id?: string
          issued_at?: string | null
          notes?: string | null
          number?: string | null
          paid_at?: string | null
          payment_due_days?: number
          public_token?: string
          quote_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          title?: string | null
          total_cents?: number
          updated_at?: string
          vat_cents?: number
          work_completed_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_company_id_fkey"
            columns: ["quote_id", "company_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      missed_calls: {
        Row: {
          call_sid: string
          caller_phone: string | null
          company_id: string
          created_at: string
          id: string
          request_id: string | null
          sms_sid: string | null
          sms_status: string
        }
        Insert: {
          call_sid: string
          caller_phone?: string | null
          company_id: string
          created_at?: string
          id?: string
          request_id?: string | null
          sms_sid?: string | null
          sms_status?: string
        }
        Update: {
          call_sid?: string
          caller_phone?: string | null
          company_id?: string
          created_at?: string
          id?: string
          request_id?: string | null
          sms_sid?: string | null
          sms_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "missed_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missed_calls_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      price_items: {
        Row: {
          category: Database["public"]["Enums"]["quote_line_category"]
          company_id: string
          created_at: string
          designation: string
          designation_key: string | null
          id: string
          last_used_at: string | null
          unit: string
          unit_price_cents: number
          updated_at: string
          use_count: number
          vat_rate_bp: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["quote_line_category"]
          company_id: string
          created_at?: string
          designation: string
          designation_key?: string | null
          id?: string
          last_used_at?: string | null
          unit: string
          unit_price_cents: number
          updated_at?: string
          use_count?: number
          vat_rate_bp?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["quote_line_category"]
          company_id?: string
          created_at?: string
          designation?: string
          designation_key?: string | null
          id?: string
          last_used_at?: string | null
          unit?: string
          unit_price_cents?: number
          updated_at?: string
          use_count?: number
          vat_rate_bp?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_lines: {
        Row: {
          category: Database["public"]["Enums"]["quote_line_category"]
          company_id: string
          created_at: string
          designation: string
          id: string
          position: number
          quantity: number
          quote_id: string
          unit: string
          unit_price_cents: number | null
          vat_rate_bp: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["quote_line_category"]
          company_id: string
          created_at?: string
          designation: string
          id?: string
          position: number
          quantity: number
          quote_id: string
          unit: string
          unit_price_cents?: number | null
          vat_rate_bp?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["quote_line_category"]
          company_id?: string
          created_at?: string
          designation?: string
          id?: string
          position?: number
          quantity?: number
          quote_id?: string
          unit?: string
          unit_price_cents?: number | null
          vat_rate_bp?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_quote_id_company_id_fkey"
            columns: ["quote_id", "company_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      quotes: {
        Row: {
          ai_notes: string | null
          company_id: string
          company_snapshot: Json | null
          created_at: string
          customer_address: string | null
          customer_name: string | null
          deposit_cents: number | null
          deposit_paid_at: string | null
          deposit_percent: number | null
          id: string
          notes: string | null
          number: string | null
          public_token: string
          request_id: string
          sent_at: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal_cents: number
          title: string | null
          total_cents: number
          updated_at: string
          validity_days: number
          vat_cents: number
          waste_management: string | null
          work_duration: string | null
          work_start_date: string | null
        }
        Insert: {
          ai_notes?: string | null
          company_id: string
          company_snapshot?: Json | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          deposit_percent?: number | null
          id?: string
          notes?: string | null
          number?: string | null
          public_token?: string
          request_id: string
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          title?: string | null
          total_cents?: number
          updated_at?: string
          validity_days?: number
          vat_cents?: number
          waste_management?: string | null
          work_duration?: string | null
          work_start_date?: string | null
        }
        Update: {
          ai_notes?: string | null
          company_id?: string
          company_snapshot?: Json | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          deposit_percent?: number | null
          id?: string
          notes?: string | null
          number?: string | null
          public_token?: string
          request_id?: string
          sent_at?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          title?: string | null
          total_cents?: number
          updated_at?: string
          validity_days?: number
          vat_cents?: number
          waste_management?: string | null
          work_duration?: string | null
          work_start_date?: string | null
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
      rate_limit_buckets: {
        Row: {
          hits: number
          key: string
          window_started_at: string
        }
        Insert: {
          hits?: number
          key: string
          window_started_at?: string
        }
        Update: {
          hits?: number
          key?: string
          window_started_at?: string
        }
        Relationships: []
      }
      request_links: {
        Row: {
          company_id: string
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          expires_at: string
          id: string
          request_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string
          id?: string
          request_id?: string | null
          token?: string
          used_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          expires_at?: string
          id?: string
          request_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_links_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_photos: {
        Row: {
          company_id: string
          created_at: string
          id: string
          request_id: string
          storage_path: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          request_id: string
          storage_path: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_photos_request_id_company_id_fkey"
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
          artisan_sms_status: string | null
          company_id: string
          created_at: string
          customer_name: string | null
          customer_phone: string
          description: string | null
          id: string
          source: Database["public"]["Enums"]["request_source"]
          status: Database["public"]["Enums"]["request_status"]
          submitted_at: string | null
          visit_at: string | null
        }
        Insert: {
          address?: string | null
          artisan_sms_status?: string | null
          company_id: string
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          description?: string | null
          id?: string
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          visit_at?: string | null
        }
        Update: {
          address?: string | null
          artisan_sms_status?: string | null
          company_id?: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          description?: string | null
          id?: string
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["request_status"]
          submitted_at?: string | null
          visit_at?: string | null
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
      shared_missions: {
        Row: {
          admin_note: string | null
          artisan_note: string | null
          company_id: string
          created_at: string
          id: string
          request_id: string
          status: Database["public"]["Enums"]["mission_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          artisan_note?: string | null
          company_id: string
          created_at?: string
          id?: string
          request_id: string
          status?: Database["public"]["Enums"]["mission_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          artisan_note?: string | null
          company_id?: string
          created_at?: string
          id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["mission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_missions_request_id_company_id_fkey"
            columns: ["request_id", "company_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      remember_quote_prices: {
        Args: { p_quote_id: string }
        Returns: undefined
      }
      replace_invoice_lines: {
        Args: { p_invoice_id: string; p_lines: Json }
        Returns: undefined
      }
      replace_quote_lines: {
        Args: { p_lines: Json; p_quote_id: string }
        Returns: undefined
      }
    }
    Enums: {
      invoice_status: "draft" | "issued" | "paid"
      legal_form:
        | "ei"
        | "eurl"
        | "sarl"
        | "sasu"
        | "sas"
        | "sa"
        | "snc"
        | "autre"
      mission_status: "to_place" | "in_progress" | "placed" | "abandoned"
      quote_line_category:
        | "labor"
        | "material"
        | "travel"
        | "waste"
        | "other"
        | "equipment"
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
      request_source: "missed_call" | "link"
      request_status: "new" | "quoted" | "visit_proposed" | "closed" | "shared"
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
      invoice_status: ["draft", "issued", "paid"],
      legal_form: ["ei", "eurl", "sarl", "sasu", "sas", "sa", "snc", "autre"],
      mission_status: ["to_place", "in_progress", "placed", "abandoned"],
      quote_line_category: [
        "labor",
        "material",
        "travel",
        "waste",
        "other",
        "equipment",
      ],
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
      request_source: ["missed_call", "link"],
      request_status: ["new", "quoted", "visit_proposed", "closed", "shared"],
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
