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
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          org_id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          org_id: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          org_id?: string
          performed_by?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          filename: string
          id: string
          mime_type: string | null
          note_id: string | null
          org_id: string
          participant_id: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          mime_type?: string | null
          note_id?: string | null
          org_id: string
          participant_id?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string | null
          note_id?: string | null
          org_id?: string
          participant_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
          visit_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          assigned_worker_id: string | null
          assigned_worker_name: string | null
          cancellation_reason: string | null
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          location: string | null
          location_address: string | null
          location_source: string
          notes: string | null
          org_id: string
          participant_id: string
          service_type: string
          staff_id: string | null
          starts_at: string
          status: string
          support_category: string | null
          support_item_code: string | null
          updated_at: string
        }
        Insert: {
          assigned_worker_id?: string | null
          assigned_worker_name?: string | null
          cancellation_reason?: string | null
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          location?: string | null
          location_address?: string | null
          location_source?: string
          notes?: string | null
          org_id: string
          participant_id: string
          service_type?: string
          staff_id?: string | null
          starts_at: string
          status?: string
          support_category?: string | null
          support_item_code?: string | null
          updated_at?: string
        }
        Update: {
          assigned_worker_id?: string | null
          assigned_worker_name?: string | null
          cancellation_reason?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          location?: string | null
          location_address?: string | null
          location_source?: string
          notes?: string | null
          org_id?: string
          participant_id?: string
          service_type?: string
          staff_id?: string | null
          starts_at?: string
          status?: string
          support_category?: string | null
          support_item_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_support_category_fkey"
            columns: ["support_category"]
            isOneToOne: false
            referencedRelation: "ndis_support_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          end_date: string
          id: string
          org_id: string
          provider_id: string
          start_date: string
          status: string
          title: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          org_id: string
          provider_id: string
          start_date: string
          status?: string
          title: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          org_id?: string
          provider_id?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          approved_by: string | null
          category: string
          created_at: string
          id: string
          invoice_number: string
          line_count: number
          notes: string | null
          org_id: string
          paid_at: string | null
          participant_id: string | null
          provider_id: string | null
          received_at: string
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string
          id?: string
          invoice_number: string
          line_count?: number
          notes?: string | null
          org_id: string
          paid_at?: string | null
          participant_id?: string | null
          provider_id?: string | null
          received_at?: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string
          created_at?: string
          id?: string
          invoice_number?: string
          line_count?: number
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          participant_id?: string | null
          provider_id?: string | null
          received_at?: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          booking_id: string | null
          channel: string
          created_at: string
          direction: string
          id: string
          org_id: string
          participant_id: string
          recipient: string | null
          sent_by: string | null
          sent_by_name: string | null
          status: string
          subject: string | null
          template_key: string | null
          visit_id: string | null
        }
        Insert: {
          body?: string
          booking_id?: string | null
          channel?: string
          created_at?: string
          direction?: string
          id?: string
          org_id: string
          participant_id: string
          recipient?: string | null
          sent_by?: string | null
          sent_by_name?: string | null
          status?: string
          subject?: string | null
          template_key?: string | null
          visit_id?: string | null
        }
        Update: {
          body?: string
          booking_id?: string | null
          channel?: string
          created_at?: string
          direction?: string
          id?: string
          org_id?: string
          participant_id?: string
          recipient?: string | null
          sent_by?: string | null
          sent_by_name?: string | null
          status?: string
          subject?: string | null
          template_key?: string | null
          visit_id?: string | null
        }
        Relationships: []
      }
      ndis_support_categories: {
        Row: {
          budget_bucket: string
          code: string
          name: string
          sort_order: number
        }
        Insert: {
          budget_bucket: string
          code: string
          name: string
          sort_order?: number
        }
        Update: {
          budget_bucket?: string
          code?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          note_type: string
          org_id: string
          participant_id: string
          template_key: string | null
          title: string | null
          updated_at: string
          visit_id: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          note_type?: string
          org_id: string
          participant_id: string
          template_key?: string | null
          title?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          note_type?: string
          org_id?: string
          participant_id?: string
          template_key?: string | null
          title?: string | null
          updated_at?: string
          visit_id?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          id: string
          name: string
          ndis_number: string
          org_id: string
          phone: string | null
          plan_end: string | null
          plan_start: string | null
          status: string
          total_budget: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          name: string
          ndis_number: string
          org_id: string
          phone?: string | null
          plan_end?: string | null
          plan_start?: string | null
          status?: string
          total_budget?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          name?: string
          ndis_number?: string
          org_id?: string
          phone?: string | null
          plan_end?: string | null
          plan_start?: string | null
          status?: string
          total_budget?: number
          updated_at?: string
        }
        Relationships: []
      }
      plan_budget_categories: {
        Row: {
          budget: number
          code: string
          created_at: string
          id: string
          name: string
          org_id: string
          participant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          budget?: number
          code?: string
          created_at?: string
          id?: string
          name: string
          org_id: string
          participant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          budget?: number
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          participant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          abn: string
          address: string | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          org_id: string
          phone: string | null
          registration: string
          services: string[]
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          abn: string
          address?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          org_id: string
          phone?: string | null
          registration?: string
          services?: string[]
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          abn?: string
          address?: string | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          org_id?: string
          phone?: string | null
          registration?: string
          services?: string[]
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      service_agreements: {
        Row: {
          approved_at: string | null
          cancellation_policy: string | null
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          items: Json
          org_id: string
          participant_id: string
          start_date: string
          status: string
          title: string
          total_value: number
          travel_policy: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          cancellation_policy?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          items?: Json
          org_id: string
          participant_id: string
          start_date: string
          status?: string
          title: string
          total_value?: number
          travel_policy?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          cancellation_policy?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          items?: Json
          org_id?: string
          participant_id?: string
          start_date?: string
          status?: string
          title?: string
          total_value?: number
          travel_policy?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          bank_acct_last3: string | null
          bank_bsb_last3: string | null
          bookable: boolean
          contracted_hours_per_week: number | null
          created_at: string
          date_of_birth: string | null
          drivers_licence_no: string | null
          email: string | null
          employment_type: string
          end_date: string | null
          first_aid_expiry: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          mobile: string | null
          ndis_worker_screening_no: string | null
          notes: string | null
          org_id: string
          phone: string | null
          postcode: string | null
          preferred_name: string | null
          screening_expiry: string | null
          start_date: string | null
          state: string | null
          status: string
          suburb: string | null
          super_fund: string | null
          tfn_last4: string | null
          updated_at: string
          vehicle_available: boolean
          working_with_children_no: string | null
          wwc_expiry: string | null
        }
        Insert: {
          address?: string | null
          bank_acct_last3?: string | null
          bank_bsb_last3?: string | null
          bookable?: boolean
          contracted_hours_per_week?: number | null
          created_at?: string
          date_of_birth?: string | null
          drivers_licence_no?: string | null
          email?: string | null
          employment_type?: string
          end_date?: string | null
          first_aid_expiry?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          mobile?: string | null
          ndis_worker_screening_no?: string | null
          notes?: string | null
          org_id: string
          phone?: string | null
          postcode?: string | null
          preferred_name?: string | null
          screening_expiry?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          suburb?: string | null
          super_fund?: string | null
          tfn_last4?: string | null
          updated_at?: string
          vehicle_available?: boolean
          working_with_children_no?: string | null
          wwc_expiry?: string | null
        }
        Update: {
          address?: string | null
          bank_acct_last3?: string | null
          bank_bsb_last3?: string | null
          bookable?: boolean
          contracted_hours_per_week?: number | null
          created_at?: string
          date_of_birth?: string | null
          drivers_licence_no?: string | null
          email?: string | null
          employment_type?: string
          end_date?: string | null
          first_aid_expiry?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          mobile?: string | null
          ndis_worker_screening_no?: string | null
          notes?: string | null
          org_id?: string
          phone?: string | null
          postcode?: string | null
          preferred_name?: string | null
          screening_expiry?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          suburb?: string | null
          super_fund?: string | null
          tfn_last4?: string | null
          updated_at?: string
          vehicle_available?: boolean
          working_with_children_no?: string | null
          wwc_expiry?: string | null
        }
        Relationships: []
      }
      staff_availability: {
        Row: {
          created_at: string
          day_of_week: number
          effective_from: string | null
          effective_to: string | null
          ends_time: string
          id: string
          kind: string
          org_id: string
          staff_id: string
          starts_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          effective_from?: string | null
          effective_to?: string | null
          ends_time: string
          id?: string
          kind?: string
          org_id: string
          staff_id: string
          starts_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          effective_from?: string | null
          effective_to?: string | null
          ends_time?: string
          id?: string
          kind?: string
          org_id?: string
          staff_id?: string
          starts_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_availability_exception: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          kind: string
          org_id: string
          reason: string | null
          staff_id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          kind?: string
          org_id: string
          reason?: string | null
          staff_id: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          kind?: string
          org_id?: string
          reason?: string | null
          staff_id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_exception_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_skills: {
        Row: {
          certified_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          org_id: string
          proficiency: string
          staff_id: string
          support_category: string
          updated_at: string
        }
        Insert: {
          certified_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id: string
          proficiency?: string
          staff_id: string
          support_category: string
          updated_at?: string
        }
        Update: {
          certified_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id?: string
          proficiency?: string
          staff_id?: string
          support_category?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_skills_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_support_category_fkey"
            columns: ["support_category"]
            isOneToOne: false
            referencedRelation: "ndis_support_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      visits: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          booking_id: string
          created_at: string
          exception_reason: string | null
          id: string
          notes_submitted: boolean
          org_id: string
          participant_id: string
          participant_signature_name: string | null
          participant_signed: boolean
          participant_signed_at: string | null
          scheduled_end: string
          scheduled_start: string
          status: string
          updated_at: string
          worker_id: string | null
          worker_name: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          booking_id: string
          created_at?: string
          exception_reason?: string | null
          id?: string
          notes_submitted?: boolean
          org_id: string
          participant_id: string
          participant_signature_name?: string | null
          participant_signed?: boolean
          participant_signed_at?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string
          updated_at?: string
          worker_id?: string | null
          worker_name?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          booking_id?: string
          created_at?: string
          exception_reason?: string | null
          id?: string
          notes_submitted?: boolean
          org_id?: string
          participant_id?: string
          participant_signature_name?: string | null
          participant_signed?: boolean
          participant_signed_at?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          updated_at?: string
          worker_id?: string | null
          worker_name?: string | null
        }
        Relationships: []
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
