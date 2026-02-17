do $$
declare
  v_user_id uuid;
  v_email text;
begin
  select id, email
  into v_user_id, v_email
  from auth.users
  order by created_at
  limit 1;

  if v_user_id is null then
    raise notice 'No auth users found; seed skipped.';
    return;
  end if;

  insert into public.profiles (
    id,
    name,
    email,
    phone,
    farm_name,
    whatsapp,
    address,
    language,
    currency
  )
  values (
    v_user_id,
    'Demo User',
    v_email,
    '+0000000000',
    'Demo Farm',
    '+0000000000',
    'Demo Address',
    'en',
    'USD'
  )
  on conflict (id) do nothing;

  insert into public.fields (
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
    details
  )
  values
    (
      v_user_id,
      'North Orchard',
      12.5,
      'Sandy Loam',
      'Growing',
      'Good',
      'Demo District',
      '2025-01-15',
      31.5204,
      74.3587,
      '[]'::jsonb,
      '{}'::jsonb
    ),
    (
      v_user_id,
      'East Orchard',
      8.2,
      'Silt Loam',
      'Flowering',
      'Fair',
      'Demo District',
      '2024-10-05',
      31.515,
      74.36,
      '[]'::jsonb,
      '{}'::jsonb
    );

  insert into public.activities (
    user_id,
    title,
    kind
  )
  values
    (v_user_id, 'Irrigation completed', 'success'),
    (v_user_id, 'Pest alert in East Orchard', 'warning'),
    (v_user_id, 'Weather forecast updated', 'info');
end $$;
