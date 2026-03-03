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
      analyses: {
        Row: {
          created_at: string
          id: string
          job_description: string | null
          location: string | null
          match_score: number | null
          results_json: Json | null
          resume_text: string | null
          target_role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_description?: string | null
          location?: string | null
          match_score?: number | null
          results_json?: Json | null
          resume_text?: string | null
          target_role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_description?: string | null
          location?: string | null
          match_score?: number | null
          results_json?: Json | null
          resume_text?: string | null
          target_role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
          last_seen_at: string | null
          full_name: string | null
          university: string | null
          course: string | null
          prn: string | null
          graduation_year: number | null
          country: string | null
          linkedin: string | null
          github: string | null
          skillmirror_id: string | null
          profile_completed: boolean
          verification_status: string | null
          candidate_score: number | null
          risk_score: number | null
          skill_authenticity_score: number | null
          growth_potential_score: number | null
          linkedin_url: string | null
          research_interest: string | null
          bio: string | null
          resume_url: string | null
          avatar_url: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
          last_seen_at?: string | null
          full_name?: string | null
          university?: string | null
          course?: string | null
          prn?: string | null
          graduation_year?: number | null
          country?: string | null
          linkedin?: string | null
          github?: string | null
          skillmirror_id?: string | null
          profile_completed?: boolean
          verification_status?: string | null
          candidate_score?: number | null
          risk_score?: number | null
          skill_authenticity_score?: number | null
          growth_potential_score?: number | null
          linkedin_url?: string | null
          research_interest?: string | null
          bio?: string | null
          resume_url?: string | null
          avatar_url?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          last_seen_at?: string | null
          full_name?: string | null
          university?: string | null
          course?: string | null
          prn?: string | null
          graduation_year?: number | null
          country?: string | null
          linkedin?: string | null
          github?: string | null
          skillmirror_id?: string | null
          profile_completed?: boolean
          verification_status?: string | null
          candidate_score?: number | null
          risk_score?: number | null
          skill_authenticity_score?: number | null
          growth_potential_score?: number | null
          linkedin_url?: string | null
          research_interest?: string | null
          bio?: string | null
          resume_url?: string | null
          avatar_url?: string | null
          role?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_id: string
          is_active: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          is_active?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          is_active?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          created_at?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      skill_tests: {
        Row: {
          id: string
          user_id: string
          test_type: string
          status: string
          score: number | null
          skills_verified: Json | null
          started_at: string | null
          completed_at: string | null
          warnings: number
          tab_switches: number | null
          camera_warnings: number | null
          time_spent_seconds: number | null
          questions: Json | null
          answers: Json | null
          coding_answers: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          test_type?: string
          status?: string
          score?: number | null
          skills_verified?: Json | null
          started_at?: string | null
          completed_at?: string | null
          warnings?: number
          tab_switches?: number | null
          camera_warnings?: number | null
          time_spent_seconds?: number | null
          questions?: Json | null
          answers?: Json | null
          coding_answers?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          test_type?: string
          status?: string
          score?: number | null
          skills_verified?: Json | null
          started_at?: string | null
          completed_at?: string | null
          warnings?: number
          tab_switches?: number | null
          camera_warnings?: number | null
          time_spent_seconds?: number | null
          questions?: Json | null
          answers?: Json | null
          coding_answers?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          skillmirror_id: string
          certificate_number: string
          full_name: string
          university: string | null
          course: string | null
          test_score: number
          verification_status: string | null
          skills_verified: Json | null
          issued_at: string
          valid_until: string | null
          qr_code: string | null
          pdf_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skillmirror_id: string
          certificate_number?: string
          full_name?: string
          university?: string | null
          course?: string | null
          test_score?: number
          verification_status?: string | null
          skills_verified?: Json | null
          issued_at?: string
          valid_until?: string | null
          qr_code?: string | null
          pdf_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          skillmirror_id?: string
          certificate_number?: string
          full_name?: string
          university?: string | null
          course?: string | null
          test_score?: number
          verification_status?: string | null
          skills_verified?: Json | null
          issued_at?: string
          valid_until?: string | null
          qr_code?: string | null
          pdf_url?: string | null
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          id: string
          user_id: string
          target_role: string
          current_level: string
          experience_level: string
          time_commitment: string
          roadmap_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_role: string
          current_level?: string
          experience_level?: string
          time_commitment?: string
          roadmap_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_role?: string
          current_level?: string
          experience_level?: string
          time_commitment?: string
          roadmap_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_url: string | null
          parsed_text: string | null
          skills_detected: Json | null
          experience: Json | null
          projects: Json | null
          education: Json | null
          certifications: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_url?: string | null
          parsed_text?: string | null
          skills_detected?: Json | null
          experience?: Json | null
          projects?: Json | null
          education?: Json | null
          certifications?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_url?: string | null
          parsed_text?: string | null
          skills_detected?: Json | null
          experience?: Json | null
          projects?: Json | null
          education?: Json | null
          certifications?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      recruiters: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          email: string | null
          company: string | null
          position: string | null
          phone: string | null
          country: string | null
          company_website: string | null
          is_verified: boolean
          approved_at: string | null
          created_at: string
          avatar_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          email?: string | null
          company?: string | null
          position?: string | null
          phone?: string | null
          country?: string | null
          company_website?: string | null
          is_verified?: boolean
          approved_at?: string | null
          created_at?: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          email?: string | null
          company?: string | null
          position?: string | null
          phone?: string | null
          country?: string | null
          company_website?: string | null
          is_verified?: boolean
          approved_at?: string | null
          created_at?: string
          avatar_url?: string | null
        }
        Relationships: []
      }
      recruiter_requests: {
        Row: {
          id: string
          full_name: string
          email: string
          company: string
          position: string | null
          phone: string | null
          country: string | null
          company_website: string | null
          status: string
          user_id: string | null
          created_at: string
          approved_at: string | null
          rejected_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          company: string
          position?: string | null
          phone?: string | null
          country?: string | null
          company_website?: string | null
          status?: string
          user_id?: string | null
          created_at?: string
          approved_at?: string | null
          rejected_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          company?: string
          position?: string | null
          phone?: string | null
          country?: string | null
          company_website?: string | null
          status?: string
          user_id?: string | null
          created_at?: string
          approved_at?: string | null
          rejected_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          full_name: string | null
          email: string | null
          university: string | null
          course: string | null
          prn: string | null
          phone: string | null
          country: string | null
          skillmirror_id: string | null
          verification_status: string | null
          candidate_score: number | null
          risk_score: number | null
          skill_authenticity_score: number | null
          created_at: string
          updated_at: string
          linkedin_url: string | null
          research_interest: string | null
          bio: string | null
          resume_url: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          email?: string | null
          university?: string | null
          course?: string | null
          prn?: string | null
          phone?: string | null
          country?: string | null
          skillmirror_id?: string | null
          verification_status?: string | null
          candidate_score?: number | null
          risk_score?: number | null
          skill_authenticity_score?: number | null
          created_at?: string
          updated_at?: string
          linkedin_url?: string | null
          research_interest?: string | null
          bio?: string | null
          resume_url?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          email?: string | null
          university?: string | null
          course?: string | null
          prn?: string | null
          phone?: string | null
          country?: string | null
          skillmirror_id?: string | null
          verification_status?: string | null
          candidate_score?: number | null
          risk_score?: number | null
          skill_authenticity_score?: number | null
          created_at?: string
          updated_at?: string
          linkedin_url?: string | null
          research_interest?: string | null
          bio?: string | null
          resume_url?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      candidate_views: {
        Row: {
          id: string
          recruiter_id: string
          candidate_id: string
          viewed_at: string
          contacted: boolean
        }
        Insert: {
          id?: string
          recruiter_id: string
          candidate_id: string
          viewed_at?: string
          contacted?: boolean
        }
        Update: {
          id?: string
          recruiter_id?: string
          candidate_id?: string
          viewed_at?: string
          contacted?: boolean
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          attachment_url: string | null
          attachment_name: string | null
          attachment_type: string | null
          conversation_id: string | null
          status: string
          delivered_at: string | null
          seen_at: string | null
          deleted_by_sender: boolean
          deleted_by_receiver: boolean
          read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_type?: string | null
          conversation_id?: string | null
          status?: string
          delivered_at?: string | null
          seen_at?: string | null
          deleted_by_sender?: boolean
          deleted_by_receiver?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          attachment_url?: string | null
          attachment_name?: string | null
          attachment_type?: string | null
          conversation_id?: string | null
          status?: string
          delivered_at?: string | null
          seen_at?: string | null
          deleted_by_sender?: boolean
          deleted_by_receiver?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_reports: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_url: string
          file_size: number
          report_type: string | null
          target_role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_url: string
          file_size?: number
          report_type?: string | null
          target_role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_size?: number
          report_type?: string | null
          target_role?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string | null
          data: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content?: string | null
          data?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string | null
          data?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          participant1_id: string
          participant2_id: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          participant1_id: string
          participant2_id: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          participant1_id?: string
          participant2_id?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          id: string
          user_id: string
          is_online: boolean
          last_seen_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_online?: boolean
          last_seen_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_online?: boolean
          last_seen_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          id: string
          conversation_id: string | null
          user_id: string
          is_typing: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          user_id: string
          is_typing?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string | null
          user_id?: string
          is_typing?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_certificates: {
        Row: {
          id: string
          user_id: string
          certificate_name: string
          issuing_company: string
          issue_date: string
          certificate_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          certificate_name: string
          issuing_company: string
          issue_date: string
          certificate_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          certificate_name?: string
          issuing_company?: string
          issue_date?: string
          certificate_image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_activity: {
        Args: {
          p_user_id: string
          p_session_id: string
        }
        Returns: void
      }
      check_user_inactivity: {
        Args: {
          p_user_id: string
          p_minutes: number
        }
        Returns: boolean
      }
      generate_skillmirror_id: {
        Args: Record<string, never>
        Returns: string
      }
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
