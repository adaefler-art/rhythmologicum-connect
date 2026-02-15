# Rhythmologicum Connect – v0.4 Architecture Notes (Stub)

This file is a placeholder for architecture decisions and diagrams for v0.4.
It should be extended as implementation details evolve.

Recommended sections:

- Frontend layout & routing
- Funnel engine v2 (node types, flow)
- Content integration
- Data model changes
- API boundaries

## Data Model Changes

### Content Flow Mapping (Epic #208)

The `content_pages` table has been extended to support mapping content into funnel flows:

#### New Columns

- **`flow_step`** (TEXT, NULL): Identifies which step in the funnel flow this content page belongs to (e.g., "intro", "pre-assessment", "post-assessment"). NULL if not part of a specific flow step.

- **`order_index`** (INTEGER, NULL): Determines the display order of content pages within a flow step. Lower numbers appear first. NULL if ordering is not relevant.

#### Existing Columns (Related)

- **`funnel_id`** (UUID, NULL): Associates the content page with a specific funnel. Already existed before this enhancement.

#### Indexes

- `idx_content_pages_flow_step`: Partial index on `flow_step` WHERE NOT NULL
- `idx_content_pages_funnel_flow`: Composite index on `(funnel_id, flow_step)` WHERE both NOT NULL
- `idx_content_pages_order_index`: Partial index on `order_index` WHERE NOT NULL

#### Use Cases

1. **Intro Content**: Content pages shown at the start of a funnel (flow_step = 'intro')
2. **Intermediate Content**: Educational or informational content between assessment steps
3. **Result Content**: Additional information shown after assessment completion
4. **Ordered Collections**: Multiple content pages within the same flow step, ordered by order_index

#### Migration

- **File**: `supabase/migrations/20251212220145_add_content_flow_mapping.sql`
- **Date**: 2025-12-12
- **Status**: ✅ Implemented
