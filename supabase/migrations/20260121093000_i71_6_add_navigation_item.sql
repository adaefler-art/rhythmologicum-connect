-- I71.6: Add /admin/navigation to navigation items
-- This allows admins/clinicians to manage navigation configuration

-- Insert navigation management item
INSERT INTO public.navigation_items (route, default_label, default_icon, default_order, is_system, description) VALUES
  ('/admin/navigation', 'Navigation', 'Settings', 7, true, 'Admin/Clinician: Manage navigation configuration')
ON CONFLICT (route) DO NOTHING;

-- Add to admin role config
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT 
  'admin',
  ni.id,
  true,
  7
FROM public.navigation_items ni
WHERE ni.route = '/admin/navigation'
ON CONFLICT (role, navigation_item_id) DO NOTHING;

-- Add to clinician role config
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT 
  'clinician',
  ni.id,
  true,
  6
FROM public.navigation_items ni
WHERE ni.route = '/admin/navigation'
ON CONFLICT (role, navigation_item_id) DO NOTHING;
