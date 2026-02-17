/*
  # Seed Sample Data for AppleKul Suite

  This migration adds sample data for demonstration purposes.
  It will only insert data if there are existing users in the system.
*/

DO $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_field1_id uuid;
  v_field2_id uuid;
  v_field3_id uuid;
BEGIN
  -- Get the first user (if any exists)
  SELECT id, email
  INTO v_user_id, v_email
  FROM auth.users
  ORDER BY created_at
  LIMIT 1;

  -- If no users exist, skip seeding
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No auth users found; sample data seeding skipped.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding sample data for user: %', v_email;

  -- Update or insert profile
  INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    farm_name,
    whatsapp,
    address,
    language,
    currency,
    khasra_number,
    khata_number
  )
  VALUES (
    v_user_id,
    'Demo Farmer',
    v_email,
    '+91-9876543210',
    'Green Valley Orchards',
    '+91-9876543210',
    'Village Khanna, District Ludhiana, Punjab, India',
    'en',
    'INR',
    '123/45',
    '67/89'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    farm_name = EXCLUDED.farm_name,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    address = EXCLUDED.address,
    khasra_number = EXCLUDED.khasra_number,
    khata_number = EXCLUDED.khata_number;

  -- Insert sample fields
  INSERT INTO public.fields (
    id,
    user_id,
    name,
    area,
    soil_type,
    crop_stage,
    health_status,
    location,
    planted_date,
    latitude,
    longitude,
    boundary_path,
    notes
  )
  VALUES
    (
      gen_random_uuid(),
      v_user_id,
      'North Apple Orchard',
      15.5,
      'Sandy Loam',
      'Fruiting',
      'Excellent',
      'Ludhiana District, Punjab',
      '2022-03-15',
      30.9010,
      75.8573,
      '[{"lat": 30.9010, "lng": 75.8573}, {"lat": 30.9015, "lng": 75.8573}, {"lat": 30.9015, "lng": 75.8580}, {"lat": 30.9010, "lng": 75.8580}]'::jsonb,
      'Prime location with excellent drainage and morning sunlight exposure.'
    ),
    (
      gen_random_uuid(),
      v_user_id,
      'South Apple Block',
      12.3,
      'Clay Loam',
      'Growing',
      'Good',
      'Ludhiana District, Punjab',
      '2023-01-20',
      30.8995,
      75.8560,
      '[{"lat": 30.8995, "lng": 75.8560}, {"lat": 30.9000, "lng": 75.8560}, {"lat": 30.9000, "lng": 75.8567}, {"lat": 30.8995, "lng": 75.8567}]'::jsonb,
      'Recently planted with high-density planting system.'
    ),
    (
      gen_random_uuid(),
      v_user_id,
      'East Experimental Plot',
      8.7,
      'Silt Loam',
      'Flowering',
      'Fair',
      'Ludhiana District, Punjab',
      '2023-11-10',
      30.9020,
      75.8590,
      '[{"lat": 30.9020, "lng": 75.8590}, {"lat": 30.9025, "lng": 75.8590}, {"lat": 30.9025, "lng": 75.8595}, {"lat": 30.9020, "lng": 75.8595}]'::jsonb,
      'Testing new apple varieties and organic farming techniques.'
    )
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO v_field1_id;

  -- Get field IDs for further operations
  SELECT id INTO v_field1_id FROM public.fields WHERE user_id = v_user_id AND name = 'North Apple Orchard' LIMIT 1;
  SELECT id INTO v_field2_id FROM public.fields WHERE user_id = v_user_id AND name = 'South Apple Block' LIMIT 1;
  SELECT id INTO v_field3_id FROM public.fields WHERE user_id = v_user_id AND name = 'East Experimental Plot' LIMIT 1;

  -- Insert sample activities
  INSERT INTO public.activities (
    user_id,
    field_id,
    title,
    description,
    kind
  )
  VALUES
    (v_user_id, v_field1_id, 'Irrigation system installed', 'Completed installation of drip irrigation system in North Orchard', 'success'),
    (v_user_id, v_field2_id, 'Pest control treatment applied', 'Applied organic neem-based pesticide for aphid control', 'info'),
    (v_user_id, v_field1_id, 'Harvest completed - Premium grade', 'Successfully harvested 2.5 tons of premium quality apples', 'success'),
    (v_user_id, v_field3_id, 'Soil testing required', 'Schedule soil pH and nutrient testing for experimental plot', 'warning'),
    (v_user_id, NULL, 'Weather alert - Heavy rain expected', 'Monsoon forecast shows heavy rainfall in next 3 days', 'warning'),
    (v_user_id, v_field2_id, 'Pruning completed', 'Winter pruning completed for better fruit production', 'success'),
    (v_user_id, v_field1_id, 'Fertilizer application', 'Applied organic compost and NPK fertilizer', 'info');

  -- Insert sample weather data
  INSERT INTO public.weather_data (
    user_id,
    location,
    latitude,
    longitude,
    temperature,
    humidity,
    precipitation,
    wind_speed,
    weather_condition,
    forecast_data
  )
  VALUES
    (
      v_user_id,
      'Ludhiana, Punjab',
      30.9010,
      75.8573,
      28.5,
      65.2,
      0.0,
      12.3,
      'Partly Cloudy',
      '{"forecast": [{"date": "2024-01-16", "temp_max": 30, "temp_min": 18, "condition": "Sunny"}, {"date": "2024-01-17", "temp_max": 29, "temp_min": 17, "condition": "Cloudy"}]}'::jsonb
    );

  -- Insert sample notifications
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    read
  )
  VALUES
    (v_user_id, 'Welcome to AppleKul Suite!', 'Your account has been set up successfully. Complete your profile to get personalized recommendations.', 'success', false),
    (v_user_id, 'Weather Alert', 'Heavy rainfall expected in your area. Consider protective measures for your orchards.', 'warning', false),
    (v_user_id, 'Harvest Reminder', 'North Apple Orchard is ready for harvest based on growth stage analysis.', 'info', true),
    (v_user_id, 'Task Due Soon', 'Soil testing for East Experimental Plot is due in 2 days.', 'warning', false);

  -- Insert sample field analytics
  INSERT INTO public.field_analytics (
    user_id,
    field_id,
    metric_type,
    metric_value,
    unit,
    recorded_date,
    notes
  )
  VALUES
    (v_user_id, v_field1_id, 'soil_ph', 6.8, 'pH', CURRENT_DATE - INTERVAL '30 days', 'Optimal pH level for apple cultivation'),
    (v_user_id, v_field1_id, 'tree_count', 450, 'trees', CURRENT_DATE - INTERVAL '60 days', 'Total number of apple trees'),
    (v_user_id, v_field1_id, 'yield_per_tree', 25.5, 'kg', CURRENT_DATE - INTERVAL '90 days', 'Average yield per tree last season'),
    (v_user_id, v_field2_id, 'soil_ph', 7.2, 'pH', CURRENT_DATE - INTERVAL '25 days', 'Slightly alkaline, may need amendment'),
    (v_user_id, v_field2_id, 'tree_count', 320, 'trees', CURRENT_DATE - INTERVAL '45 days', 'High-density planting'),
    (v_user_id, v_field3_id, 'soil_ph', 6.5, 'pH', CURRENT_DATE - INTERVAL '20 days', 'Good for experimental varieties');

  -- Insert sample tasks
  INSERT INTO public.tasks (
    user_id,
    field_id,
    title,
    description,
    status,
    priority,
    due_date,
    tags
  )
  VALUES
    (v_user_id, v_field1_id, 'Winter Pruning', 'Perform winter pruning to improve fruit quality and tree health', 'completed', 'high', CURRENT_DATE - INTERVAL '15 days', ARRAY['pruning', 'maintenance']),
    (v_user_id, v_field2_id, 'Irrigation System Check', 'Inspect and maintain drip irrigation system', 'in_progress', 'medium', CURRENT_DATE + INTERVAL '5 days', ARRAY['irrigation', 'maintenance']),
    (v_user_id, v_field3_id, 'Soil Testing', 'Conduct comprehensive soil analysis for nutrient levels', 'pending', 'high', CURRENT_DATE + INTERVAL '2 days', ARRAY['soil', 'testing']),
    (v_user_id, NULL, 'Equipment Maintenance', 'Service and maintain farm equipment before harvest season', 'pending', 'medium', CURRENT_DATE + INTERVAL '10 days', ARRAY['equipment', 'maintenance']),
    (v_user_id, v_field1_id, 'Pest Monitoring', 'Weekly pest and disease monitoring rounds', 'pending', 'high', CURRENT_DATE + INTERVAL '3 days', ARRAY['pest-control', 'monitoring']);

  -- Insert sample expenses
  INSERT INTO public.expenses (
    user_id,
    field_id,
    title,
    description,
    amount,
    currency,
    category,
    expense_date,
    payment_method,
    tags
  )
  VALUES
    (v_user_id, v_field1_id, 'Organic Fertilizer', 'Purchased organic compost and NPK fertilizer', 15000, 'INR', 'Fertilizers', CURRENT_DATE - INTERVAL '20 days', 'Bank Transfer', ARRAY['fertilizer', 'organic']),
    (v_user_id, v_field2_id, 'Drip Irrigation Installation', 'Installation of drip irrigation system', 45000, 'INR', 'Infrastructure', CURRENT_DATE - INTERVAL '45 days', 'Cash', ARRAY['irrigation', 'infrastructure']),
    (v_user_id, NULL, 'Farm Equipment', 'Purchased new pruning tools and sprayer', 8500, 'INR', 'Equipment', CURRENT_DATE - INTERVAL '30 days', 'Credit Card', ARRAY['tools', 'equipment']),
    (v_user_id, v_field3_id, 'Soil Testing', 'Laboratory soil analysis charges', 2500, 'INR', 'Testing', CURRENT_DATE - INTERVAL '25 days', 'Online Payment', ARRAY['soil', 'testing']),
    (v_user_id, v_field1_id, 'Pest Control', 'Organic pesticide and application charges', 6000, 'INR', 'Pest Control', CURRENT_DATE - INTERVAL '15 days', 'Cash', ARRAY['pesticide', 'organic']);

  -- Insert sample harvests
  INSERT INTO public.harvests (
    user_id,
    field_id,
    harvest_date,
    quantity,
    unit,
    quality_grade,
    price_per_unit,
    buyer_name,
    buyer_contact,
    notes
  )
  VALUES
    (v_user_id, v_field1_id, CURRENT_DATE - INTERVAL '60 days', 2500, 'kg', 'Premium', 45, 'Fresh Fruit Traders', '+91-9876543210', 'Excellent quality harvest, premium grade apples'),
    (v_user_id, v_field1_id, CURRENT_DATE - INTERVAL '65 days', 1800, 'kg', 'Grade A', 40, 'Local Market Vendor', '+91-9876543211', 'Good quality, sold at local market'),
    (v_user_id, v_field2_id, CURRENT_DATE - INTERVAL '70 days', 800, 'kg', 'Grade B', 35, 'Processing Unit', '+91-9876543212', 'First harvest from young trees'),
    (v_user_id, v_field1_id, CURRENT_DATE - INTERVAL '90 days', 3200, 'kg', 'Premium', 48, 'Export Company', '+91-9876543213', 'Export quality harvest, excellent returns');

  RAISE NOTICE 'Sample data seeding completed successfully!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during sample data seeding: %', SQLERRM;
END $$;