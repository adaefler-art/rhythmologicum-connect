-- Migration: E79 - Fix anamnesis versioning trigger timing
-- Description: Run versioning trigger AFTER insert/update and add updated_at trigger
-- Date: 2026-02-10

-- Update versioning trigger function to avoid BEFORE insert FK issues
CREATE OR REPLACE FUNCTION public.anamnesis_entry_create_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_version_number INTEGER;
    v_previous_content JSONB;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM public.anamnesis_entry_versions
    WHERE entry_id = NEW.id;

    -- Get previous content for diff calculation
    IF TG_OP = 'UPDATE' THEN
        SELECT content INTO v_previous_content
        FROM public.anamnesis_entry_versions
        WHERE entry_id = NEW.id
        ORDER BY version_number DESC
        LIMIT 1;

        -- If no previous version, use OLD content
        IF v_previous_content IS NULL THEN
            v_previous_content := OLD.content;
        END IF;
    ELSE
        v_previous_content := NULL;
    END IF;

    -- Insert version record
    INSERT INTO public.anamnesis_entry_versions (
        entry_id,
        version_number,
        title,
        content,
        entry_type,
        tags,
        changed_by,
        changed_at,
        diff
    ) VALUES (
        NEW.id,
        v_version_number,
        NEW.title,
        NEW.content,
        NEW.entry_type,
        NEW.tags,
        COALESCE(NEW.updated_by, NEW.created_by, auth.uid()),
        NOW(),
        CASE
            WHEN v_previous_content IS NOT NULL THEN
                jsonb_build_object(
                    'from', v_previous_content,
                    'to', NEW.content
                )
            ELSE NULL
        END
    );

    RETURN NEW;
END;
$$;

-- Recreate versioning trigger to fire AFTER insert/update
DROP TRIGGER IF EXISTS trigger_anamnesis_entry_versioning ON public.anamnesis_entries;

CREATE TRIGGER trigger_anamnesis_entry_versioning
    AFTER INSERT OR UPDATE ON public.anamnesis_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.anamnesis_entry_create_version();

-- Maintain updated_at separately on update
CREATE OR REPLACE FUNCTION public.update_anamnesis_entries_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_anamnesis_entries_updated_at ON public.anamnesis_entries;

CREATE TRIGGER trigger_anamnesis_entries_updated_at
    BEFORE UPDATE ON public.anamnesis_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_anamnesis_entries_updated_at();
