/*
  # Enhanced Fields Schema for Advanced Orchard Management

  1. Enhanced Fields Table
    - Add comprehensive orchard management fields
    - Support for tree tagging and variety tracking
    - Enhanced location and boundary data
    - Detailed orchard metadata

  2. Tree Tags Table
    - Individual tree tracking within orchards
    - Variety and location data for each tree
    - Row and position information

  3. Orchard Analytics
    - Production tracking per variety
    - Health monitoring data
    - Growth stage tracking

  4. Enhanced Security
    - Row Level Security for all new tables
    - Proper user isolation
    - Secure data access patterns
*/

-- Enhanced fields table with additional columns
DO $$
BEGIN
  -- Add new columns to fields table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'notes') THEN
    ALTER TABLE fields ADD COLUMN notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'image_urls') THEN
    ALTER TABLE fields ADD COLUMN image_urls text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'updated_at') THEN
    ALTER TABLE fields ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create tree_tags table for individual tree tracking
CREATE TABLE IF NOT EXISTS tree_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  name text,
  variety text,
  row_number integer,
  position_in_row integer,
  latitude double precision,
  longitude double precision,
  health_status text DEFAULT 'Good',
  planted_date date,
  last_harvest_date date,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for tree_tags
CREATE INDEX IF NOT EXISTS tree_tags_user_id_idx ON tree_tags(user_id);
CREATE INDEX IF NOT EXISTS tree_tags_field_id_idx ON tree_tags(field_id);
CREATE INDEX IF NOT EXISTS tree_tags_variety_idx ON tree_tags(variety);
CREATE INDEX IF NOT EXISTS tree_tags_location_idx ON tree_tags USING gist (st_point(longitude, latitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Enable RLS for tree_tags
ALTER TABLE tree_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tree_tags
CREATE POLICY "tree_tags_select_own"
  ON tree_tags
  FOR SELECT
  USING (user_id = uid());

CREATE POLICY "tree_tags_insert_own"
  ON tree_tags
  FOR INSERT
  WITH CHECK (user_id = uid());

CREATE POLICY "tree_tags_update_own"
  ON tree_tags
  FOR UPDATE
  USING (user_id = uid());

CREATE POLICY "tree_tags_delete_own"
  ON tree_tags
  FOR DELETE
  USING (user_id = uid());

-- Create orchard_varieties table for variety management
CREATE TABLE IF NOT EXISTS orchard_varieties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  variety_name text NOT NULL,
  variety_type text, -- 'traditional', 'high_density', 'exotic'
  role text DEFAULT 'main', -- 'main', 'pollinator', 'both'
  total_trees integer DEFAULT 0,
  planted_trees integer DEFAULT 0,
  healthy_trees integer DEFAULT 0,
  production_per_tree numeric DEFAULT 0,
  expected_yield numeric DEFAULT 0,
  actual_yield numeric DEFAULT 0,
  planting_date date,
  first_harvest_date date,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for orchard_varieties
CREATE INDEX IF NOT EXISTS orchard_varieties_user_id_idx ON orchard_varieties(user_id);
CREATE INDEX IF NOT EXISTS orchard_varieties_field_id_idx ON orchard_varieties(field_id);
CREATE INDEX IF NOT EXISTS orchard_varieties_variety_name_idx ON orchard_varieties(variety_name);

-- Enable RLS for orchard_varieties
ALTER TABLE orchard_varieties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orchard_varieties
CREATE POLICY "orchard_varieties_select_own"
  ON orchard_varieties
  FOR SELECT
  USING (user_id = uid());

CREATE POLICY "orchard_varieties_insert_own"
  ON orchard_varieties
  FOR INSERT
  WITH CHECK (user_id = uid());

CREATE POLICY "orchard_varieties_update_own"
  ON orchard_varieties
  FOR UPDATE
  USING (user_id = uid());

CREATE POLICY "orchard_varieties_delete_own"
  ON orchard_varieties
  FOR DELETE
  USING (user_id = uid());

-- Create production_records table for harvest tracking
CREATE TABLE IF NOT EXISTS production_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  tree_tag_id uuid REFERENCES tree_tags(id) ON DELETE SET NULL,
  variety_name text,
  harvest_date date NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text DEFAULT 'kg',
  quality_grade text DEFAULT 'A', -- A, B, C grades
  price_per_unit numeric DEFAULT 0,
  total_value numeric GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  buyer_name text,
  buyer_contact text,
  weather_conditions text,
  notes text,
  images text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for production_records
CREATE INDEX IF NOT EXISTS production_records_user_id_idx ON production_records(user_id);
CREATE INDEX IF NOT EXISTS production_records_field_id_idx ON production_records(field_id);
CREATE INDEX IF NOT EXISTS production_records_harvest_date_idx ON production_records(harvest_date DESC);
CREATE INDEX IF NOT EXISTS production_records_variety_idx ON production_records(variety_name);

-- Enable RLS for production_records
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for production_records
CREATE POLICY "production_records_select_own"
  ON production_records
  FOR SELECT
  USING (user_id = uid());

CREATE POLICY "production_records_insert_own"
  ON production_records
  FOR INSERT
  WITH CHECK (user_id = uid());

CREATE POLICY "production_records_update_own"
  ON production_records
  FOR UPDATE
  USING (user_id = uid());

CREATE POLICY "production_records_delete_own"
  ON production_records
  FOR DELETE
  USING (user_id = uid());

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS fields_updated_at ON fields;
CREATE TRIGGER fields_updated_at
  BEFORE UPDATE ON fields
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS tree_tags_updated_at ON tree_tags;
CREATE TRIGGER tree_tags_updated_at
  BEFORE UPDATE ON tree_tags
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS orchard_varieties_updated_at ON orchard_varieties;
CREATE TRIGGER orchard_varieties_updated_at
  BEFORE UPDATE ON orchard_varieties
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS production_records_updated_at ON production_records;
CREATE TRIGGER production_records_updated_at
  BEFORE UPDATE ON production_records
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create view for comprehensive field analytics
CREATE OR REPLACE VIEW field_analytics_view AS
SELECT 
  f.id,
  f.user_id,
  f.name,
  f.area,
  f.soil_type,
  f.health_status,
  f.location,
  f.latitude,
  f.longitude,
  f.created_at,
  f.updated_at,
  
  -- Tree statistics
  COALESCE(tt.total_trees, 0) as tagged_trees,
  COALESCE(ov.total_varieties, 0) as total_varieties,
  COALESCE(ov.total_planned_trees, 0) as total_planned_trees,
  
  -- Production statistics
  COALESCE(pr.total_harvests, 0) as total_harvests,
  COALESCE(pr.total_production, 0) as total_production_kg,
  COALESCE(pr.total_value, 0) as total_production_value,
  COALESCE(pr.avg_quality, 'N/A') as average_quality,
  
  -- Latest harvest
  pr.latest_harvest_date,
  pr.latest_harvest_quantity

FROM fields f

LEFT JOIN (
  SELECT 
    field_id,
    COUNT(*) as total_trees
  FROM tree_tags
  GROUP BY field_id
) tt ON f.id = tt.field_id

LEFT JOIN (
  SELECT 
    field_id,
    COUNT(DISTINCT variety_name) as total_varieties,
    SUM(total_trees) as total_planned_trees
  FROM orchard_varieties
  GROUP BY field_id
) ov ON f.id = ov.field_id

LEFT JOIN (
  SELECT 
    field_id,
    COUNT(*) as total_harvests,
    SUM(quantity) as total_production,
    SUM(total_value) as total_value,
    MODE() WITHIN GROUP (ORDER BY quality_grade) as avg_quality,
    MAX(harvest_date) as latest_harvest_date,
    (SELECT quantity FROM production_records pr2 
     WHERE pr2.field_id = pr1.field_id 
     ORDER BY harvest_date DESC LIMIT 1) as latest_harvest_quantity
  FROM production_records pr1
  GROUP BY field_id
) pr ON f.id = pr.field_id;

-- Grant permissions on the view
GRANT SELECT ON field_analytics_view TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "field_analytics_view_select_own"
  ON field_analytics_view
  FOR SELECT
  USING (user_id = uid());