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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          click_count: number
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impression_count: number
          is_active: boolean
          link_url: string | null
          position: string
          size: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_url?: string | null
          position?: string
          size?: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_url?: string | null
          position?: string
          size?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          user_id: string | null
          user_message: string
          user_session: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_message: string
          user_session: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_message?: string
          user_session?: string
        }
        Relationships: []
      }
      ai_knowledge_sources: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      announcer_privileges: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean
          privilege: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          privilege: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          privilege?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      content_comments: {
        Row: {
          body: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          author_id: string
          category: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          description: string | null
          id: string
          published_at: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          category?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          category?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      enterprise_clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          enterprise_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          enterprise_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          enterprise_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_clients_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_clients_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_invoices: {
        Row: {
          client_id: string | null
          created_at: string
          currency: string
          due_date: string | null
          enterprise_id: string
          id: string
          invoice_number: string
          issue_date: string
          items: Json
          notes: string | null
          paid_at: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          enterprise_id: string
          id?: string
          invoice_number: string
          issue_date?: string
          items?: Json
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          enterprise_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          paid_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "enterprise_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_invoices_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_invoices_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_members: {
        Row: {
          created_at: string
          enterprise_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enterprise_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enterprise_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_members_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_members_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_verified: boolean
          island: string | null
          logo_url: string | null
          name: string
          nif: string | null
          phone: string | null
          rccm: string | null
          sector: string
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean
          island?: string | null
          logo_url?: string | null
          name: string
          nif?: string | null
          phone?: string | null
          rccm?: string | null
          sector?: string
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean
          island?: string | null
          logo_url?: string | null
          name?: string
          nif?: string | null
          phone?: string | null
          rccm?: string | null
          sector?: string
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      enterprise_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          description: string
          enterprise_id: string
          id: string
          invoice_id: string | null
          payment_method: string | null
          reference: string | null
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          currency?: string
          description: string
          enterprise_id: string
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string
          enterprise_id?: string
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_transactions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_transactions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "enterprise_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          additional_info: Json | null
          created_at: string | null
          event_id: string
          id: string
          payment_amount: number | null
          payment_status: string | null
          registration_date: string | null
          status: string | null
          ticket_code: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string | null
          event_id: string
          id?: string
          payment_amount?: number | null
          payment_status?: string | null
          registration_date?: string | null
          status?: string | null
          ticket_code?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_info?: Json | null
          created_at?: string | null
          event_id?: string
          id?: string
          payment_amount?: number | null
          payment_status?: string | null
          registration_date?: string | null
          status?: string | null
          ticket_code?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          author_id: string
          capacity: number | null
          category: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          currency: string | null
          date: string
          description: string | null
          end_date: string | null
          full_content: string | null
          id: string
          images: string[] | null
          island: string
          location: string
          metadata: Json | null
          organizer: string
          price: number | null
          registered_count: number | null
          requires_payment: boolean | null
          requires_registration: boolean | null
          status: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id: string
          capacity?: number | null
          category: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          date: string
          description?: string | null
          end_date?: string | null
          full_content?: string | null
          id?: string
          images?: string[] | null
          island: string
          location: string
          metadata?: Json | null
          organizer: string
          price?: number | null
          registered_count?: number | null
          requires_payment?: boolean | null
          requires_registration?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string
          capacity?: number | null
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          end_date?: string | null
          full_content?: string | null
          id?: string
          images?: string[] | null
          island?: string
          location?: string
          metadata?: Json | null
          organizer?: string
          price?: number | null
          registered_count?: number | null
          requires_payment?: boolean | null
          requires_registration?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      freelance_jobs: {
        Row: {
          author_id: string
          budget_max: number | null
          budget_min: number | null
          category: string
          created_at: string
          currency: string
          deadline: string | null
          description: string
          id: string
          is_remote: boolean | null
          island: string | null
          location: string | null
          skills: string[] | null
          status: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          budget_max?: number | null
          budget_min?: number | null
          category: string
          created_at?: string
          currency?: string
          deadline?: string | null
          description: string
          id?: string
          is_remote?: boolean | null
          island?: string | null
          location?: string | null
          skills?: string[] | null
          status?: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string
          id?: string
          is_remote?: boolean | null
          island?: string | null
          location?: string | null
          skills?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      freelance_proposals: {
        Row: {
          cover_letter: string
          created_at: string
          currency: string
          estimated_days: number | null
          freelancer_id: string
          id: string
          job_id: string
          proposed_amount: number | null
          status: string
          updated_at: string
        }
        Insert: {
          cover_letter: string
          created_at?: string
          currency?: string
          estimated_days?: number | null
          freelancer_id: string
          id?: string
          job_id: string
          proposed_amount?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string
          created_at?: string
          currency?: string
          estimated_days?: number | null
          freelancer_id?: string
          id?: string
          job_id?: string
          proposed_amount?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelance_proposals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "freelance_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      freelance_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          job_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelance_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "freelance_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          freelancer_id: string
          id: string
          linked_user_id: string | null
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          freelancer_id: string
          id?: string
          linked_user_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          freelancer_id?: string
          id?: string
          linked_user_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      freelancer_invoices: {
        Row: {
          client_id: string | null
          created_at: string
          currency: string
          due_date: string | null
          freelancer_id: string
          id: string
          invoice_number: string
          issue_date: string
          items: Json
          linked_user_id: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          freelancer_id: string
          id?: string
          invoice_number: string
          issue_date?: string
          items?: Json
          linked_user_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          freelancer_id?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          items?: Json
          linked_user_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "freelancer_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          currency: string
          display_name: string
          experience_years: number | null
          facebook_url: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          instagram_url: string | null
          is_available: boolean
          is_visible: boolean
          island: string | null
          linkedin_url: string | null
          location: string | null
          portfolio_url: string | null
          skills: string[] | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          views: number
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string
          display_name: string
          experience_years?: number | null
          facebook_url?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          instagram_url?: string | null
          is_available?: boolean
          is_visible?: boolean
          island?: string | null
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          views?: number
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string
          display_name?: string
          experience_years?: number | null
          facebook_url?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          instagram_url?: string | null
          is_available?: boolean
          is_visible?: boolean
          island?: string | null
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          views?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      freelancer_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          description: string
          freelancer_id: string
          id: string
          invoice_id: string | null
          payment_method: string | null
          reference: string | null
          transaction_date: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          currency?: string
          description: string
          freelancer_id: string
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string
          freelancer_id?: string
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "freelancer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      gastronomy_items: {
        Row: {
          accommodation_type: string | null
          author_id: string
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string
          description: string
          dining_style: string | null
          geo_expires_at: string | null
          id: string
          images: string[] | null
          latitude: number | null
          location: string | null
          longitude: number | null
          metadata: Json | null
          price_max: number | null
          price_min: number | null
          room_types: Json | null
          service_mode: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          type: Database["public"]["Enums"]["gastronomy_type"]
          updated_at: string
          views: number
        }
        Insert: {
          accommodation_type?: string | null
          author_id: string
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description: string
          dining_style?: string | null
          geo_expires_at?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          metadata?: Json | null
          price_max?: number | null
          price_min?: number | null
          room_types?: Json | null
          service_mode?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          type: Database["public"]["Enums"]["gastronomy_type"]
          updated_at?: string
          views?: number
        }
        Update: {
          accommodation_type?: string | null
          author_id?: string
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          description?: string
          dining_style?: string | null
          geo_expires_at?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          metadata?: Json | null
          price_max?: number | null
          price_min?: number | null
          room_types?: Json | null
          service_mode?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          type?: Database["public"]["Enums"]["gastronomy_type"]
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "gastronomy_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastronomy_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users_pro_status"
            referencedColumns: ["id"]
          },
        ]
      }
      global_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          title: string
          type: Database["public"]["Enums"]["announcement_kind"]
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          title: string
          type?: Database["public"]["Enums"]["announcement_kind"]
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["announcement_kind"]
        }
        Relationships: []
      }
      homepage_categories: {
        Row: {
          created_at: string
          description: string
          featured: boolean
          icon: string
          id: string
          is_active: boolean
          link: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          featured?: boolean
          icon?: string
          id?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          featured?: boolean
          icon?: string
          id?: string
          is_active?: boolean
          link?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          config: Json | null
          id: string
          is_visible: boolean
          section_key: string
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json | null
          id?: string
          is_visible?: boolean
          section_key: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json | null
          id?: string
          is_visible?: boolean
          section_key?: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      investments: {
        Row: {
          author_id: string
          category: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          current_amount: number
          deadline: string | null
          description: string
          full_content: string | null
          id: string
          images: string[] | null
          island: string | null
          location: string | null
          min_investment: number | null
          status: string
          target_amount: number
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          description: string
          full_content?: string | null
          id?: string
          images?: string[] | null
          island?: string | null
          location?: string | null
          min_investment?: number | null
          status?: string
          target_amount?: number
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          description?: string
          full_content?: string | null
          id?: string
          images?: string[] | null
          island?: string | null
          location?: string | null
          min_investment?: number | null
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      partner_accounts: {
        Row: {
          accepted_methods: string[]
          address: string | null
          business_name: string
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          id: string
          is_visible_on_map: boolean
          island: string | null
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_reviewed_by: string | null
          kyc_status: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          opening_hours: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_methods?: string[]
          address?: string | null
          business_name: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_visible_on_map?: boolean
          island?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          opening_hours?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_methods?: string[]
          address?: string | null
          business_name?: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_visible_on_map?: boolean
          island?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          opening_hours?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_deposits: {
        Row: {
          commission_amount: number
          commission_rate: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          currency: string
          deposit_method: string
          id: string
          net_deposited: number
          notes: string | null
          partner_id: string
          reference: string | null
          status: string
          total_collected: number
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          deposit_method?: string
          id?: string
          net_deposited?: number
          notes?: string | null
          partner_id: string
          reference?: string | null
          status?: string
          total_collected: number
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          deposit_method?: string
          id?: string
          net_deposited?: number
          notes?: string | null
          partner_id?: string
          reference?: string | null
          status?: string
          total_collected?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_deposits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_deposits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          partner_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          partner_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          partner_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_kyc_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_kyc_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_settings: {
        Row: {
          azzhy_deposit_commission_rate: number
          commission_type: string
          commission_value: number
          currency: string
          id: string
          is_active: boolean
          pro_plan_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          azzhy_deposit_commission_rate?: number
          commission_type?: string
          commission_value?: number
          currency?: string
          id?: string
          is_active?: boolean
          pro_plan_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          azzhy_deposit_commission_rate?: number
          commission_type?: string
          commission_value?: number
          currency?: string
          id?: string
          is_active?: boolean
          pro_plan_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      partner_transactions: {
        Row: {
          amount_collected: number
          client_email: string | null
          client_phone: string | null
          client_user_id: string
          commission_amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          partner_id: string
          plan: string
          pro_request_id: string | null
          reference: string | null
          status: string
        }
        Insert: {
          amount_collected: number
          client_email?: string | null
          client_phone?: string | null
          client_user_id: string
          commission_amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          partner_id: string
          plan?: string
          pro_request_id?: string | null
          reference?: string | null
          status?: string
        }
        Update: {
          amount_collected?: number
          client_email?: string | null
          client_phone?: string | null
          client_user_id?: string
          commission_amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          partner_id?: string
          plan?: string
          pro_request_id?: string | null
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_modifications: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_by: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_by?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pharmacy_guards: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          duty_end: string | null
          duty_start: string | null
          id: string
          is_active: boolean
          is_on_duty: boolean
          island: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          duty_end?: string | null
          duty_start?: string | null
          id?: string
          is_active?: boolean
          is_on_duty?: boolean
          island?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          duty_end?: string | null
          duty_start?: string | null
          id?: string
          is_active?: boolean
          is_on_duty?: boolean
          island?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          island: string | null
          last_triggered_at: string | null
          product: string | null
          threshold_type: string
          threshold_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          island?: string | null
          last_triggered_at?: string | null
          product?: string | null
          threshold_type?: string
          threshold_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          island?: string | null
          last_triggered_at?: string | null
          product?: string | null
          threshold_type?: string
          threshold_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_price: number
          old_price: number
          price_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price: number
          old_price: number
          price_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price?: number
          old_price?: number
          price_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          author_id: string
          category: string
          city: string
          created_at: string
          currency: string
          geo_expires_at: string | null
          id: string
          image_url: string | null
          island: string
          latitude: number | null
          longitude: number | null
          market: string
          merchant_type: string
          price: number
          product: string
          region: string | null
          status: Database["public"]["Enums"]["content_status"]
          trend: string | null
          unit: string
          updated_at: string
          vendor: string
          views: number
          village: string | null
        }
        Insert: {
          author_id: string
          category: string
          city: string
          created_at?: string
          currency?: string
          geo_expires_at?: string | null
          id?: string
          image_url?: string | null
          island: string
          latitude?: number | null
          longitude?: number | null
          market: string
          merchant_type?: string
          price: number
          product: string
          region?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          trend?: string | null
          unit: string
          updated_at?: string
          vendor: string
          views?: number
          village?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          city?: string
          created_at?: string
          currency?: string
          geo_expires_at?: string | null
          id?: string
          image_url?: string | null
          island?: string
          latitude?: number | null
          longitude?: number | null
          market?: string
          merchant_type?: string
          price?: number
          product?: string
          region?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          trend?: string | null
          unit?: string
          updated_at?: string
          vendor?: string
          views?: number
          village?: string | null
        }
        Relationships: []
      }
      pro_subscription_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          discount_amount: number | null
          final_amount: number | null
          id: string
          payment_method: string
          payment_reference: string | null
          plan: string
          promo_code: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          payment_method: string
          payment_reference?: string | null
          plan?: string
          promo_code?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          discount_amount?: number | null
          final_amount?: number | null
          id?: string
          payment_method?: string
          payment_reference?: string | null
          plan?: string
          promo_code?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_carriers: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          island: string | null
          location: string | null
          organization: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          island?: string | null
          location?: string | null
          organization?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          island?: string | null
          location?: string | null
          organization?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_investments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          investor_id: string
          message: string | null
          payment_method: string | null
          payment_reference: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          investor_id: string
          message?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          investor_id?: string
          message?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_investments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          project_id: string
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          project_id: string
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_plans: string[]
          code: string
          created_at: string
          created_by: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[]
          code: string
          created_at?: string
          created_by: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[]
          code?: string
          created_at?: string
          created_by?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string | null
          id: string
          native_token: string | null
          p256dh: string | null
          platform: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          native_token?: string | null
          p256dh?: string | null
          platform?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          native_token?: string | null
          p256dh?: string | null
          platform?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          gastronomy_item_id: string
          id: string
          name: string
          quantity: string
          sort_order: number
          unit: string
        }
        Insert: {
          created_at?: string
          gastronomy_item_id: string
          id?: string
          name: string
          quantity?: string
          sort_order?: number
          unit?: string
        }
        Update: {
          created_at?: string
          gastronomy_item_id?: string
          id?: string
          name?: string
          quantity?: string
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_gastronomy_item_id_fkey"
            columns: ["gastronomy_item_id"]
            isOneToOne: false
            referencedRelation: "gastronomy_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_menu_items: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          description: string | null
          gastronomy_item_id: string
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          gastronomy_item_id: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          gastronomy_item_id?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_items_gastronomy_item_id_fkey"
            columns: ["gastronomy_item_id"]
            isOneToOne: false
            referencedRelation: "gastronomy_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          ai_assistant_enabled: boolean | null
          ai_assistant_name: string | null
          ai_assistant_welcome_message: string | null
          allow_registration: boolean
          created_at: string
          email_notifications: boolean
          ga_tracking_id: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          island_images: Json | null
          maintenance_mode: boolean
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          public_view_access: boolean
          robots_txt: string | null
          seo_keywords: string | null
          site_favicon_url: string | null
          site_logo_url: string | null
          site_name: string | null
          twitter_card: string | null
          twitter_site: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_assistant_enabled?: boolean | null
          ai_assistant_name?: string | null
          ai_assistant_welcome_message?: string | null
          allow_registration?: boolean
          created_at?: string
          email_notifications?: boolean
          ga_tracking_id?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          island_images?: Json | null
          maintenance_mode?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          public_view_access?: boolean
          robots_txt?: string | null
          seo_keywords?: string | null
          site_favicon_url?: string | null
          site_logo_url?: string | null
          site_name?: string | null
          twitter_card?: string | null
          twitter_site?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_assistant_enabled?: boolean | null
          ai_assistant_name?: string | null
          ai_assistant_welcome_message?: string | null
          allow_registration?: boolean
          created_at?: string
          email_notifications?: boolean
          ga_tracking_id?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          island_images?: Json | null
          maintenance_mode?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          public_view_access?: boolean
          robots_txt?: string | null
          seo_keywords?: string | null
          site_favicon_url?: string | null
          site_logo_url?: string | null
          site_name?: string | null
          twitter_card?: string | null
          twitter_site?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      static_pages: {
        Row: {
          content: string
          id: string
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          id?: string
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          id?: string
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      taxi_fares: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          from_location: string
          id: string
          is_active: boolean
          island: string
          notes: string | null
          price: number
          to_location: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          from_location: string
          id?: string
          is_active?: boolean
          island?: string
          notes?: string | null
          price: number
          to_location: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          from_location?: string
          id?: string
          is_active?: boolean
          island?: string
          notes?: string | null
          price?: number
          to_location?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      tender_submissions: {
        Row: {
          cover_letter: string
          created_at: string
          currency: string
          documents: string[] | null
          enterprise_id: string
          id: string
          proposed_amount: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tender_id: string
          updated_at: string
        }
        Insert: {
          cover_letter: string
          created_at?: string
          currency?: string
          documents?: string[] | null
          enterprise_id: string
          id?: string
          proposed_amount?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tender_id: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string
          created_at?: string
          currency?: string
          documents?: string[] | null
          enterprise_id?: string
          id?: string
          proposed_amount?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_submissions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_submissions_enterprise_id_fkey"
            columns: ["enterprise_id"]
            isOneToOne: false
            referencedRelation: "enterprise_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_submissions_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          pro_features: Json | null
          username: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          pro_features?: Json | null
          username: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          pro_features?: Json | null
          username?: string
        }
        Relationships: []
      }
      vendor_locations: {
        Row: {
          accuracy: number | null
          address: string | null
          category: string | null
          created_at: string
          expires_at: string
          heading: number | null
          id: string
          is_active: boolean
          is_mobile: boolean
          island: string | null
          label: string
          last_seen_at: string
          latitude: number
          longitude: number
          speed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          address?: string | null
          category?: string | null
          created_at?: string
          expires_at: string
          heading?: number | null
          id?: string
          is_active?: boolean
          is_mobile?: boolean
          island?: string | null
          label: string
          last_seen_at?: string
          latitude: number
          longitude: number
          speed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          address?: string | null
          category?: string | null
          created_at?: string
          expires_at?: string
          heading?: number | null
          id?: string
          is_active?: boolean
          is_mobile?: boolean
          island?: string | null
          label?: string
          last_seen_at?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          additional_info: string | null
          business_name: string | null
          created_at: string
          document_type: string
          document_url: string | null
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: string | null
          business_name?: string | null
          created_at?: string
          document_type: string
          document_url?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: string | null
          business_name?: string | null
          created_at?: string
          document_type?: string
          document_url?: string | null
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      enterprise_profiles_public: {
        Row: {
          city: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_verified: boolean | null
          island: string | null
          logo_url: string | null
          name: string | null
          sector: string | null
          status: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_verified?: boolean | null
          island?: string | null
          logo_url?: string | null
          name?: string | null
          sector?: string | null
          status?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_verified?: boolean | null
          island?: string | null
          logo_url?: string | null
          name?: string | null
          sector?: string | null
          status?: string | null
        }
        Relationships: []
      }
      freelancer_profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          currency: string | null
          display_name: string | null
          experience_years: number | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string | null
          is_available: boolean | null
          is_visible: boolean | null
          island: string | null
          location: string | null
          portfolio_url: string | null
          skills: string[] | null
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          experience_years?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string | null
          is_available?: boolean | null
          is_visible?: boolean | null
          island?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          experience_years?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string | null
          is_available?: boolean | null
          is_visible?: boolean | null
          island?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: []
      }
      partner_accounts_public: {
        Row: {
          accepted_methods: string[] | null
          address: string | null
          business_name: string | null
          city: string | null
          contact_phone: string | null
          created_at: string | null
          id: string | null
          is_visible_on_map: boolean | null
          island: string | null
          latitude: number | null
          longitude: number | null
          opening_hours: string | null
          status: string | null
        }
        Insert: {
          accepted_methods?: string[] | null
          address?: string | null
          business_name?: string | null
          city?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string | null
          is_visible_on_map?: boolean | null
          island?: string | null
          latitude?: number | null
          longitude?: number | null
          opening_hours?: string | null
          status?: string | null
        }
        Update: {
          accepted_methods?: string[] | null
          address?: string | null
          business_name?: string | null
          city?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string | null
          is_visible_on_map?: boolean | null
          island?: string | null
          latitude?: number | null
          longitude?: number | null
          opening_hours?: string | null
          status?: string | null
        }
        Relationships: []
      }
      project_carriers_public: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          island: string | null
          location: string | null
          organization: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          island?: string | null
          location?: string | null
          organization?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          island?: string | null
          location?: string | null
          organization?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings_public: {
        Row: {
          ai_assistant_enabled: boolean | null
          ai_assistant_name: string | null
          ai_assistant_welcome_message: string | null
          ga_tracking_id: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string | null
          island_images: Json | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          seo_keywords: string | null
          site_favicon_url: string | null
          site_logo_url: string | null
          site_name: string | null
          twitter_card: string | null
          twitter_site: string | null
        }
        Insert: {
          ai_assistant_enabled?: boolean | null
          ai_assistant_name?: string | null
          ai_assistant_welcome_message?: string | null
          ga_tracking_id?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string | null
          island_images?: Json | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          seo_keywords?: string | null
          site_favicon_url?: string | null
          site_logo_url?: string | null
          site_name?: string | null
          twitter_card?: string | null
          twitter_site?: string | null
        }
        Update: {
          ai_assistant_enabled?: boolean | null
          ai_assistant_name?: string | null
          ai_assistant_welcome_message?: string | null
          ga_tracking_id?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string | null
          island_images?: Json | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          seo_keywords?: string | null
          site_favicon_url?: string | null
          site_logo_url?: string | null
          site_name?: string | null
          twitter_card?: string | null
          twitter_site?: string | null
        }
        Relationships: []
      }
      users_pro_status: {
        Row: {
          avatar_url: string | null
          id: string | null
          is_pro: boolean | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          is_pro?: never
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          is_pro?: never
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_share_public_location: {
        Args: { _user_id: string }
        Returns: boolean
      }
      generate_ticket_code: { Args: never; Returns: string }
      get_enterprise_id: { Args: { _user_id: string }; Returns: string }
      get_public_usernames: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          id: string
          username: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_enterprise: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_content_view: {
        Args: { _id: string; _type: string }
        Returns: undefined
      }
      increment_promo_code_usage: {
        Args: { _code: string }
        Returns: undefined
      }
      is_active_partner: { Args: { _user_id: string }; Returns: boolean }
      is_pro_annonceur: { Args: { _user_id: string }; Returns: boolean }
      is_pro_user: { Args: { _user_id: string }; Returns: boolean }
      is_project_carrier: { Args: { _user_id: string }; Returns: boolean }
      is_verified_user: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action_type: string
          _description?: string
          _metadata?: Json
          _target_id?: string
          _target_type?: string
        }
        Returns: string
      }
      record_api_key_usage: { Args: { _key_id: string }; Returns: undefined }
      search_freelancers: {
        Args: { _island?: string; _limit?: number; _skills: string[] }
        Returns: {
          bio: string
          currency: string
          display_name: string
          experience_years: number
          hourly_rate_max: number
          hourly_rate_min: number
          id: string
          is_available: boolean
          island: string
          location: string
          skills: string[]
          user_id: string
        }[]
      }
      validate_api_key: {
        Args: { _key_hash: string }
        Returns: {
          created_by: string
          id: string
          permissions: string[]
        }[]
      }
      validate_promo_code: {
        Args: { _code: string; _plan: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      account_type: "free" | "pro" | "enterprise"
      announcement_kind: "info" | "warning" | "urgent" | "maintenance"
      app_role: "admin" | "moderator" | "user" | "annonceur" | "partner"
      content_status: "published" | "draft" | "archived"
      content_type: "announcement" | "event" | "service" | "tender"
      gastronomy_type:
        | "recipe"
        | "restaurant_dish"
        | "hotel_room"
        | "private_room"
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
      account_type: ["free", "pro", "enterprise"],
      announcement_kind: ["info", "warning", "urgent", "maintenance"],
      app_role: ["admin", "moderator", "user", "annonceur", "partner"],
      content_status: ["published", "draft", "archived"],
      content_type: ["announcement", "event", "service", "tender"],
      gastronomy_type: [
        "recipe",
        "restaurant_dish",
        "hotel_room",
        "private_room",
      ],
    },
  },
} as const
