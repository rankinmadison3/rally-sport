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
      action_step_templates: {
        Row: {
          active: boolean
          category: string
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          notes: string | null
          team_id: string
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          notes?: string | null
          team_id: string
          text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          team_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_step_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      action_steps: {
        Row: {
          assigned_by: string | null
          category: string
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          notes: string | null
          team_id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          category?: string
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          team_id: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          category?: string
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          team_id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_steps_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string
          event_time: string | null
          event_type: string
          game_result: string | null
          id: string
          is_regular_season: boolean
          label: string
          location: string | null
          team_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date: string
          event_time?: string | null
          event_type: string
          game_result?: string | null
          id?: string
          is_regular_season?: boolean
          label: string
          location?: string | null
          team_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          game_result?: string | null
          id?: string
          is_regular_season?: boolean
          label?: string
          location?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_last_read: {
        Row: {
          id: string
          last_read_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_read_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_read_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          is_group: boolean
          message_type: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_group?: boolean
          message_type?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_group?: boolean
          message_type?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_form_assignments: {
        Row: {
          broadcast_at: string
          broadcast_by: string
          created_at: string
          due_date: string | null
          form_id: string
          id: string
          is_active: boolean
          player_id: string | null
          recurrence: string
          status: string
          submitted_at: string | null
          team_id: string
        }
        Insert: {
          broadcast_at?: string
          broadcast_by: string
          created_at?: string
          due_date?: string | null
          form_id: string
          id?: string
          is_active?: boolean
          player_id?: string | null
          recurrence?: string
          status?: string
          submitted_at?: string | null
          team_id: string
        }
        Update: {
          broadcast_at?: string
          broadcast_by?: string
          created_at?: string
          due_date?: string | null
          form_id?: string
          id?: string
          is_active?: boolean
          player_id?: string | null
          recurrence?: string
          status?: string
          submitted_at?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_form_assignments_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "feedback_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_form_responses: {
        Row: {
          assignment_id: string | null
          created_at: string
          form_id: string | null
          form_name: string
          id: string
          is_anonymous: boolean
          ratings: Json
          team_id: string
          text_answers: Json
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          form_id?: string | null
          form_name?: string
          id?: string
          is_anonymous?: boolean
          ratings?: Json
          team_id: string
          text_answers?: Json
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          form_id?: string | null
          form_name?: string
          id?: string
          is_anonymous?: boolean
          ratings?: Json
          team_id?: string
          text_answers?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_form_responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "feedback_form_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "feedback_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_form_responses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          is_template: boolean
          name: string
          questions: Json
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          is_template?: boolean
          name: string
          questions?: Json
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          is_template?: boolean
          name?: string
          questions?: Json
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback_ratings: {
        Row: {
          category: string
          created_at: string
          id: string
          is_anonymous: boolean
          rating: number
          team_id: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          rating: number
          team_id: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          rating?: number
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_ratings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      morale_checkins: {
        Row: {
          created_at: string
          id: string
          mood: number
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: number
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: number
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "morale_checkins_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          height_cm: number | null
          id: string
          jersey_number: number | null
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          height_cm?: number | null
          id?: string
          jersey_number?: number | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          status: Database["public"]["Enums"]["suggestion_status"]
          team_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          status?: Database["public"]["Enums"]["suggestion_status"]
          team_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          status?: Database["public"]["Enums"]["suggestion_status"]
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          coach_id: string
          code: string
          created_at: string
          id: string
          name: string
          season_losses: number
          season_wins: number
        }
        Insert: {
          coach_id: string
          code?: string
          created_at?: string
          id?: string
          name: string
          season_losses?: number
          season_wins?: number
        }
        Update: {
          coach_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          season_losses?: number
          season_wins?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_team_mates: { Args: { _a: string; _b: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      signup_with_role: {
        Args: {
          p_display_name: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_team_code: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "coach" | "player" | "manager"
      suggestion_status: "new" | "reviewed" | "resolved"
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
      app_role: ["coach", "player", "manager"],
      suggestion_status: ["new", "reviewed", "resolved"],
    },
  },
} as const
