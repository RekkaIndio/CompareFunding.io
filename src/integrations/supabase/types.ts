export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounting_integrations: {
        Row: {
          access_token: string | null
          auth_status: Database["public"]["Enums"]["integration_status"]
          business_id: string
          created_at: string
          id: string
          last_sync_at: string | null
          next_sync_at: string | null
          oauth_metadata: Json | null
          provider: Database["public"]["Enums"]["integration_provider"]
          provider_account_id: string | null
          refresh_token: string | null
          sync_frequency: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          auth_status?: Database["public"]["Enums"]["integration_status"]
          business_id: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          oauth_metadata?: Json | null
          provider: Database["public"]["Enums"]["integration_provider"]
          provider_account_id?: string | null
          refresh_token?: string | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          auth_status?: Database["public"]["Enums"]["integration_status"]
          business_id?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          oauth_metadata?: Json | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          provider_account_id?: string | null
          refresh_token?: string | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "accounting_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businessess"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_integrations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["business_id"]
          },
        ]
      }
      applications: {
        Row: {
          accounting_integration_id: string | null
          application_date: string
          application_number: string | null
          business_id: string
          created_at: string
          expires_at: string | null
          financials: Json | null
          has_personal_guarantee: boolean | null
          id: string
          internal_notes: string | null
          internal_score: number | null
          is_secured: boolean | null
          loan_amount: number
          loan_term_months: number
          loan_type: Database["public"]["Enums"]["loan_type"]
          matched_lenders: string[] | null
          metadata: Json | null
          notified_lenders: string[] | null
          purpose: string
          purpose_category: string | null
          risk_assessment: Json | null
          status: Database["public"]["Enums"]["application_status"]
          status_updated_at: string
          updated_at: string
          viewed_by_lenders: string[] | null
        }
        Insert: {
          accounting_integration_id?: string | null
          application_date?: string
          application_number?: string | null
          business_id: string
          created_at?: string
          expires_at?: string | null
          financials?: Json | null
          has_personal_guarantee?: boolean | null
          id?: string
          internal_notes?: string | null
          internal_score?: number | null
          is_secured?: boolean | null
          loan_amount: number
          loan_term_months: number
          loan_type?: Database["public"]["Enums"]["loan_type"]
          matched_lenders?: string[] | null
          metadata?: Json | null
          notified_lenders?: string[] | null
          purpose: string
          purpose_category?: string | null
          risk_assessment?: Json | null
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          updated_at?: string
          viewed_by_lenders?: string[] | null
        }
        Update: {
          accounting_integration_id?: string | null
          application_date?: string
          application_number?: string | null
          business_id?: string
          created_at?: string
          expires_at?: string | null
          financials?: Json | null
          has_personal_guarantee?: boolean | null
          id?: string
          internal_notes?: string | null
          internal_score?: number | null
          is_secured?: boolean | null
          loan_amount?: number
          loan_term_months?: number
          loan_type?: Database["public"]["Enums"]["loan_type"]
          matched_lenders?: string[] | null
          metadata?: Json | null
          notified_lenders?: string[] | null
          purpose?: string
          purpose_category?: string | null
          risk_assessment?: Json | null
          status?: Database["public"]["Enums"]["application_status"]
          status_updated_at?: string
          updated_at?: string
          viewed_by_lenders?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "applications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businessess"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["business_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businessess: {
        Row: {
          address: Json | null
          annual_profit: number | null
          annual_revenue: number | null
          business_name: string
          city: string | null
          company_number: string | null
          company_size: string | null
          company_type: string | null
          country: string | null
          created_at: string
          credit_score: number | null
          credit_score_date: string | null
          description: string | null
          director_names: string[] | null
          has_ccj: boolean | null
          id: string
          incorporation_date: string | null
          industry_sector: string | null
          industry_sic_code: string | null
          metadata: Json | null
          postal_code: string | null
          updated_at: string
          website: string | null
          years_trading: number | null
        }
        Insert: {
          address?: Json | null
          annual_profit?: number | null
          annual_revenue?: number | null
          business_name: string
          city?: string | null
          company_number?: string | null
          company_size?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          credit_score?: number | null
          credit_score_date?: string | null
          description?: string | null
          director_names?: string[] | null
          has_ccj?: boolean | null
          id: string
          incorporation_date?: string | null
          industry_sector?: string | null
          industry_sic_code?: string | null
          metadata?: Json | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
          years_trading?: number | null
        }
        Update: {
          address?: Json | null
          annual_profit?: number | null
          annual_revenue?: number | null
          business_name?: string
          city?: string | null
          company_number?: string | null
          company_size?: string | null
          company_type?: string | null
          country?: string | null
          created_at?: string
          credit_score?: number | null
          credit_score_date?: string | null
          description?: string | null
          director_names?: string[] | null
          has_ccj?: boolean | null
          id?: string
          incorporation_date?: string | null
          industry_sector?: string | null
          industry_sic_code?: string | null
          metadata?: Json | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
          years_trading?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businessess_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          lender_id: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          stripe_payment_id: string | null
          transaction_type: Database["public"]["Enums"]["credit_transaction_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          lender_id: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          stripe_payment_id?: string | null
          transaction_type: Database["public"]["Enums"]["credit_transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          lender_id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          stripe_payment_id?: string | null
          transaction_type?: Database["public"]["Enums"]["credit_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["lender_id"]
          },
          {
            foreignKeyName: "credit_transactions_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string | null
          content_type: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size: number | null
          id: string
          is_verified: boolean | null
          metadata: Json | null
          name: string
          owner_id: string
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          application_id?: string | null
          content_type?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_path: string
          file_size?: number | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          name: string
          owner_id: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          application_id?: string | null
          content_type?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_path?: string
          file_size?: number | null
          id?: string
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_data: {
        Row: {
          business_id: string
          created_at: string
          data: Json
          data_type: string
          id: string
          integration_id: string | null
          key_metrics: Json | null
          period_end: string
          period_start: string
          source: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          data: Json
          data_type: string
          id?: string
          integration_id?: string | null
          key_metrics?: Json | null
          period_end: string
          period_start: string
          source: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          data?: Json
          data_type?: string
          id?: string
          integration_id?: string | null
          key_metrics?: Json | null
          period_end?: string
          period_start?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_data_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "financial_data_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businessess"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_data_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "financial_data_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "accounting_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_billing: {
        Row: {
          auto_renew: boolean | null
          billing_email: string | null
          created_at: string
          credits_balance: number | null
          credits_used: number | null
          id: string
          last_payment_date: string | null
          lender_id: string | null
          next_payment_date: string | null
          payment_method_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          billing_email?: string | null
          created_at?: string
          credits_balance?: number | null
          credits_used?: number | null
          id?: string
          last_payment_date?: string | null
          lender_id?: string | null
          next_payment_date?: string | null
          payment_method_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          billing_email?: string | null
          created_at?: string
          credits_balance?: number | null
          credits_used?: number | null
          id?: string
          last_payment_date?: string | null
          lender_id?: string | null
          next_payment_date?: string | null
          payment_method_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lender_billing_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["lender_id"]
          },
          {
            foreignKeyName: "lender_billing_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_profiles: {
        Row: {
          address: Json | null
          city: string | null
          company_number: string | null
          country: string | null
          created_at: string
          description: string | null
          excluded_industries: string[] | null
          fca_reference_number: string | null
          geographic_coverage: string[] | null
          id: string
          is_active: boolean | null
          lender_name: string
          lender_type: string | null
          loan_types: Database["public"]["Enums"]["loan_type"][]
          logo_url: string | null
          max_loan_amount: number | null
          max_term_months: number | null
          metadata: Json | null
          min_annual_revenue: number | null
          min_credit_score: number | null
          min_loan_amount: number | null
          min_term_months: number | null
          min_years_trading: number | null
          postal_code: string | null
          preferred_industries: string[] | null
          requires_personal_guarantee: boolean | null
          requires_security: boolean | null
          typical_interest_rate_range: Json | null
          typical_terms: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          city?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          excluded_industries?: string[] | null
          fca_reference_number?: string | null
          geographic_coverage?: string[] | null
          id: string
          is_active?: boolean | null
          lender_name: string
          lender_type?: string | null
          loan_types?: Database["public"]["Enums"]["loan_type"][]
          logo_url?: string | null
          max_loan_amount?: number | null
          max_term_months?: number | null
          metadata?: Json | null
          min_annual_revenue?: number | null
          min_credit_score?: number | null
          min_loan_amount?: number | null
          min_term_months?: number | null
          min_years_trading?: number | null
          postal_code?: string | null
          preferred_industries?: string[] | null
          requires_personal_guarantee?: boolean | null
          requires_security?: boolean | null
          typical_interest_rate_range?: Json | null
          typical_terms?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          city?: string | null
          company_number?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          excluded_industries?: string[] | null
          fca_reference_number?: string | null
          geographic_coverage?: string[] | null
          id?: string
          is_active?: boolean | null
          lender_name?: string
          lender_type?: string | null
          loan_types?: Database["public"]["Enums"]["loan_type"][]
          logo_url?: string | null
          max_loan_amount?: number | null
          max_term_months?: number | null
          metadata?: Json | null
          min_annual_revenue?: number | null
          min_credit_score?: number | null
          min_loan_amount?: number | null
          min_term_months?: number | null
          min_years_trading?: number | null
          postal_code?: string | null
          preferred_industries?: string[] | null
          requires_personal_guarantee?: boolean | null
          requires_security?: boolean | null
          typical_interest_rate_range?: Json | null
          typical_terms?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lender_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          application_id: string
          apr: number | null
          arrangement_fee: number | null
          business_notes: string | null
          conditions: string[] | null
          created_at: string
          expiry_date: string
          id: string
          interest_rate: number
          lender_id: string
          lender_notes: string | null
          metadata: Json | null
          monthly_payment: number | null
          offer_number: string | null
          offered_amount: number
          offered_term_months: number
          requires_personal_guarantee: boolean | null
          requires_security: boolean | null
          status: Database["public"]["Enums"]["offer_status"]
          status_updated_at: string
          total_repayment: number | null
          updated_at: string
        }
        Insert: {
          application_id: string
          apr?: number | null
          arrangement_fee?: number | null
          business_notes?: string | null
          conditions?: string[] | null
          created_at?: string
          expiry_date: string
          id?: string
          interest_rate: number
          lender_id: string
          lender_notes?: string | null
          metadata?: Json | null
          monthly_payment?: number | null
          offer_number?: string | null
          offered_amount: number
          offered_term_months: number
          requires_personal_guarantee?: boolean | null
          requires_security?: boolean | null
          status?: Database["public"]["Enums"]["offer_status"]
          status_updated_at?: string
          total_repayment?: number | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          apr?: number | null
          arrangement_fee?: number | null
          business_notes?: string | null
          conditions?: string[] | null
          created_at?: string
          expiry_date?: string
          id?: string
          interest_rate?: number
          lender_id?: string
          lender_notes?: string | null
          metadata?: Json | null
          monthly_payment?: number | null
          offer_number?: string | null
          offered_amount?: number
          offered_term_months?: number
          requires_personal_guarantee?: boolean | null
          requires_security?: boolean | null
          status?: Database["public"]["Enums"]["offer_status"]
          status_updated_at?: string
          total_repayment?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "business_applications"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "offers_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lender_offers"
            referencedColumns: ["lender_id"]
          },
          {
            foreignKeyName: "offers_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_applications: {
        Row: {
          annual_revenue: number | null
          application_date: string | null
          application_id: string | null
          application_number: string | null
          business_id: string | null
          business_name: string | null
          credit_score: number | null
          expires_at: string | null
          incorporation_date: string | null
          industry_sector: string | null
          loan_amount: number | null
          loan_term_months: number | null
          loan_type: Database["public"]["Enums"]["loan_type"] | null
          purpose: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          years_trading: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businessess_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_offers: {
        Row: {
          application_id: string | null
          application_number: string | null
          business_id: string | null
          business_name: string | null
          expiry_date: string | null
          interest_rate: number | null
          lender_id: string | null
          lender_name: string | null
          offer_id: string | null
          offer_number: string | null
          offered_amount: number | null
          offered_at: string | null
          offered_term_months: number | null
          requested_amount: number | null
          requested_term: number | null
          status: Database["public"]["Enums"]["offer_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "businessess_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_profiles_id_fkey"
            columns: ["lender_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      match_application_to_lenders: {
        Args: {
          application_id: string
        }
        Returns: string[]
      }
    }
    Enums: {
      application_status:
        | "draft"
        | "submitted"
        | "matching"
        | "matched"
        | "in_review"
        | "approved"
        | "funded"
        | "rejected"
        | "cancelled"
        | "expired"
      credit_transaction_type:
        | "purchase"
        | "subscription_renewal"
        | "offer_placement"
        | "refund"
        | "expiry"
        | "bonus"
        | "admin_adjustment"
      document_type:
        | "financial_statement"
        | "bank_statement"
        | "company_registration"
        | "tax_return"
        | "accounting_data"
        | "business_plan"
        | "invoice"
        | "other"
      integration_provider: "xero" | "quickbooks"
      integration_status: "active" | "disconnected" | "error" | "pending"
      loan_type:
        | "term_loan"
        | "invoice_financing"
        | "line_of_credit"
        | "asset_finance"
        | "working_capital"
        | "bridge_loan"
      notification_type:
        | "new_application"
        | "new_offer"
        | "offer_accepted"
        | "offer_rejected"
        | "application_update"
        | "credits_low"
        | "payment_success"
        | "payment_failure"
        | "account_update"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "withdrawn"
      subscription_tier:
        | "none"
        | "basic"
        | "standard"
        | "premium"
        | "enterprise"
      user_role: "business" | "lender" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
