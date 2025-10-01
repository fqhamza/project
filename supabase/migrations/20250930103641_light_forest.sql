/*
# Calorie Tracker Database Schema

1. New Tables
   - `users_profile` - User settings and calorie goals
   - `foods` - Personal food library with nutritional information
   - `activities` - Personal activity library with calorie burn rates
   - `daily_logs` - Daily calorie intake and activity records
   - `food_entries` - Individual food consumption entries
   - `activity_entries` - Individual activity/exercise entries

2. Security
   - Enable RLS on all tables
   - Add policies for authenticated users to access only their own data

3. Features
   - Complete calorie tracking system
   - Personal food and activity libraries
   - Daily progress monitoring
   - Historical data storage
*/

-- Users profile table for calorie goals and preferences
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_calorie_goal integer DEFAULT 2000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Personal food library
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  calories_per_serving numeric NOT NULL,
  serving_size text DEFAULT 'serving',
  category text DEFAULT 'Other',
  created_at timestamptz DEFAULT now()
);

-- Personal activity library
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  calories_per_minute numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Daily logs for tracking overall progress
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_calories_consumed numeric DEFAULT 0,
  total_calories_burned numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Individual food entries
CREATE TABLE IF NOT EXISTS food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_log_id uuid REFERENCES daily_logs(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  calories numeric NOT NULL,
  portions numeric DEFAULT 1,
  meal_type text DEFAULT 'Other',
  created_at timestamptz DEFAULT now()
);

-- Individual activity entries
CREATE TABLE IF NOT EXISTS activity_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_log_id uuid REFERENCES daily_logs(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  activity_name text NOT NULL,
  calories_burned numeric NOT NULL,
  duration_minutes numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own profile"
  ON users_profile FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own foods"
  ON foods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own activities"
  ON activities FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own daily logs"
  ON daily_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own food entries"
  ON food_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own activity entries"
  ON activity_entries FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_foods_user_id ON foods(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_food_entries_daily_log ON food_entries(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_activity_entries_daily_log ON activity_entries(daily_log_id);