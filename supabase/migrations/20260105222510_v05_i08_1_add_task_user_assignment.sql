-- V05-I08.1: Add user-level task assignment for nurses
-- 
-- Security fix: Nurses should only see tasks explicitly assigned to them,
-- not all org tasks. This migration adds assigned_to_user_id column and
-- updates RLS policies to enforce least-privilege access.

-- Add assigned_to_user_id column for user-level assignment
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID;

-- Add foreign key constraint to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'tasks_assigned_to_user_id_fkey'
      AND n.nspname = 'public'
      AND t.relname = 'tasks'
  ) THEN
    ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_assigned_to_user_id_fkey
    FOREIGN KEY (assigned_to_user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for user assignment queries
CREATE INDEX IF NOT EXISTS tasks_assigned_to_user_id_idx
ON public.tasks(assigned_to_user_id)
WHERE assigned_to_user_id IS NOT NULL;

-- Create compound index for nurse queries (user + status)
CREATE INDEX IF NOT EXISTS tasks_assigned_user_status_idx
ON public.tasks(assigned_to_user_id, status, created_at DESC)
WHERE assigned_to_user_id IS NOT NULL;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "tasks_select_staff_org" ON public.tasks;

-- Create new SELECT policy with least-privilege enforcement
CREATE POLICY "tasks_select_staff_org"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  -- Clinicians and admins: can view all org tasks
  (
    public.is_member_of_org(organization_id)
    AND
    (
      public.current_user_role(organization_id) = 'clinician'::public.user_role
      OR
      public.current_user_role(organization_id) = 'admin'::public.user_role
    )
  )
  OR
  -- Nurses: can ONLY view tasks explicitly assigned to them
  (
    public.is_member_of_org(organization_id)
    AND
    public.current_user_role(organization_id) = 'nurse'::public.user_role
    AND
    assigned_to_user_id = auth.uid()
  )
  OR
  -- Patients: can view their own tasks
  (
    patient_id = public.get_my_patient_profile_id()
  )
);

-- Add column comment
COMMENT ON COLUMN public.tasks.assigned_to_user_id IS 'V05-I08.1: User-level task assignment. Nurses can only see tasks assigned to them (RLS enforced). Clinicians/admins see all org tasks.';
