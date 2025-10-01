import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          user_id: string;
          daily_calorie_goal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_calorie_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_calorie_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      foods: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories_per_serving: number;
          serving_size: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories_per_serving: number;
          serving_size?: string;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          calories_per_serving?: number;
          serving_size?: string;
          category?: string;
          created_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories_per_minute: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories_per_minute: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          calories_per_minute?: number;
          created_at?: string;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          total_calories_consumed: number;
          total_calories_burned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          total_calories_consumed?: number;
          total_calories_burned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          total_calories_consumed?: number;
          total_calories_burned?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      food_entries: {
        Row: {
          id: string;
          user_id: string;
          daily_log_id: string;
          food_id: string | null;
          food_name: string;
          calories: number;
          portions: number;
          meal_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_log_id: string;
          food_id?: string | null;
          food_name: string;
          calories: number;
          portions?: number;
          meal_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_log_id?: string;
          food_id?: string | null;
          food_name?: string;
          calories?: number;
          portions?: number;
          meal_type?: string;
          created_at?: string;
        };
      };
      activity_entries: {
        Row: {
          id: string;
          user_id: string;
          daily_log_id: string;
          activity_id: string | null;
          activity_name: string;
          calories_burned: number;
          duration_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_log_id: string;
          activity_id?: string | null;
          activity_name: string;
          calories_burned: number;
          duration_minutes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_log_id?: string;
          activity_id?: string | null;
          activity_name?: string;
          calories_burned?: number;
          duration_minutes?: number;
          created_at?: string;
        };
      };
    };
  };
};