-- V05-I07.4: Harden tasks table with org scoping + RLS
-- 
-- Security hardening:
-- 1. Add organization_id column for proper tenant isolation
-- 2. Update RLS policies to enforce org scoping
-- 3. Add constraints and indexes

-- Add organization_id column
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add foreign key constraint
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES public.organizations(id)
ON DELETE CASCADE;

-- Create index for org queries
CREATE INDEX IF NOT EXISTS tasks_organization_id_idx
ON public.tasks(organization_id);

-- Create compound index for common queries
CREATE INDEX IF NOT EXISTS tasks_org_status_created_idx
ON public.tasks(organization_id, status, created_at DESC);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Clinicians can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Patients can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can update assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can view assigned org tasks" ON public.tasks;

-- Create new org-scoped RLS policies

-- INSERT: Clinician/admin can create tasks in their org
CREATE POLICY "tasks_insert_clinician_admin"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be clinician or admin
  (public.has_any_role('clinician'::public.user_role) OR public.has_any_role('admin'::public.user_role))
  AND
  -- organization_id must match user's org (will be set server-side)
  organization_id = ANY(public.get_user_org_ids())
);

-- SELECT: Staff can view tasks in their org
CREATE POLICY "tasks_select_staff_org"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  -- User is staff (clinician/nurse/admin) in the task's organization
  (
    public.is_member_of_org(organization_id)
    AND
    (
      public.current_user_role(organization_id) = 'clinician'::public.user_role
      OR public.current_user_role(organization_id) = 'nurse'::public.user_role
      OR public.current_user_role(organization_id) = 'admin'::public.user_role
    )
  )
  OR
  -- Patient can view own tasks
  (
    patient_id = public.get_my_patient_profile_id()
  )
);

-- UPDATE: Staff can update tasks assigned to their role in their org
CREATE POLICY "tasks_update_assigned_staff"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  -- Must be in same org
  public.is_member_of_org(organization_id)
  AND
  (
    -- Admin can update any task
    public.current_user_role(organization_id) = 'admin'::public.user_role
    OR
    -- Staff can update tasks assigned to their role
    public.current_user_role(organization_id) = assigned_to_role
  )
)
WITH CHECK (
  -- Same constraints for updates
  public.is_member_of_org(organization_id)
  AND
  (
    public.current_user_role(organization_id) = 'admin'::public.user_role
    OR
    public.current_user_role(organization_id) = assigned_to_role
  )
);

-- Add comment
COMMENT ON COLUMN public.tasks.organization_id IS 'V05-I07.4: Organization for multi-tenant isolation. Set server-side, not client-trusted.';
