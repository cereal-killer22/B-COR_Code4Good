import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          phone_number: string | null
          avatar_url: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          avatar_url?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
        }
      }
      alert_preferences: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          cyclone_alerts: boolean
          flood_alerts: boolean
          wind_alerts: boolean
          sms_enabled: boolean
          telegram_enabled: boolean
          email_enabled: boolean
          critical_only: boolean
          alert_radius_km: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          cyclone_alerts?: boolean
          flood_alerts?: boolean
          wind_alerts?: boolean
          sms_enabled?: boolean
          telegram_enabled?: boolean
          email_enabled?: boolean
          critical_only?: boolean
          alert_radius_km?: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          cyclone_alerts?: boolean
          flood_alerts?: boolean
          wind_alerts?: boolean
          sms_enabled?: boolean
          telegram_enabled?: boolean
          email_enabled?: boolean
          critical_only?: boolean
          alert_radius_km?: number
        }
      }
      notification_history: {
        Row: {
          id: string
          user_id: string
          created_at: string
          alert_type: 'cyclone' | 'flood' | 'wind'
          severity: 'low' | 'moderate' | 'high' | 'critical'
          message: string
          delivery_method: 'sms' | 'telegram' | 'email' | 'push'
          delivery_status: 'sent' | 'delivered' | 'failed'
          location_name: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          alert_type: 'cyclone' | 'flood' | 'wind'
          severity: 'low' | 'moderate' | 'high' | 'critical'
          message: string
          delivery_method: 'sms' | 'telegram' | 'email' | 'push'
          delivery_status?: 'sent' | 'delivered' | 'failed'
          location_name: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          alert_type?: 'cyclone' | 'flood' | 'wind'
          severity?: 'low' | 'moderate' | 'high' | 'critical'
          message?: string
          delivery_method?: 'sms' | 'telegram' | 'email' | 'push'
          delivery_status?: 'sent' | 'delivered' | 'failed'
          location_name?: string
        }
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
  }
}