CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    email,
    "displayName",
    "homeTimezone",
    "firstDayOfWeek",
    "emailDetectionMode",
    "darkMode",
    "showOrganizerTimezone"
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'displayName', ''),
    COALESCE(NEW.raw_user_meta_data->>'homeTimezone', 'UTC'),
    COALESCE(NEW.raw_user_meta_data->>'firstDayOfWeek', 'monday'),
    CASE
      WHEN NEW.raw_user_meta_data->>'emailDetectionMode' IN ('ics_only', 'smart', 'disabled')
      THEN NEW.raw_user_meta_data->>'emailDetectionMode'
      ELSE 'ics_only'
    END,
    COALESCE((NEW.raw_user_meta_data->>'darkMode')::boolean, false),
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_user_confirmed();