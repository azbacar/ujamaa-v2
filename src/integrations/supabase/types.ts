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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
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
      comments: {
        Row: {
          author_id: number
          content: string
          created_at: string
          id: number
          post_id: number
        }
        Insert: {
          author_id: number
          content: string
          created_at?: string
          id?: never
          post_id: number
        }
        Update: {
          author_id?: number
          content?: string
          created_at?: string
          id?: never
          post_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          author_id: string
          category: string | null
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
      posts: {
        Row: {
          author_id: number
          content: string
          created_at: string
          id: number
          title: string
        }
        Insert: {
          author_id: number
          content: string
          created_at?: string
          id?: never
          title: string
        }
        Update: {
          author_id?: number
          content?: string
          created_at?: string
          id?: never
          title?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          allow_registration: boolean
          created_at: string
          email_notifications: boolean
          id: string
          maintenance_mode: boolean
          public_view_access: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_registration?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          maintenance_mode?: boolean
          public_view_access?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_registration?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          maintenance_mode?: boolean
          public_view_access?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
          created_at: string
          email: string
          id: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
    }
    Enums: {
      announcement_kind: "info" | "warning" | "urgent" | "maintenance"
      app_role: "admin" | "moderator" | "user"
      content_status: "published" | "draft" | "archived"
      content_type: "announcement" | "event" | "service" | "tender"
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
      announcement_kind: ["info", "warning", "urgent", "maintenance"],
      app_role: ["admin", "moderator", "user"],
      content_status: ["published", "draft", "archived"],
      content_type: ["announcement", "event", "service", "tender"],
    },
  },
} as const
