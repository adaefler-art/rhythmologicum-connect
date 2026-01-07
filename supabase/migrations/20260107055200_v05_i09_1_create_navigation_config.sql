-- V05-I09.1: Admin Navigation/Layouts Config
-- Create tables for role-based navigation configuration

-- =============================================================================
-- Table: navigation_items
-- Purpose: Define available navigation items (routes) in the system
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL UNIQUE,
  default_label text NOT NULL,
  default_icon text,
  default_order integer NOT NULL,
  is_system boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT navigation_items_route_check CHECK (route ~ '^/[a-z0-9/_-]*$'),
  CONSTRAINT navigation_items_default_order_check CHECK (default_order >= 0)
);

COMMENT ON TABLE public.navigation_items IS 'V05-I09.1: Defines available navigation items in the application';
COMMENT ON COLUMN public.navigation_items.route IS 'URL route path (e.g., /clinician, /admin/content)';
COMMENT ON COLUMN public.navigation_items.default_label IS 'Default label shown in navigation';
COMMENT ON COLUMN public.navigation_items.default_icon IS 'Icon identifier (lucide-react icon name)';
COMMENT ON COLUMN public.navigation_items.default_order IS 'Default display order (0-based)';
COMMENT ON COLUMN public.navigation_items.is_system IS 'System items cannot be deleted, only disabled';

-- =============================================================================
-- Table: navigation_item_configs
-- Purpose: Role-specific overrides for navigation items
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.navigation_item_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  navigation_item_id uuid NOT NULL REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  custom_label text,
  custom_icon text,
  order_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT navigation_item_configs_unique UNIQUE(role, navigation_item_id),
  CONSTRAINT navigation_item_configs_role_check CHECK (role IN ('patient', 'clinician', 'admin', 'nurse')),
  CONSTRAINT navigation_item_configs_order_check CHECK (order_index >= 0)
);

COMMENT ON TABLE public.navigation_item_configs IS 'V05-I09.1: Role-specific navigation configuration overrides';
COMMENT ON COLUMN public.navigation_item_configs.role IS 'User role this config applies to';
COMMENT ON COLUMN public.navigation_item_configs.is_enabled IS 'Whether this item is shown for this role';
COMMENT ON COLUMN public.navigation_item_configs.custom_label IS 'Optional custom label override';
COMMENT ON COLUMN public.navigation_item_configs.custom_icon IS 'Optional custom icon override';
COMMENT ON COLUMN public.navigation_item_configs.order_index IS 'Display order for this role (0-based)';

-- =============================================================================
-- Indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_navigation_items_default_order 
  ON public.navigation_items(default_order);

CREATE INDEX IF NOT EXISTS idx_navigation_item_configs_role 
  ON public.navigation_item_configs(role);

CREATE INDEX IF NOT EXISTS idx_navigation_item_configs_role_order 
  ON public.navigation_item_configs(role, order_index);

COMMENT ON INDEX idx_navigation_item_configs_role IS 'V05-I09.1: Optimizes role-based navigation lookups';
COMMENT ON INDEX idx_navigation_item_configs_role_order IS 'V05-I09.1: Optimizes ordered navigation retrieval';

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_item_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read navigation items
CREATE POLICY "navigation_items_select_authenticated" 
  ON public.navigation_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins and clinicians can modify navigation items
CREATE POLICY "navigation_items_admin_modify" 
  ON public.navigation_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.role_memberships rm
      WHERE rm.user_id = auth.uid()
        AND rm.role IN ('admin', 'clinician')
        AND rm.is_active = true
    )
  );

-- Policy: Allow all authenticated users to read navigation configs
CREATE POLICY "navigation_item_configs_select_authenticated" 
  ON public.navigation_item_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins and clinicians can modify navigation configs
CREATE POLICY "navigation_item_configs_admin_modify" 
  ON public.navigation_item_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.role_memberships rm
      WHERE rm.user_id = auth.uid()
        AND rm.role IN ('admin', 'clinician')
        AND rm.is_active = true
    )
  );

-- =============================================================================
-- Trigger: Update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_navigation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER navigation_items_updated_at
  BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_navigation_updated_at();

CREATE TRIGGER navigation_item_configs_updated_at
  BEFORE UPDATE ON public.navigation_item_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_navigation_updated_at();

-- =============================================================================
-- Seed data: Default navigation items
-- =============================================================================

-- Insert default navigation items based on current roleBasedRouting.ts
INSERT INTO public.navigation_items (route, default_label, default_icon, default_order, is_system, description) VALUES
  -- Patient navigation
  ('/patient/funnels', 'Fragebogen starten', 'Workflow', 0, true, 'Patient: Start assessment funnels'),
  ('/patient/history', 'Mein Verlauf', 'History', 1, true, 'Patient: View assessment history'),
  
  -- Clinician/Admin shared navigation
  ('/clinician', 'Übersicht', 'LayoutDashboard', 0, true, 'Clinician/Admin: Dashboard overview'),
  ('/clinician/triage', 'Triage', 'Users', 1, true, 'Clinician/Admin: Patient triage'),
  ('/clinician/pre-screening', 'Pre-Screening', 'ClipboardCheck', 2, true, 'Clinician/Admin: Pre-screening calls'),
  ('/clinician/shipments', 'Geräteversand', 'Package', 3, true, 'Clinician/Admin: Device shipments'),
  ('/clinician/funnels', 'Fragebögen', 'Workflow', 4, true, 'Clinician/Admin: Funnel management'),
  ('/admin/content', 'Inhalte', 'FileText', 5, true, 'Clinician/Admin: Content management'),
  
  -- Admin-only navigation
  ('/admin/design-system', 'Design System', 'Palette', 6, true, 'Admin: Design system components')
ON CONFLICT (route) DO NOTHING;

-- Insert default configurations for each role
-- Patient role
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT 
  'patient',
  ni.id,
  true,
  ni.default_order
FROM public.navigation_items ni
WHERE ni.route IN ('/patient/funnels', '/patient/history')
ON CONFLICT (role, navigation_item_id) DO NOTHING;

-- Clinician role
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT 
  'clinician',
  ni.id,
  true,
  ni.default_order
FROM public.navigation_items ni
WHERE ni.route IN (
  '/clinician',
  '/clinician/triage',
  '/clinician/pre-screening',
  '/clinician/shipments',
  '/clinician/funnels',
  '/admin/content'
)
ON CONFLICT (role, navigation_item_id) DO NOTHING;

-- Admin role (includes Design System)
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT 
  'admin',
  ni.id,
  true,
  ni.default_order
FROM public.navigation_items ni
WHERE ni.route IN (
  '/clinician',
  '/clinician/triage',
  '/clinician/pre-screening',
  '/clinician/shipments',
  '/clinician/funnels',
  '/admin/content',
  '/admin/design-system'
)
ON CONFLICT (role, navigation_item_id) DO NOTHING;

-- Nurse role (subset of clinician)
INSERT INTO public.navigation_item_configs (role, navigation_item_id, is_enabled, order_index)
SELECT 
  'nurse',
  ni.id,
  true,
  ni.default_order
FROM public.navigation_items ni
WHERE ni.route IN (
  '/clinician',
  '/clinician/triage',
  '/clinician/shipments',
  '/clinician/funnels'
)
ON CONFLICT (role, navigation_item_id) DO NOTHING;
