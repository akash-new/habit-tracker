/*
  # Add habit completions tracking

  1. New Tables
    - `habit_completions`
      - `id` (uuid, primary key)
      - `habit_id` (uuid, foreign key to habits)
      - `user_id` (uuid, foreign key to users)
      - `completed_at` (timestamp)
      - `date` (date, for daily tracking)
      - `completed` (boolean, default false)

  2. Security
    - Enable RLS on `habit_completions` table
    - Add policies for users to manage their own completions
*/

CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  date date DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  UNIQUE(habit_id, date)
);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own completions"
  ON habit_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own completions"
  ON habit_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own completions"
  ON habit_completions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX habit_completions_date_idx ON habit_completions(date);
CREATE INDEX habit_completions_user_habit_idx ON habit_completions(user_id, habit_id);