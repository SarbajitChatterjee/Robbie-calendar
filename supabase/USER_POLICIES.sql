-- Do not execute all at once. Execute each view, update and insert one by one.
-- The check whether any policies exist by running the check query.

-- Check if policies already exist
SELECT policyname, cmd, qual 
    FROM pg_policies 
    WHERE tablename = 'user_settings';

-- Allow users to read their own row
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own row
CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to insert their own row (covers any manual inserts)
CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);