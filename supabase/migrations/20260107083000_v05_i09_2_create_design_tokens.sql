-- V05-I09.2: Design Tokens Parameterisierung (tenant/clinic override)
-- Creates design_tokens table for organization-specific design token overrides

-- Create design_tokens table
CREATE TABLE IF NOT EXISTS public.design_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    token_category text NOT NULL,
    token_key text NOT NULL,
    token_value jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT design_tokens_category_check CHECK (token_category IN ('spacing', 'typography', 'radii', 'shadows', 'motion', 'colors', 'componentTokens', 'layout')),
    CONSTRAINT design_tokens_unique_org_category_key UNIQUE (organization_id, token_category, token_key)
);

-- Create index for faster lookups by organization
CREATE INDEX idx_design_tokens_organization ON public.design_tokens(organization_id);
CREATE INDEX idx_design_tokens_category ON public.design_tokens(token_category);
CREATE INDEX idx_design_tokens_active ON public.design_tokens(is_active) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE public.design_tokens IS 'V05-I09.2: Organization-specific design token overrides. Allows tenant/clinic-level customization of the design system.';
COMMENT ON COLUMN public.design_tokens.organization_id IS 'Organization that owns this token override. NULL means global default.';
COMMENT ON COLUMN public.design_tokens.token_category IS 'Token category: spacing, typography, radii, shadows, motion, colors, componentTokens, layout';
COMMENT ON COLUMN public.design_tokens.token_key IS 'Token key within the category (e.g., "md" for spacing.md)';
COMMENT ON COLUMN public.design_tokens.token_value IS 'JSONB token value. Structure depends on token category.';
COMMENT ON COLUMN public.design_tokens.is_active IS 'Whether this token override is active';

-- Enable RLS
ALTER TABLE public.design_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can read active tokens
CREATE POLICY design_tokens_select_authenticated ON public.design_tokens
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Only admins can insert/update/delete tokens
CREATE POLICY design_tokens_admin_insert ON public.design_tokens
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (
                raw_app_meta_data->>'role' = 'admin'
                OR raw_app_meta_data->>'role' = 'clinician'
            )
        )
    );

CREATE POLICY design_tokens_admin_update ON public.design_tokens
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (
                raw_app_meta_data->>'role' = 'admin'
                OR raw_app_meta_data->>'role' = 'clinician'
            )
        )
    );

CREATE POLICY design_tokens_admin_delete ON public.design_tokens
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (
                raw_app_meta_data->>'role' = 'admin'
                OR raw_app_meta_data->>'role' = 'clinician'
            )
        )
    );

-- Create function to get merged design tokens for an organization
CREATE OR REPLACE FUNCTION public.get_design_tokens(org_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    category_name text;
BEGIN
    -- Initialize empty object
    result := '{}'::jsonb;
    
    -- Get all token categories
    FOR category_name IN 
        SELECT DISTINCT token_category 
        FROM public.design_tokens 
        WHERE is_active = true
    LOOP
        -- Build category object with overrides
        result := jsonb_set(
            result,
            ARRAY[category_name],
            COALESCE(
                (
                    SELECT jsonb_object_agg(token_key, token_value)
                    FROM public.design_tokens
                    WHERE token_category = category_name
                    AND is_active = true
                    AND (organization_id = org_id OR (org_id IS NULL AND organization_id IS NULL))
                ),
                '{}'::jsonb
            )
        );
    END LOOP;
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_design_tokens(uuid) IS 'V05-I09.2: Returns merged design tokens for the specified organization. NULL org_id returns global defaults.';
