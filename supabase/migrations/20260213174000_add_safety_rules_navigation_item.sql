-- Add Safety Rules page to clinician/admin navigation

INSERT INTO public.navigation_items (route, default_label, default_icon, default_order, is_system, description)
VALUES
  ('/clinician/admin/safety-rules', 'Safety Rules', 'Shield', 9, true, 'Clinician/Admin: Configure safety rules')
ON CONFLICT (route) DO NOTHING;

-- Enable for admin role
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT
  'admin',
  ni.id,
  true,
  9
FROM public.navigation_items ni
WHERE ni.route = '/clinician/admin/safety-rules'
ON CONFLICT (role, navigation_item_id) DO NOTHING;

-- Enable for clinician role
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT
  'clinician',
  ni.id,
  true,
  8
FROM public.navigation_items ni
WHERE ni.route = '/clinician/admin/safety-rules'
ON CONFLICT (role, navigation_item_id) DO NOTHING;
