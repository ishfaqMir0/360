/*
  # Sample Orchard Data for Testing

  This migration adds realistic sample data for testing the enhanced orchard management features.
  Only adds data if users exist in the system.
*/

DO $$
DECLARE
  v_user_id uuid;
  v_field_id uuid;
  v_field_id_2 uuid;
BEGIN
  -- Get the first user
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found, skipping sample data creation';
    RETURN;
  END IF;

  -- Create sample orchards with enhanced data
  INSERT INTO fields (
    user_id, name, area, soil_type, crop_stage, health_status, location,
    planted_date, latitude, longitude, boundary_path, details, notes, image_urls
  ) VALUES 
  (
    v_user_id,
    'Heritage Apple Orchard',
    25.5,
    'Sandy Loam',
    'Fruiting',
    'Excellent',
    'Shimla District, Himachal Pradesh',
    '2020-03-15',
    31.1048,
    77.1734,
    '[
      {"lat": 31.1048, "lng": 77.1734},
      {"lat": 31.1058, "lng": 77.1744},
      {"lat": 31.1068, "lng": 77.1734},
      {"lat": 31.1058, "lng": 77.1724}
    ]'::jsonb,
    '{
      "orchardType": "Traditional",
      "totalTrees": "450",
      "numberOfRows": "18",
      "treesPerRow": "25",
      "ageYears": "4",
      "pollinatorType": "Kashmir Golden / Golden Delicious",
      "varietyTrees": [
        {"variety": "Red Delicious / Delicious", "totalTrees": "200"},
        {"variety": "Kashmir Golden / Golden Delicious", "totalTrees": "100"},
        {"variety": "Ambri", "totalTrees": "150"}
      ],
      "pincode": "171001",
      "district": "Shimla",
      "state": "Himachal Pradesh",
      "country": "India"
    }'::jsonb,
    'Traditional orchard with heritage varieties. Excellent pollination setup with Golden Delicious as main pollinator.',
    '{}'
  ),
  (
    v_user_id,
    'Modern High-Density Orchard',
    15.2,
    'Silt Loam',
    'Growing',
    'Good',
    'Kullu District, Himachal Pradesh',
    '2022-04-10',
    31.9576,
    77.1094,
    '[
      {"lat": 31.9576, "lng": 77.1094},
      {"lat": 31.9586, "lng": 77.1104},
      {"lat": 31.9596, "lng": 77.1094},
      {"lat": 31.9586, "lng": 77.1084}
    ]'::jsonb,
    '{
      "orchardType": "High Density",
      "totalTrees": "800",
      "numberOfRows": "32",
      "treesPerRow": "25",
      "ageYears": "2",
      "pollinatorType": "Scarlet Spur-II",
      "varietyTrees": [
        {"variety": "Gala Scarlet / Redlum Gala", "totalTrees": "300"},
        {"variety": "Auvi Fuji", "totalTrees": "250"},
        {"variety": "Scarlet Spur-II", "totalTrees": "150"},
        {"variety": "Super Chief", "totalTrees": "100"}
      ],
      "pincode": "175101",
      "district": "Kullu",
      "state": "Himachal Pradesh",
      "country": "India"
    }'::jsonb,
    'High-density planting with modern varieties. Focus on export quality apples.',
    '{}'
  )
  RETURNING id INTO v_field_id;

  -- Get the field IDs for further data insertion
  SELECT id INTO v_field_id FROM fields WHERE user_id = v_user_id AND name = 'Heritage Apple Orchard';
  SELECT id INTO v_field_id_2 FROM fields WHERE user_id = v_user_id AND name = 'Modern High-Density Orchard';

  -- Insert orchard varieties for the first field
  INSERT INTO orchard_varieties (
    user_id, field_id, variety_name, variety_type, role, total_trees, 
    planted_trees, healthy_trees, production_per_tree, expected_yield, planting_date
  ) VALUES
  (v_user_id, v_field_id, 'Red Delicious / Delicious', 'traditional', 'both', 200, 200, 190, 25.5, 5100, '2020-03-15'),
  (v_user_id, v_field_id, 'Kashmir Golden / Golden Delicious', 'traditional', 'pollinator', 100, 100, 98, 22.0, 2200, '2020-03-15'),
  (v_user_id, v_field_id, 'Ambri', 'traditional', 'both', 150, 150, 145, 20.0, 3000, '2020-03-15');

  -- Insert orchard varieties for the second field
  INSERT INTO orchard_varieties (
    user_id, field_id, variety_name, variety_type, role, total_trees, 
    planted_trees, healthy_trees, production_per_tree, expected_yield, planting_date
  ) VALUES
  (v_user_id, v_field_id_2, 'Gala Scarlet / Redlum Gala', 'high_density', 'both', 300, 300, 285, 18.0, 5400, '2022-04-10'),
  (v_user_id, v_field_id_2, 'Auvi Fuji', 'high_density', 'main', 250, 250, 240, 20.0, 5000, '2022-04-10'),
  (v_user_id, v_field_id_2, 'Scarlet Spur-II', 'high_density', 'pollinator', 150, 150, 148, 15.0, 2250, '2022-04-10'),
  (v_user_id, v_field_id_2, 'Super Chief', 'high_density', 'both', 100, 100, 95, 22.0, 2200, '2022-04-10');

  -- Insert sample tree tags for precise tracking
  INSERT INTO tree_tags (
    user_id, field_id, name, variety, row_number, position_in_row, 
    latitude, longitude, health_status, planted_date
  ) VALUES
  -- Heritage Orchard trees
  (v_user_id, v_field_id, 'Red-R1-T1', 'Red Delicious / Delicious', 1, 1, 31.1048, 77.1734, 'Excellent', '2020-03-15'),
  (v_user_id, v_field_id, 'Red-R1-T2', 'Red Delicious / Delicious', 1, 2, 31.1049, 77.1735, 'Good', '2020-03-15'),
  (v_user_id, v_field_id, 'Golden-R1-T3', 'Kashmir Golden / Golden Delicious', 1, 3, 31.1050, 77.1736, 'Excellent', '2020-03-15'),
  (v_user_id, v_field_id, 'Ambri-R2-T1', 'Ambri', 2, 1, 31.1051, 77.1734, 'Good', '2020-03-15'),
  (v_user_id, v_field_id, 'Ambri-R2-T2', 'Ambri', 2, 2, 31.1052, 77.1735, 'Excellent', '2020-03-15'),
  
  -- Modern Orchard trees
  (v_user_id, v_field_id_2, 'Gala-R1-T1', 'Gala Scarlet / Redlum Gala', 1, 1, 31.9576, 77.1094, 'Good', '2022-04-10'),
  (v_user_id, v_field_id_2, 'Fuji-R1-T2', 'Auvi Fuji', 1, 2, 31.9577, 77.1095, 'Good', '2022-04-10'),
  (v_user_id, v_field_id_2, 'Scarlet-R1-T3', 'Scarlet Spur-II', 1, 3, 31.9578, 77.1096, 'Excellent', '2022-04-10'),
  (v_user_id, v_field_id_2, 'Chief-R2-T1', 'Super Chief', 2, 1, 31.9579, 77.1094, 'Good', '2022-04-10');

  -- Insert sample production records
  INSERT INTO production_records (
    user_id, field_id, variety_name, harvest_date, quantity, unit, 
    quality_grade, price_per_unit, buyer_name, weather_conditions, notes
  ) VALUES
  -- Heritage Orchard harvests (2023 season)
  (v_user_id, v_field_id, 'Red Delicious / Delicious', '2023-09-15', 2800.5, 'kg', 'A', 45.0, 'Local Fruit Market', 'Clear, dry weather', 'Excellent harvest quality'),
  (v_user_id, v_field_id, 'Kashmir Golden / Golden Delicious', '2023-09-20', 1200.0, 'kg', 'A', 50.0, 'Export Company', 'Sunny, perfect conditions', 'Premium export grade'),
  (v_user_id, v_field_id, 'Ambri', '2023-10-05', 1800.0, 'kg', 'A', 55.0, 'Specialty Store Chain', 'Cool, ideal for storage', 'Traditional variety premium'),
  
  -- Modern Orchard harvests (2024 season - first commercial harvest)
  (v_user_id, v_field_id_2, 'Gala Scarlet / Redlum Gala', '2024-08-25', 1500.0, 'kg', 'A', 48.0, 'Export Company', 'Perfect harvest weather', 'First commercial harvest - excellent results'),
  (v_user_id, v_field_id_2, 'Auvi Fuji', '2024-09-10', 1200.0, 'kg', 'A', 52.0, 'Premium Retailer', 'Optimal conditions', 'High-density success story');

  -- Insert enhanced activities
  INSERT INTO activities (
    user_id, field_id, title, description, kind, metadata
  ) VALUES
  (v_user_id, v_field_id, 'Orchard Pruning Completed', 'Annual winter pruning completed for all 450 trees in Heritage Orchard', 'success', 
   '{"activity_type": "maintenance", "trees_pruned": 450, "duration_days": 5}'::jsonb),
  (v_user_id, v_field_id, 'Pollination Support Added', 'Installed bee hives for enhanced pollination during flowering season', 'info',
   '{"activity_type": "pollination", "bee_hives": 8, "location": "orchard_center"}'::jsonb),
  (v_user_id, v_field_id_2, 'Drip Irrigation Installed', 'Modern drip irrigation system installed for water efficiency', 'success',
   '{"activity_type": "irrigation", "system_type": "drip", "coverage_area": 15.2}'::jsonb),
  (v_user_id, v_field_id_2, 'Soil Testing Completed', 'Comprehensive soil analysis shows optimal nutrient levels', 'info',
   '{"activity_type": "soil_analysis", "ph_level": 6.8, "organic_matter": "3.2%"}'::jsonb);

  -- Insert field analytics data
  INSERT INTO field_analytics (
    user_id, field_id, metric_type, metric_value, unit, recorded_date, notes
  ) VALUES
  -- Heritage Orchard analytics
  (v_user_id, v_field_id, 'tree_health_score', 92.5, 'percentage', CURRENT_DATE - INTERVAL '30 days', 'Overall health assessment'),
  (v_user_id, v_field_id, 'soil_ph', 6.5, 'ph', CURRENT_DATE - INTERVAL '60 days', 'Optimal for apple cultivation'),
  (v_user_id, v_field_id, 'canopy_coverage', 85.0, 'percentage', CURRENT_DATE - INTERVAL '15 days', 'Good canopy development'),
  (v_user_id, v_field_id, 'yield_per_tree', 23.2, 'kg', CURRENT_DATE - INTERVAL '90 days', 'Above average yield'),
  
  -- Modern Orchard analytics
  (v_user_id, v_field_id_2, 'tree_health_score', 88.0, 'percentage', CURRENT_DATE - INTERVAL '30 days', 'Young orchard showing good progress'),
  (v_user_id, v_field_id_2, 'soil_ph', 6.8, 'ph', CURRENT_DATE - INTERVAL '45 days', 'Excellent soil conditions'),
  (v_user_id, v_field_id_2, 'canopy_coverage', 70.0, 'percentage', CURRENT_DATE - INTERVAL '20 days', 'Developing well for 2-year trees'),
  (v_user_id, v_field_id_2, 'yield_per_tree', 8.5, 'kg', CURRENT_DATE - INTERVAL '120 days', 'Good first commercial harvest');

  RAISE NOTICE 'Sample orchard data created successfully for user %', v_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sample data: %', SQLERRM;
END $$;