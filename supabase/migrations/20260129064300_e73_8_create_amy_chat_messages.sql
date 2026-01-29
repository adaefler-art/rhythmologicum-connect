-- E73.8: AMY Frontdesk Chat - Create chat messages table
-- Purpose: Store conversation history for AMY chat with persistence across reloads
-- No control/navigation: This is read-only chat, no funnel/assessment mutations

CREATE TABLE "public"."amy_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL CHECK ("role" IN ('user', 'assistant', 'system')),
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::jsonb
);

ALTER TABLE "public"."amy_chat_messages" OWNER TO "postgres";

COMMENT ON TABLE "public"."amy_chat_messages" IS 'E73.8: AMY chat conversation history. Stores user and assistant messages for chat persistence. No control features - read-only chat.';

COMMENT ON COLUMN "public"."amy_chat_messages"."role" IS 'Message role: user (patient message), assistant (AMY response), system (context)';

COMMENT ON COLUMN "public"."amy_chat_messages"."metadata" IS 'Optional metadata: correlationId, model version, etc.';

-- Primary key
ALTER TABLE "public"."amy_chat_messages"
    ADD CONSTRAINT "amy_chat_messages_pkey" PRIMARY KEY ("id");

-- Foreign key to auth.users
ALTER TABLE "public"."amy_chat_messages"
    ADD CONSTRAINT "amy_chat_messages_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "auth"."users"("id") 
    ON DELETE CASCADE;

-- Index for fast user lookups
CREATE INDEX "amy_chat_messages_user_id_created_at_idx" 
    ON "public"."amy_chat_messages" ("user_id", "created_at" DESC);

-- RLS: Enable row-level security
ALTER TABLE "public"."amy_chat_messages" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Patients can only see their own chat messages
CREATE POLICY "amy_chat_messages_patient_select" 
    ON "public"."amy_chat_messages" 
    FOR SELECT 
    USING ("auth"."uid"() = "user_id");

-- RLS Policy: Patients can insert their own chat messages
CREATE POLICY "amy_chat_messages_patient_insert" 
    ON "public"."amy_chat_messages" 
    FOR INSERT 
    WITH CHECK ("auth"."uid"() = "user_id");

-- RLS Policy: No updates allowed (immutable chat history)
-- No update policy - messages are immutable

-- RLS Policy: No deletes allowed (preserve chat history)
-- No delete policy - preserve conversation history
