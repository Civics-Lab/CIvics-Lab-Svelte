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
      business_addresses: {
        Row: {
          business_id: string | null
          city: string
          created_at: string | null
          id: string
          secondary_street_address: string | null
          state_id: string | null
          status: Database["public"]["Enums"]["contact_address_status"] | null
          street_address: string
          updated_at: string | null
          zip_code_id: string | null
        }
        Insert: {
          business_id?: string | null
          city: string
          created_at?: string | null
          id?: string
          secondary_street_address?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["contact_address_status"] | null
          street_address: string
          updated_at?: string | null
          zip_code_id?: string | null
        }
        Update: {
          business_id?: string | null
          city?: string
          created_at?: string | null
          id?: string
          secondary_street_address?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["contact_address_status"] | null
          street_address?: string
          updated_at?: string | null
          zip_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_addresses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "active_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addresses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addresses_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addresses_zip_code_id_fkey"
            columns: ["zip_code_id"]
            isOneToOne: false
            referencedRelation: "zip_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      business_employees: {
        Row: {
          business_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["business_employee_status"] | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          status?:
            | Database["public"]["Enums"]["business_employee_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          status?:
            | Database["public"]["Enums"]["business_employee_status"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "active_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_employees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_employees_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_phone_numbers: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          phone_number: string
          status: Database["public"]["Enums"]["contact_phone_status"] | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          phone_number: string
          status?: Database["public"]["Enums"]["contact_phone_status"] | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          phone_number?: string
          status?: Database["public"]["Enums"]["contact_phone_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_phone_numbers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "active_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_phone_numbers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_social_media_accounts: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          service_type: Database["public"]["Enums"]["social_media_service"]
          social_media_account: string
          status: Database["public"]["Enums"]["social_media_status"] | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          service_type: Database["public"]["Enums"]["social_media_service"]
          social_media_account: string
          status?: Database["public"]["Enums"]["social_media_status"] | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          service_type?: Database["public"]["Enums"]["social_media_service"]
          social_media_account?: string
          status?: Database["public"]["Enums"]["social_media_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_social_media_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "active_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_social_media_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_tags: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          tag: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          tag: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          tag?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "active_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_views: {
        Row: {
          addresses: boolean | null
          business_name: boolean | null
          created_at: string | null
          employees: boolean | null
          filters: Json | null
          id: string
          phone_numbers: boolean | null
          social_media_accounts: boolean | null
          sorting: Json | null
          updated_at: string | null
          view_name: string
          workspace_id: string | null
        }
        Insert: {
          addresses?: boolean | null
          business_name?: boolean | null
          created_at?: string | null
          employees?: boolean | null
          filters?: Json | null
          id?: string
          phone_numbers?: boolean | null
          social_media_accounts?: boolean | null
          sorting?: Json | null
          updated_at?: string | null
          view_name: string
          workspace_id?: string | null
        }
        Update: {
          addresses?: boolean | null
          business_name?: boolean | null
          created_at?: string | null
          employees?: boolean | null
          filters?: Json | null
          id?: string
          phone_numbers?: boolean | null
          social_media_accounts?: boolean | null
          sorting?: Json | null
          updated_at?: string | null
          view_name?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_views_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_name: string
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["business_status"] | null
          updated_at: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_addresses: {
        Row: {
          city: string
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          secondary_street_address: string | null
          state_id: string | null
          status: Database["public"]["Enums"]["contact_address_status"] | null
          street_address: string
          updated_at: string | null
          updated_by: string | null
          zip_code_id: string | null
        }
        Insert: {
          city: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          secondary_street_address?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["contact_address_status"] | null
          street_address: string
          updated_at?: string | null
          updated_by?: string | null
          zip_code_id?: string | null
        }
        Update: {
          city?: string
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          secondary_street_address?: string | null
          state_id?: string | null
          status?: Database["public"]["Enums"]["contact_address_status"] | null
          street_address?: string
          updated_at?: string | null
          updated_by?: string | null
          zip_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_addresses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_addresses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_addresses_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_addresses_zip_code_id_fkey"
            columns: ["zip_code_id"]
            isOneToOne: false
            referencedRelation: "zip_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_emails: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          status: Database["public"]["Enums"]["contact_email_status"] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          status?: Database["public"]["Enums"]["contact_email_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          status?: Database["public"]["Enums"]["contact_email_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_phone_numbers: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          phone_number: string
          status: Database["public"]["Enums"]["contact_phone_status"] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          phone_number: string
          status?: Database["public"]["Enums"]["contact_phone_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          phone_number?: string
          status?: Database["public"]["Enums"]["contact_phone_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_phone_numbers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_phone_numbers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_phones: {
        Row: {
          contact_id: string
          created_at: string | null
          created_by: string | null
          id: string
          number: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          number: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          number?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_phones_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_phones_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_social_media_accounts: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          service_type: Database["public"]["Enums"]["social_media_service"]
          social_media_account: string
          status: Database["public"]["Enums"]["social_media_status"] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          service_type: Database["public"]["Enums"]["social_media_service"]
          social_media_account: string
          status?: Database["public"]["Enums"]["social_media_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          service_type?: Database["public"]["Enums"]["social_media_service"]
          social_media_account?: string
          status?: Database["public"]["Enums"]["social_media_status"] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_social_media_accounts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_social_media_accounts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          tag: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          tag: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          tag?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_views: {
        Row: {
          addresses: boolean | null
          created_at: string | null
          created_by: string | null
          emails: boolean | null
          filters: Json | null
          first_name: boolean | null
          gender: boolean | null
          id: string
          last_name: boolean | null
          middle_name: boolean | null
          phone_numbers: boolean | null
          pronouns: boolean | null
          race: boolean | null
          social_media_accounts: boolean | null
          sorting: Json | null
          updated_at: string | null
          vanid: boolean | null
          view_name: string
          workspace_id: string | null
        }
        Insert: {
          addresses?: boolean | null
          created_at?: string | null
          created_by?: string | null
          emails?: boolean | null
          filters?: Json | null
          first_name?: boolean | null
          gender?: boolean | null
          id?: string
          last_name?: boolean | null
          middle_name?: boolean | null
          phone_numbers?: boolean | null
          pronouns?: boolean | null
          race?: boolean | null
          social_media_accounts?: boolean | null
          sorting?: Json | null
          updated_at?: string | null
          vanid?: boolean | null
          view_name: string
          workspace_id?: string | null
        }
        Update: {
          addresses?: boolean | null
          created_at?: string | null
          created_by?: string | null
          emails?: boolean | null
          filters?: Json | null
          first_name?: boolean | null
          gender?: boolean | null
          id?: string
          last_name?: boolean | null
          middle_name?: boolean | null
          phone_numbers?: boolean | null
          pronouns?: boolean | null
          race?: boolean | null
          social_media_accounts?: boolean | null
          sorting?: Json | null
          updated_at?: string | null
          vanid?: boolean | null
          view_name?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_views_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          created_by: string | null
          first_name: string
          gender_id: string | null
          id: string
          last_name: string
          middle_name: string | null
          pronouns: string | null
          race_id: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          updated_at: string | null
          updated_by: string | null
          vanid: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          first_name: string
          gender_id?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          pronouns?: string | null
          race_id?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          vanid?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          first_name?: string
          gender_id?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          pronouns?: string | null
          race_id?: string | null
          status?: Database["public"]["Enums"]["contact_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          vanid?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_gender_id_fkey"
            columns: ["gender_id"]
            isOneToOne: false
            referencedRelation: "genders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          created_at: string | null
          id: string
          name: string
          state_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          state_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          state_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counties_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          business_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["donation_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["donation_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["donation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "active_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      genders: {
        Row: {
          created_at: string | null
          gender: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gender: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gender?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      races: {
        Row: {
          created_at: string | null
          id: string
          race: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          race: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          race?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      states: {
        Row: {
          abbreviation: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          abbreviation: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_workspaces: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["workspace_role"] | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"] | null
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"] | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_date: string
          status: string
          stripe_payment_id: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          payment_date: string
          status: string
          stripe_payment_id: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_date?: string
          status?: string
          stripe_payment_id?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subscriptions: {
        Row: {
          billing_cycle_end: string
          billing_cycle_start: string
          created_at: string | null
          id: string
          plan: string
          status: string
          stripe_subscription_id: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          billing_cycle_end: string
          billing_cycle_start: string
          created_at?: string | null
          id?: string
          plan: string
          status: string
          stripe_subscription_id: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      zip_codes: {
        Row: {
          county_id: string | null
          created_at: string | null
          id: string
          name: string
          state_id: string | null
          updated_at: string | null
        }
        Insert: {
          county_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          state_id?: string | null
          updated_at?: string | null
        }
        Update: {
          county_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          state_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zip_codes_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zip_codes_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_businesses: {
        Row: {
          business_name: string | null
          created_at: string | null
          id: string | null
          status: Database["public"]["Enums"]["business_status"] | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          id?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      active_contacts: {
        Row: {
          created_at: string | null
          first_name: string | null
          gender_id: string | null
          gender_name: string | null
          id: string | null
          last_name: string | null
          middle_name: string | null
          pronouns: string | null
          race_id: string | null
          race_name: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          updated_at: string | null
          vanid: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_gender_id_fkey"
            columns: ["gender_id"]
            isOneToOne: false
            referencedRelation: "genders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      business_full_addresses: {
        Row: {
          business_id: string | null
          business_name: string | null
          city: string | null
          county_name: string | null
          created_at: string | null
          id: string | null
          secondary_street_address: string | null
          state_abbreviation: string | null
          state_id: string | null
          state_name: string | null
          status: Database["public"]["Enums"]["contact_address_status"] | null
          street_address: string | null
          updated_at: string | null
          zip_code: string | null
          zip_code_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_addresses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "active_businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addresses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addresses_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_addresses_zip_code_id_fkey"
            columns: ["zip_code_id"]
            isOneToOne: false
            referencedRelation: "zip_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_full_addresses: {
        Row: {
          city: string | null
          contact_id: string | null
          county_name: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          secondary_street_address: string | null
          state_abbreviation: string | null
          state_id: string | null
          state_name: string | null
          status: Database["public"]["Enums"]["contact_address_status"] | null
          street_address: string | null
          updated_at: string | null
          zip_code: string | null
          zip_code_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_addresses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "active_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_addresses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_addresses_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_addresses_zip_code_id_fkey"
            columns: ["zip_code_id"]
            isOneToOne: false
            referencedRelation: "zip_codes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_business_details: {
        Args: {
          business_uuid: string
        }
        Returns: {
          business_id: string
          business_name: string
          status: Database["public"]["Enums"]["business_status"]
          addresses: Json
          phone_numbers: Json
          social_media: Json
          employees: Json
          tags: Json
        }[]
      }
      get_contact_details: {
        Args: {
          contact_uuid: string
        }
        Returns: {
          contact_id: string
          full_name: string
          race: string
          gender: string
          pronouns: string
          vanid: string
          status: Database["public"]["Enums"]["contact_status"]
          emails: Json
          phone_numbers: Json
          addresses: Json
          social_media: Json
          tags: Json
        }[]
      }
      get_contact_emails_by_workspace: {
        Args: {
          workspace_id_param: string
        }
        Returns: {
          id: string
          contact_id: string
          email: string
          status: string
        }[]
      }
      get_contact_phones_by_workspace: {
        Args: {
          workspace_id_param: string
        }
        Returns: {
          id: string
          contact_id: string
          number: string
          status: string
        }[]
      }
      get_contacts_by_workspace: {
        Args: {
          workspace_id_param: string
        }
        Returns: {
          created_at: string | null
          created_by: string | null
          first_name: string
          gender_id: string | null
          id: string
          last_name: string
          middle_name: string | null
          pronouns: string | null
          race_id: string | null
          status: Database["public"]["Enums"]["contact_status"] | null
          updated_at: string | null
          updated_by: string | null
          vanid: string | null
          workspace_id: string | null
        }[]
      }
      get_views_by_workspace: {
        Args: {
          workspace_id_param: string
        }
        Returns: {
          addresses: boolean | null
          created_at: string | null
          created_by: string | null
          emails: boolean | null
          filters: Json | null
          first_name: boolean | null
          gender: boolean | null
          id: string
          last_name: boolean | null
          middle_name: boolean | null
          phone_numbers: boolean | null
          pronouns: boolean | null
          race: boolean | null
          social_media_accounts: boolean | null
          sorting: Json | null
          updated_at: string | null
          vanid: boolean | null
          view_name: string
          workspace_id: string | null
        }[]
      }
    }
    Enums: {
      business_employee_status: "active" | "inactive" | "fired" | "suspended"
      business_status: "active" | "inactive" | "closed"
      contact_address_status: "active" | "inactive" | "moved" | "wrong address"
      contact_email_status: "active" | "inactive" | "bounced" | "unsubscribed"
      contact_phone_status:
        | "active"
        | "inactive"
        | "wrong number"
        | "disconnected"
      contact_status: "active" | "inactive" | "deceased" | "moved"
      donation_status: "promise" | "donated" | "processing" | "cleared"
      social_media_service:
        | "facebook"
        | "twitter"
        | "bluesky"
        | "tiktok"
        | "instagram"
        | "threads"
        | "youtube"
      social_media_status: "active" | "inactive" | "blocked" | "deleted"
      workspace_role: "Super Admin" | "Admin" | "Basic User" | "Volunteer"
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
