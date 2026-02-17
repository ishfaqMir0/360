/*
  # Complete AppleKul Suite Database Schema

  1. New Tables
    - `profiles` - User profile information
    - `fields` - Orchard field management
    - `activities` - User activity tracking
    - `weather_data` - Weather information cache
    - `notifications` - User notifications
    - `field_analytics` - Field performance analytics
    - `tasks` - Field management tasks
    - `expenses` - Farm expense tracking
    - `harvests` - Harvest records

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Create storage bucket for avatars and field images

  3. Functions & Triggers
    - Auto-create profile on user signup
    - Update timestamps automatically
    - Calculate field statistics
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  farm_name text,
  avatar_url text,
  khasra_number text,
  khata_number text,
  whatsapp text,
  address text,
  language text DEFAULT 'en',
  currency text DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- FIELDS TABLE
CREATE TABLE IF NOT EXISTS public.fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  area numeric DEFAULT 0,
  soil_type text DEFAULT 'Sandy Loam',
  crop_stage text DEFAULT 'Growing',
  health_status text DEFAULT 'Good',
  location text,
  planted_date date,
  latitude double precision,
  longitude double precision,
  boundary_path jsonb DEFAULT '[]'::jsonb,
  details jsonb DEFAULT '{}'::jsonb,
  image_urls text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fields_user_id_idx ON public.fields(user_id);
CREATE INDEX IF NOT EXISTS fields_location_idx ON public.fields USING GIST(ST_Point(longitude, latitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fields_select_own" ON public.fields
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "fields_insert_own" ON public.fields
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fields_update_own" ON public.fields
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "fields_delete_own" ON public.fields
  FOR DELETE USING (auth.uid() = user_id);

-- ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid REFERENCES public.fields(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  kind text DEFAULT 'info' CHECK (kind IN ('success', 'warning', 'info', 'error')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activities_user_id_idx ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS activities_field_id_idx ON public.activities(field_id);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON public.activities(created_at DESC);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_own" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activities_insert_own" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities_update_own" ON public.activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "activities_delete_own" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

-- WEATHER DATA TABLE
CREATE TABLE IF NOT EXISTS public.weather_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location text NOT NULL,
  latitude double precision,
  longitude double precision,
  temperature numeric,
  humidity numeric,
  precipitation numeric,
  wind_speed numeric,
  weather_condition text,
  forecast_data jsonb DEFAULT '{}'::jsonb,
  data_source text DEFAULT 'api',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weather_data_user_id_idx ON public.weather_data(user_id);
CREATE INDEX IF NOT EXISTS weather_data_location_idx ON public.weather_data(location);
CREATE INDEX IF NOT EXISTS weather_data_recorded_at_idx ON public.weather_data(recorded_at DESC);

ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weather_data_select_own" ON public.weather_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "weather_data_insert_own" ON public.weather_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- FIELD ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.field_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  unit text,
  recorded_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS field_analytics_user_id_idx ON public.field_analytics(user_id);
CREATE INDEX IF NOT EXISTS field_analytics_field_id_idx ON public.field_analytics(field_id);
CREATE INDEX IF NOT EXISTS field_analytics_metric_type_idx ON public.field_analytics(metric_type);
CREATE INDEX IF NOT EXISTS field_analytics_recorded_date_idx ON public.field_analytics(recorded_date DESC);

ALTER TABLE public.field_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "field_analytics_select_own" ON public.field_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "field_analytics_insert_own" ON public.field_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "field_analytics_update_own" ON public.field_analytics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "field_analytics_delete_own" ON public.field_analytics
  FOR DELETE USING (auth.uid() = user_id);

-- TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid REFERENCES public.fields(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date date,
  completed_at timestamptz,
  assigned_to text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_field_id_idx ON public.tasks(field_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid REFERENCES public.fields(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'INR',
  category text NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  receipt_url text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_field_id_idx ON public.expenses(field_id);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON public.expenses(category);
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON public.expenses(expense_date DESC);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert_own" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update_own" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "expenses_delete_own" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- HARVESTS TABLE
CREATE TABLE IF NOT EXISTS public.harvests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  harvest_date date NOT NULL DEFAULT CURRENT_DATE,
  quantity numeric NOT NULL DEFAULT 0,
  unit text DEFAULT 'kg',
  quality_grade text DEFAULT 'A',
  price_per_unit numeric DEFAULT 0,
  total_value numeric GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  buyer_name text,
  buyer_contact text,
  notes text,
  images text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS harvests_user_id_idx ON public.harvests(user_id);
CREATE INDEX IF NOT EXISTS harvests_field_id_idx ON public.harvests(field_id);
CREATE INDEX IF NOT EXISTS harvests_harvest_date_idx ON public.harvests(harvest_date DESC);

ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "harvests_select_own" ON public.harvests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "harvests_insert_own" ON public.harvests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "harvests_update_own" ON public.harvests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "harvests_delete_own" ON public.harvests
  FOR DELETE USING (auth.uid() = user_id);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('field-images', 'field-images', true),
  ('receipts', 'receipts', false),
  ('harvest-images', 'harvest-images', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
-- Avatars bucket policies
CREATE POLICY "avatars_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Field images bucket policies
CREATE POLICY "field_images_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'field-images');

CREATE POLICY "field_images_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'field-images' AND auth.uid() = owner);

CREATE POLICY "field_images_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'field-images' AND auth.uid() = owner);

CREATE POLICY "field_images_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'field-images' AND auth.uid() = owner);

-- Receipts bucket policies (private)
CREATE POLICY "receipts_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND auth.uid() = owner);

CREATE POLICY "receipts_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() = owner);

CREATE POLICY "receipts_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'receipts' AND auth.uid() = owner);

CREATE POLICY "receipts_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'receipts' AND auth.uid() = owner);

-- Harvest images bucket policies
CREATE POLICY "harvest_images_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'harvest-images');

CREATE POLICY "harvest_images_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'harvest-images' AND auth.uid() = owner);

CREATE POLICY "harvest_images_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'harvest-images' AND auth.uid() = owner);

CREATE POLICY "harvest_images_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'harvest-images' AND auth.uid() = owner);

-- FUNCTIONS AND TRIGGERS

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create welcome notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type
  )
  VALUES (
    NEW.id,
    'Welcome to AppleKul Suite!',
    'Complete your profile and add your first orchard to get started.',
    'info'
  );

  RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to calculate field statistics
CREATE OR REPLACE FUNCTION public.calculate_field_stats(field_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb;
  total_harvests numeric;
  total_expenses numeric;
  avg_yield numeric;
BEGIN
  -- Calculate total harvests
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_harvests
  FROM public.harvests
  WHERE field_id = field_uuid;

  -- Calculate total expenses
  SELECT COALESCE(SUM(amount), 0)
  INTO total_expenses
  FROM public.expenses
  WHERE field_id = field_uuid;

  -- Calculate average yield per harvest
  SELECT COALESCE(AVG(quantity), 0)
  INTO avg_yield
  FROM public.harvests
  WHERE field_id = field_uuid;

  stats := jsonb_build_object(
    'total_harvests', total_harvests,
    'total_expenses', total_expenses,
    'avg_yield', avg_yield,
    'net_profit', (SELECT COALESCE(SUM(total_value), 0) FROM public.harvests WHERE field_id = field_uuid) - total_expenses,
    'last_updated', now()
  );

  RETURN stats;
END;
$$;

-- DROP existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS fields_updated_at ON public.fields;
DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
DROP TRIGGER IF EXISTS harvests_updated_at ON public.harvests;

-- CREATE triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER fields_updated_at
  BEFORE UPDATE ON public.fields
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER harvests_updated_at
  BEFORE UPDATE ON public.harvests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create views for common queries
CREATE OR REPLACE VIEW public.field_summary AS
SELECT 
  f.id,
  f.user_id,
  f.name,
  f.area,
  f.health_status,
  f.crop_stage,
  f.location,
  COALESCE(h.total_harvest, 0) as total_harvest,
  COALESCE(e.total_expenses, 0) as total_expenses,
  COALESCE(h.total_value, 0) - COALESCE(e.total_expenses, 0) as net_profit,
  f.created_at,
  f.updated_at
FROM public.fields f
LEFT JOIN (
  SELECT 
    field_id,
    SUM(quantity) as total_harvest,
    SUM(total_value) as total_value
  FROM public.harvests
  GROUP BY field_id
) h ON f.id = h.field_id
LEFT JOIN (
  SELECT 
    field_id,
    SUM(amount) as total_expenses
  FROM public.expenses
  GROUP BY field_id
) e ON f.id = e.field_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;