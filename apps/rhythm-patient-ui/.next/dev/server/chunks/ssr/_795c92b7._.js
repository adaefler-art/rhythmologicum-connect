module.exports = [
"[project]/lib/env.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "env",
    ()=>env,
    "getEngineEnv",
    ()=>getEngineEnv,
    "getEnv",
    ()=>getEnv,
    "getPatientEnv",
    ()=>getPatientEnv,
    "getStudioEnv",
    ()=>getStudioEnv,
    "isDevEndpointCatalogEnabled",
    ()=>isDevEndpointCatalogEnabled,
    "isDevelopment",
    ()=>isDevelopment,
    "isProduction",
    ()=>isProduction,
    "isTest",
    ()=>isTest
]);
/**
 * Environment Variables Schema and Validation
 * 
 * This file provides type-safe access to environment variables using Zod validation.
 * All environment variables MUST be accessed through this module to ensure:
 * 1. Type safety
 * 2. Runtime validation
 * 3. Clear documentation of required vs. optional variables
 * 4. Fail-fast behavior for missing required variables
 * 
 * **IMPORTANT**: This file is protected by CODEOWNERS. Any changes require review.
 * 
 * Usage:
 * ```typescript
 * import { env } from '@/lib/env'
 * 
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
 * const apiKey = env.ANTHROPIC_API_KEY // Can be undefined
 * ```
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
;
// ============================================================
// Environment Schema Definition
// ============================================================
// IMPORTANT:
// - NEXT_PUBLIC_* vars can be read in both server + client bundles.
// - Server-only secrets (e.g. SUPABASE_SERVICE_ROLE_KEY) must never be
//   required/validated in the browser, otherwise production will crash.
const isServerRuntime = ("TURBOPACK compile-time value", "undefined") === 'undefined';
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const isProdRuntime = ("TURBOPACK compile-time value", "development") === 'production';
const requireServerSecrets = isServerRuntime && isProdRuntime && !isBuildTime;
function sanitizeEnvString(value) {
    if (typeof value !== 'string') return value;
    let v = value.trim();
    // Common deployment UI pitfall: values pasted with wrapping quotes/backticks.
    // Remove exactly one wrapping pair to avoid breaking legitimate inner quotes.
    const first = v[0];
    const last = v[v.length - 1];
    const isWrapped = first === '"' && last === '"' || first === "'" && last === "'" || first === '`' && last === '`';
    if (isWrapped && v.length >= 2) {
        v = v.slice(1, -1).trim();
    }
    return v;
}
const baseEnvSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Client-safe vars (may be inlined at build time by Next.js)
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()),
    // OPTIONAL: Review Queue Sampling
    REVIEW_SAMPLING_PERCENTAGE: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    REVIEW_SAMPLING_SALT: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: Feature Flags
    NEXT_PUBLIC_FEATURE_AMY_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: E6.4.1 Pilot Feature Flags
    NEXT_PUBLIC_PILOT_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXT_PUBLIC_PILOT_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Node Environment
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'development',
        'production',
        'test'
    ]).optional(),
    NEXT_PHASE: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Hosting provider (optional)
    VERCEL_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: Usage Telemetry Toggle
    USAGE_TELEMETRY_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const serverOnlyEnvSchema = baseEnvSchema.extend({
    // OPTIONAL: Dev/Admin tooling feature flags
    DEV_ENDPOINT_CATALOG: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: UI split routing (Package 2)
    STUDIO_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    PATIENT_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    ENGINE_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    // OPTIONAL: E6.4.1 Pilot Allowlists (server-only)
    PILOT_ORG_ALLOWLIST: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    PILOT_USER_ALLOWLIST: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // REQUIRED (server runtime only): Supabase Admin
    SUPABASE_SERVICE_ROLE_KEY: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()),
    // OPTIONAL: Anthropic AI Configuration
    ANTHROPIC_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    ANTHROPIC_API_TOKEN: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    ANTHROPIC_MODEL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: Legacy/Alternative Variable Names
    SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    SUPABASE_SERVICE_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional())
});
const patientEnvSchema = baseEnvSchema.extend({
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('NEXT_PUBLIC_SUPABASE_URL is required')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')),
    ENGINE_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('ENGINE_BASE_URL is required'))
});
const studioEnvSchema = baseEnvSchema.extend({
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('NEXT_PUBLIC_SUPABASE_URL is required')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'))
});
const engineEnvSchema = serverOnlyEnvSchema.extend({
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('NEXT_PUBLIC_SUPABASE_URL is required')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'))
});
function getRawClientEnv() {
    return {
        NEXT_PUBLIC_SUPABASE_URL: ("TURBOPACK compile-time value", "https://dummy.supabase.co"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ("TURBOPACK compile-time value", "dummy-anon-key"),
        REVIEW_SAMPLING_PERCENTAGE: process.env.REVIEW_SAMPLING_PERCENTAGE,
        REVIEW_SAMPLING_SALT: process.env.REVIEW_SAMPLING_SALT,
        NEXT_PUBLIC_FEATURE_AMY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
        NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
        NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
        NEXT_PUBLIC_PILOT_ENABLED: process.env.NEXT_PUBLIC_PILOT_ENABLED,
        NEXT_PUBLIC_PILOT_ENV: process.env.NEXT_PUBLIC_PILOT_ENV,
        NODE_ENV: ("TURBOPACK compile-time value", "development"),
        NEXT_PHASE: process.env.NEXT_PHASE,
        VERCEL_ENV: process.env.VERCEL_ENV,
        USAGE_TELEMETRY_ENABLED: process.env.USAGE_TELEMETRY_ENABLED
    };
}
function getRawServerEnv() {
    return {
        DEV_ENDPOINT_CATALOG: process.env.DEV_ENDPOINT_CATALOG,
        STUDIO_BASE_URL: process.env.STUDIO_BASE_URL,
        PATIENT_BASE_URL: process.env.PATIENT_BASE_URL,
        ENGINE_BASE_URL: process.env.ENGINE_BASE_URL,
        PILOT_ORG_ALLOWLIST: process.env.PILOT_ORG_ALLOWLIST,
        PILOT_USER_ALLOWLIST: process.env.PILOT_USER_ALLOWLIST,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        ANTHROPIC_API_TOKEN: process.env.ANTHROPIC_API_TOKEN,
        ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
    };
}
/**
 * Get default environment values for development/build time
 */ function getDefaultEnv() {
    return {
        NEXT_PUBLIC_SUPABASE_URL: ("TURBOPACK compile-time value", "https://dummy.supabase.co") || process.env.SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ("TURBOPACK compile-time value", "dummy-anon-key") || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN,
        ANTHROPIC_API_TOKEN: process.env.ANTHROPIC_API_TOKEN,
        ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
        REVIEW_SAMPLING_PERCENTAGE: process.env.REVIEW_SAMPLING_PERCENTAGE,
        REVIEW_SAMPLING_SALT: process.env.REVIEW_SAMPLING_SALT,
        NEXT_PUBLIC_FEATURE_AMY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
        NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
        NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
        NEXT_PUBLIC_PILOT_ENABLED: process.env.NEXT_PUBLIC_PILOT_ENABLED,
        NEXT_PUBLIC_PILOT_ENV: process.env.NEXT_PUBLIC_PILOT_ENV,
        PILOT_ORG_ALLOWLIST: process.env.PILOT_ORG_ALLOWLIST,
        PILOT_USER_ALLOWLIST: process.env.PILOT_USER_ALLOWLIST,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        NODE_ENV: ("TURBOPACK compile-time value", "development"),
        NEXT_PHASE: process.env.NEXT_PHASE,
        VERCEL_ENV: process.env.VERCEL_ENV,
        USAGE_TELEMETRY_ENABLED: process.env.USAGE_TELEMETRY_ENABLED,
        DEV_ENDPOINT_CATALOG: process.env.DEV_ENDPOINT_CATALOG,
        STUDIO_BASE_URL: process.env.STUDIO_BASE_URL,
        PATIENT_BASE_URL: process.env.PATIENT_BASE_URL,
        ENGINE_BASE_URL: process.env.ENGINE_BASE_URL
    };
}
function getMissingEnvKeys(issues) {
    const keys = new Set();
    issues.forEach((issue)=>{
        const pathKey = issue.path[0];
        if (typeof pathKey === 'string') {
            keys.add(pathKey);
        }
    });
    return Array.from(keys);
}
function parseScopedEnv(schema, options = {}) {
    const rawEnv = ("TURBOPACK compile-time truthy", 1) ? {
        ...getRawClientEnv(),
        ...getRawServerEnv()
    } : "TURBOPACK unreachable";
    try {
        const parsed = schema.parse(rawEnv);
        return {
            NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL || parsed.SUPABASE_URL || '',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            SUPABASE_SERVICE_ROLE_KEY: parsed.SUPABASE_SERVICE_ROLE_KEY || parsed.SUPABASE_SERVICE_KEY || '',
            ANTHROPIC_API_KEY: parsed.ANTHROPIC_API_KEY || parsed.ANTHROPIC_API_TOKEN,
            ANTHROPIC_API_TOKEN: parsed.ANTHROPIC_API_TOKEN,
            ANTHROPIC_MODEL: parsed.ANTHROPIC_MODEL,
            REVIEW_SAMPLING_PERCENTAGE: parsed.REVIEW_SAMPLING_PERCENTAGE,
            REVIEW_SAMPLING_SALT: parsed.REVIEW_SAMPLING_SALT,
            NEXT_PUBLIC_FEATURE_AMY_ENABLED: parsed.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
            NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: parsed.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
            NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: parsed.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
            NEXT_PUBLIC_PILOT_ENABLED: parsed.NEXT_PUBLIC_PILOT_ENABLED,
            NEXT_PUBLIC_PILOT_ENV: parsed.NEXT_PUBLIC_PILOT_ENV,
            PILOT_ORG_ALLOWLIST: parsed.PILOT_ORG_ALLOWLIST,
            PILOT_USER_ALLOWLIST: parsed.PILOT_USER_ALLOWLIST,
            SUPABASE_URL: parsed.SUPABASE_URL,
            SUPABASE_SERVICE_KEY: parsed.SUPABASE_SERVICE_KEY,
            NODE_ENV: parsed.NODE_ENV,
            NEXT_PHASE: parsed.NEXT_PHASE,
            VERCEL_ENV: parsed.VERCEL_ENV,
            USAGE_TELEMETRY_ENABLED: parsed.USAGE_TELEMETRY_ENABLED,
            DEV_ENDPOINT_CATALOG: parsed.DEV_ENDPOINT_CATALOG,
            STUDIO_BASE_URL: parsed.STUDIO_BASE_URL,
            PATIENT_BASE_URL: parsed.PATIENT_BASE_URL,
            ENGINE_BASE_URL: parsed.ENGINE_BASE_URL
        };
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            const missingKeys = getMissingEnvKeys(error.issues);
            const message = missingKeys.length ? `Missing env: ${missingKeys.join(', ')}` : 'Invalid environment variables';
            console.error('❌ Environment variable validation failed:');
            console.error(error.issues.map((e)=>`  - ${e.path.join('.')}: ${e.message}`).join('\n'));
            // During build, allow with defaults
            if (isBuildTime) {
                console.warn('⚠️  Build time: Continuing with default values');
                return getDefaultEnv();
            }
            if (options.strict && isServerRuntime) {
                throw new Error(message);
            }
            // In development or non-strict mode, warn but allow build to continue with default values
            console.warn(`⚠️  Continuing with default values for ${options.scope ?? 'base'} environment`);
            return getDefaultEnv();
        }
        throw error;
    }
}
/**
 * Parse and validate environment variables
 * This will not throw in base mode to avoid import-time crashes
 */ function parseEnv() {
    const schema = ("TURBOPACK compile-time truthy", 1) ? serverOnlyEnvSchema : "TURBOPACK unreachable";
    return parseScopedEnv(schema, {
        strict: false,
        scope: 'base'
    });
}
/**
 * Validated and type-safe environment variables
 * Access all environment variables through this object
 */ let cachedEnv = null;
function getEnv() {
    if (!cachedEnv) {
        cachedEnv = parseEnv();
    }
    return cachedEnv;
}
function getPatientEnv() {
    return parseScopedEnv(patientEnvSchema, {
        strict: true,
        scope: 'patient'
    });
}
function getStudioEnv() {
    return parseScopedEnv(studioEnvSchema, {
        strict: true,
        scope: 'studio'
    });
}
function getEngineEnv() {
    return parseScopedEnv(engineEnvSchema, {
        strict: true,
        scope: 'engine'
    });
}
const env = new Proxy({}, {
    get (_target, prop) {
        return getEnv()[prop];
    },
    set (_target, prop, value) {
        const current = getEnv();
        current[prop] = value;
        return true;
    }
});
function isDevEndpointCatalogEnabled() {
    return process.env.DEV_ENDPOINT_CATALOG === '1';
}
function isProduction() {
    return env.NODE_ENV === 'production';
}
function isDevelopment() {
    return env.NODE_ENV === 'development' || !env.NODE_ENV;
}
function isTest() {
    return env.NODE_ENV === 'test';
}
}),
"[project]/lib/db/supabase.server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createRouteSupabaseClient",
    ()=>createRouteSupabaseClient,
    "createServerSupabaseClient",
    ()=>createServerSupabaseClient,
    "getCurrentUser",
    ()=>getCurrentUser,
    "getUserRole",
    ()=>getUserRole,
    "hasAdminOrClinicianRole",
    ()=>hasAdminOrClinicianRole,
    "hasClinicianRole",
    ()=>hasClinicianRole
]);
/**
 * Server Supabase Client (SSR with User Session)
 * 
 * This is the DEFAULT client for server-side code.
 * - Uses anon key + cookie-based authentication
 * - RLS policies are ACTIVE (user context preserved)
 * - Server-only (never bundled to browser)
 * 
 * Use this for:
 * - API routes
 * - Server components
 * - Server actions
 * - Any server code that needs user-scoped access
 * 
 * @module lib/db/supabase.server
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-rsc] (ecmascript)");
;
;
;
async function createServerSupabaseClient() {
    const url = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error('Supabase configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
    }
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(url, anonKey, {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, {
                            ...options,
                            path: options?.path ?? '/'
                        }));
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing sessions.
                }
            }
        }
    });
}
function createRouteSupabaseClient(req) {
    const url = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error('Supabase configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
    }
    const pendingCookies = [];
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(url, anonKey, {
        cookies: {
            getAll () {
                return req.cookies.getAll();
            },
            setAll (cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options })=>{
                    pendingCookies.push({
                        name,
                        value,
                        options
                    });
                });
            }
        }
    });
    const applyCookies = (response)=>{
        pendingCookies.forEach(({ name, value, options })=>{
            response.cookies.set(name, value, options);
        });
        return response;
    };
    return {
        supabase,
        applyCookies
    };
}
async function getCurrentUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
async function hasClinicianRole() {
    const user = await getCurrentUser();
    if (!user) return false;
    // Check in app_metadata and user_metadata
    const role = user.app_metadata?.role || user.user_metadata?.role;
    return role === 'clinician' || role === 'admin';
}
async function hasAdminOrClinicianRole() {
    return hasClinicianRole();
}
async function getUserRole() {
    const user = await getCurrentUser();
    if (!user) return null;
    return user.app_metadata?.role || user.user_metadata?.role || null;
}
}),
"[project]/lib/contracts/registry.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Contract Registry - Canonical Identifiers
 * 
 * This file serves as the single source of truth for all critical string identifiers
 * used throughout the application. All new identifiers MUST be added here to prevent
 * "fantasy names" and ensure consistency.
 * 
 * **IMPORTANT**: This file is protected by CODEOWNERS. Any changes require review.
 * 
 * Usage:
 * ```typescript
 * import { ASSESSMENT_STATUS, FUNNEL_SLUG, USER_ROLE } from '@/lib/contracts/registry'
 * 
 * const status: AssessmentStatus = ASSESSMENT_STATUS.IN_PROGRESS
 * const funnel: FunnelSlug = FUNNEL_SLUG.STRESS_ASSESSMENT
 * ```
 */ // ============================================================
// Assessment Statuses
// ============================================================
/**
 * Valid statuses for assessments
 */ __turbopack_context__.s([
    "ASSESSMENT_STATUS",
    ()=>ASSESSMENT_STATUS,
    "AUDIT_ACTION",
    ()=>AUDIT_ACTION,
    "AUDIT_ENTITY_TYPE",
    ()=>AUDIT_ENTITY_TYPE,
    "AUDIT_SOURCE",
    ()=>AUDIT_SOURCE,
    "CONTENT_STATUS",
    ()=>CONTENT_STATUS,
    "CURRENT_EXTRACTOR_VERSION",
    ()=>CURRENT_EXTRACTOR_VERSION,
    "EXTRACTOR_VERSION",
    ()=>EXTRACTOR_VERSION,
    "FEATURE_FLAG",
    ()=>FEATURE_FLAG,
    "FUNNEL_SLUG",
    ()=>FUNNEL_SLUG,
    "FUNNEL_SLUG_ALIASES",
    ()=>FUNNEL_SLUG_ALIASES,
    "NODE_TYPE",
    ()=>NODE_TYPE,
    "PATIENT_SEX",
    ()=>PATIENT_SEX,
    "PILLAR_KEY",
    ()=>PILLAR_KEY,
    "PROCESSING_STAGE",
    ()=>PROCESSING_STAGE,
    "PROCESSING_STATUS",
    ()=>PROCESSING_STATUS,
    "PROGRAM_TIER",
    ()=>PROGRAM_TIER,
    "QUESTION_TYPE",
    ()=>QUESTION_TYPE,
    "USER_ROLE",
    ()=>USER_ROLE,
    "getCanonicalFunnelSlug",
    ()=>getCanonicalFunnelSlug,
    "isKnownFunnelSlug",
    ()=>isKnownFunnelSlug,
    "isValidAssessmentStatus",
    ()=>isValidAssessmentStatus,
    "isValidAuditAction",
    ()=>isValidAuditAction,
    "isValidAuditEntityType",
    ()=>isValidAuditEntityType,
    "isValidAuditSource",
    ()=>isValidAuditSource,
    "isValidContentStatus",
    ()=>isValidContentStatus,
    "isValidExtractorVersion",
    ()=>isValidExtractorVersion,
    "isValidNodeType",
    ()=>isValidNodeType,
    "isValidPatientSex",
    ()=>isValidPatientSex,
    "isValidPillarKey",
    ()=>isValidPillarKey,
    "isValidProcessingStage",
    ()=>isValidProcessingStage,
    "isValidProcessingStatus",
    ()=>isValidProcessingStatus,
    "isValidProgramTier",
    ()=>isValidProgramTier,
    "isValidUserRole",
    ()=>isValidUserRole
]);
const ASSESSMENT_STATUS = {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
};
const CONTENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};
const PILLAR_KEY = {
    NUTRITION: 'nutrition',
    MOVEMENT: 'movement',
    SLEEP: 'sleep',
    MENTAL_HEALTH: 'mental-health',
    SOCIAL: 'social',
    MEANING: 'meaning',
    PREVENTION: 'prevention'
};
const FUNNEL_SLUG = {
    STRESS_ASSESSMENT: 'stress-assessment',
    CARDIOVASCULAR_AGE: 'cardiovascular-age',
    SLEEP_QUALITY: 'sleep-quality',
    HEART_HEALTH_NUTRITION: 'heart-health-nutrition',
    // Legacy aliases - deprecated but maintained for compatibility
    STRESS: 'stress',
    STRESS_CHECK: 'stress-check',
    STRESS_CHECK_V2: 'stress-check-v2'
};
const FUNNEL_SLUG_ALIASES = {
    'stress': FUNNEL_SLUG.STRESS_ASSESSMENT,
    'stress-check': FUNNEL_SLUG.STRESS_ASSESSMENT,
    'stress-check-v2': FUNNEL_SLUG.STRESS_ASSESSMENT
};
function getCanonicalFunnelSlug(slug) {
    const normalized = slug.toLowerCase().trim();
    return FUNNEL_SLUG_ALIASES[normalized] || normalized;
}
function isKnownFunnelSlug(slug) {
    const canonical = getCanonicalFunnelSlug(slug);
    const allSlugs = Object.values(FUNNEL_SLUG);
    return allSlugs.includes(canonical);
}
const NODE_TYPE = {
    QUESTION_STEP: 'question_step',
    FORM: 'form',
    INFO_STEP: 'info_step',
    INFO: 'info',
    CONTENT_PAGE: 'content_page',
    SUMMARY: 'summary',
    OTHER: 'other'
};
const USER_ROLE = {
    PATIENT: 'patient',
    CLINICIAN: 'clinician',
    ADMIN: 'admin',
    NURSE: 'nurse'
};
const QUESTION_TYPE = {
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    TEXT: 'text',
    TEXTAREA: 'textarea',
    NUMBER: 'number',
    SCALE: 'scale',
    SLIDER: 'slider'
};
const PATIENT_SEX = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
    PREFER_NOT_TO_SAY: 'prefer_not_to_say'
};
const FEATURE_FLAG = {
    AMY_ENABLED: 'AMY_ENABLED',
    CLINICIAN_DASHBOARD_ENABLED: 'CLINICIAN_DASHBOARD_ENABLED',
    CHARTS_ENABLED: 'CHARTS_ENABLED'
};
function isValidAssessmentStatus(value) {
    return typeof value === 'string' && Object.values(ASSESSMENT_STATUS).includes(value);
}
function isValidContentStatus(value) {
    return typeof value === 'string' && Object.values(CONTENT_STATUS).includes(value);
}
function isValidUserRole(value) {
    return typeof value === 'string' && Object.values(USER_ROLE).includes(value);
}
function isValidNodeType(value) {
    return typeof value === 'string' && Object.values(NODE_TYPE).includes(value);
}
function isValidPillarKey(value) {
    return typeof value === 'string' && Object.values(PILLAR_KEY).includes(value);
}
function isValidPatientSex(value) {
    return typeof value === 'string' && Object.values(PATIENT_SEX).includes(value);
}
const AUDIT_ENTITY_TYPE = {
    ASSESSMENT: 'assessment',
    REPORT: 'report',
    TASK: 'task',
    FUNNEL_VERSION: 'funnel_version',
    FUNNEL_CATALOG: 'funnel_catalog',
    CONFIG: 'config',
    CONSENT: 'consent',
    ORGANIZATION: 'organization',
    USER_ORG_MEMBERSHIP: 'user_org_membership',
    CLINICIAN_ASSIGNMENT: 'clinician_assignment',
    DOCUMENT: 'document',
    PROCESSING_JOB: 'processing_job',
    REVIEW_RECORD: 'review_record',
    PRE_SCREENING_CALL: 'pre_screening_call',
    DEVICE_SHIPMENT: 'device_shipment',
    SUPPORT_CASE: 'support_case',
    ACCOUNT: 'account'
};
const AUDIT_ACTION = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    APPROVE: 'approve',
    REJECT: 'reject',
    REQUEST_CHANGES: 'request_changes',
    GENERATE: 'generate',
    FLAG: 'flag',
    ASSIGN: 'assign',
    ACTIVATE: 'activate',
    DEACTIVATE: 'deactivate',
    ROLLOUT: 'rollout',
    COMPLETE: 'complete',
    ESCALATE: 'escalate',
    DELETION_REQUEST: 'deletion_request',
    DELETION_CANCEL: 'deletion_cancel',
    DELETION_EXECUTE: 'deletion_execute',
    ANONYMIZE: 'anonymize'
};
const AUDIT_SOURCE = {
    API: 'api',
    JOB: 'job',
    ADMIN_UI: 'admin-ui',
    SYSTEM: 'system'
};
function isValidAuditEntityType(value) {
    return typeof value === 'string' && Object.values(AUDIT_ENTITY_TYPE).includes(value);
}
function isValidAuditAction(value) {
    return typeof value === 'string' && Object.values(AUDIT_ACTION).includes(value);
}
function isValidAuditSource(value) {
    return typeof value === 'string' && Object.values(AUDIT_SOURCE).includes(value);
}
const PROGRAM_TIER = {
    /**
   * Tier 1 (Essential): Basic stress/resilience assessment
   * Focus: Initial assessment, baseline data collection
   */ TIER_1_ESSENTIAL: 'tier-1-essential',
    /**
   * Tier 2.5 (Enhanced): Extended monitoring with nurse touchpoints
   * Focus: Regular check-ins, progress tracking
   */ TIER_2_5_ENHANCED: 'tier-2-5-enhanced',
    /**
   * Tier 2 (Comprehensive): Full program with intensive support
   * Focus: Comprehensive care, multiple pillars, frequent touchpoints
   */ TIER_2_COMPREHENSIVE: 'tier-2-comprehensive'
};
function isValidProgramTier(value) {
    return typeof value === 'string' && Object.values(PROGRAM_TIER).includes(value);
}
const EXTRACTOR_VERSION = {
    /**
   * v1.0.0: Initial extraction pipeline
   * - Basic lab value extraction
   * - Medication list extraction
   * - Confidence scoring
   */ V1_0_0: 'v1.0.0'
};
const CURRENT_EXTRACTOR_VERSION = EXTRACTOR_VERSION.V1_0_0;
function isValidExtractorVersion(value) {
    return typeof value === 'string' && Object.values(EXTRACTOR_VERSION).includes(value);
}
const PROCESSING_STAGE = {
    PENDING: 'pending',
    RISK: 'risk',
    RANKING: 'ranking',
    CONTENT: 'content',
    VALIDATION: 'validation',
    REVIEW: 'review',
    PDF: 'pdf',
    DELIVERY: 'delivery',
    COMPLETED: 'completed',
    FAILED: 'failed'
};
const PROCESSING_STATUS = {
    QUEUED: 'queued',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};
function isValidProcessingStage(value) {
    return typeof value === 'string' && Object.values(PROCESSING_STAGE).includes(value);
}
function isValidProcessingStatus(value) {
    return typeof value === 'string' && Object.values(PROCESSING_STATUS).includes(value);
}
}),
"[project]/lib/contracts/onboarding.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaselineProfileSchema",
    ()=>BaselineProfileSchema,
    "CURRENT_CONSENT_VERSION",
    ()=>CURRENT_CONSENT_VERSION,
    "ConsentFormSchema",
    ()=>ConsentFormSchema,
    "ConsentRecordSchema",
    ()=>ConsentRecordSchema,
    "ONBOARDING_STATUS",
    ()=>ONBOARDING_STATUS,
    "OnboardingStatusSchema",
    ()=>OnboardingStatusSchema,
    "PatientProfileSchema",
    ()=>PatientProfileSchema
]);
/**
 * Onboarding Contracts
 * 
 * Zod schemas and types for patient onboarding flow:
 * - Consent management
 * - Baseline profile collection
 * 
 * @module lib/contracts/onboarding
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/contracts/registry.ts [app-rsc] (ecmascript)");
;
;
const CURRENT_CONSENT_VERSION = '1.0.0';
const ConsentFormSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    consentVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Consent version is required'),
    agreedToTerms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((val)=>val === true, {
        message: 'You must agree to the terms to continue'
    })
});
const ConsentRecordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
    consent_version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    consented_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime(),
    ip_address: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
    user_agent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable()
});
const BaselineProfileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    full_name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters').trim(),
    birth_year: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int('Birth year must be a whole number').min(1900, 'Birth year must be 1900 or later').max(new Date().getFullYear(), 'Birth year cannot be in the future').optional().nullable(),
    sex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PATIENT_SEX"].MALE,
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PATIENT_SEX"].FEMALE,
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PATIENT_SEX"].OTHER,
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$registry$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PATIENT_SEX"].PREFER_NOT_TO_SAY
    ], {
        message: 'Please select a valid option'
    }).optional().nullable()
});
const ONBOARDING_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
};
const PatientProfileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
    user_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid(),
    created_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime(),
    full_name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
    birth_year: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().nullable(),
    sex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
    onboarding_status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'not_started',
        'in_progress',
        'completed'
    ]).optional()
});
const OnboardingStatusSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    hasConsent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    hasProfile: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    isComplete: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'not_started',
        'in_progress',
        'completed'
    ]).optional()
});
}),
"[project]/lib/audit/log.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logAccountAnonymize",
    ()=>logAccountAnonymize,
    "logAccountDeletionCancel",
    ()=>logAccountDeletionCancel,
    "logAccountDeletionExecute",
    ()=>logAccountDeletionExecute,
    "logAccountDeletionRequest",
    ()=>logAccountDeletionRequest,
    "logAuditEvent",
    ()=>logAuditEvent,
    "logConsentChange",
    ()=>logConsentChange,
    "logFunnelConfigChange",
    ()=>logFunnelConfigChange,
    "logFunnelVersionRollout",
    ()=>logFunnelVersionRollout,
    "logReportFlagged",
    ()=>logReportFlagged,
    "logReportGenerated",
    ()=>logReportGenerated,
    "logReportReviewed",
    ()=>logReportReviewed,
    "logSupportCaseCreated",
    ()=>logSupportCaseCreated,
    "logSupportCaseEscalated",
    ()=>logSupportCaseEscalated,
    "logSupportCaseStatusChanged",
    ()=>logSupportCaseStatusChanged,
    "logTaskEvent",
    ()=>logTaskEvent,
    "redactPHI",
    ()=>redactPHI
]);
/**
 * Audit Logging Helper
 *
 * Provides type-safe audit logging functionality for decision-relevant events.
 * Ensures no PHI leakage and maintains comprehensive audit trails.
 *
 * @module lib/audit/log
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-rsc] (ecmascript)");
;
;
// ============================================================
// Supabase Client (Service Role)
// ============================================================
/**
 * Creates a Supabase client with service role key for audit logging
 * Bypasses RLS to ensure audit logs are always written
 */ function getAuditClient() {
    const supabaseUrl = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_SUPABASE_URL || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].SUPABASE_URL;
    const supabaseServiceKey = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].SUPABASE_SERVICE_ROLE_KEY || __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[audit/log] Missing Supabase credentials');
        return null;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false
        }
    });
}
// ============================================================
// PHI Protection & Redaction
// ============================================================
/**
 * List of allowed keys in metadata and diff objects
 * These are safe to store (IDs, versions, statuses, numeric values)
 */ const ALLOWED_METADATA_KEYS = [
    'request_id',
    'correlation_id',
    'algorithm_version',
    'prompt_version',
    'report_version',
    'version',
    'safety_score',
    'finding_count',
    'status_from',
    'status_to',
    'assigned_to_role',
    'reason',
    'consent_type',
    'granted',
    'rollout_percent',
    'rollout_percent_from',
    'rollout_percent_to',
    'is_active',
    'assessment_id',
    'report_id',
    'task_id',
    'funnel_id',
    'version_id',
    'consent_id',
    'config_key',
    'consent_version',
    'profile_updated',
    'review_id',
    'job_id',
    'decision_reason',
    'has_notes',
    // V05-I10.2: Account deletion/retention metadata
    'deletion_reason',
    'scheduled_for',
    'retention_period_days',
    'records_deleted',
    'records_anonymized',
    'executed_by',
    'anonymization_reason',
    // V05-I10.3: KPI/Observability tracking
    'kpi_event',
    'funnel_slug',
    'drop_off_reason',
    'current_step_id',
    'step_order_index',
    'duration_seconds',
    'duration_before_drop_seconds',
    'started_at',
    'completed_at',
    'time_to_report_seconds',
    'report_created_at',
    'error_type'
];
/**
 * List of keys that contain PHI and must be blocked
 */ const PHI_KEYS = [
    'content',
    'text',
    'notes',
    'answers',
    'answer',
    'response',
    'extracted_data',
    'clinical_notes',
    'patient_notes',
    'observation',
    'diagnosis',
    'medication',
    'name',
    'email',
    'phone',
    'address',
    'ssn',
    'dob',
    'date_of_birth'
];
function redactPHI(data, maxSize = 5000) {
    if (!data || typeof data !== 'object') {
        return {};
    }
    const redacted = {};
    let totalSize = 0;
    for (const [key, value] of Object.entries(data)){
        // Block PHI keys explicitly
        const lowerKey = key.toLowerCase();
        if (PHI_KEYS.some((phiKey)=>lowerKey.includes(phiKey))) {
            redacted[key] = '[REDACTED]';
            continue;
        }
        // Check if key is in allowlist
        const isAllowed = ALLOWED_METADATA_KEYS.includes(key);
        // Allow numeric values, booleans, and safe strings
        if (typeof value === 'number' || typeof value === 'boolean') {
            redacted[key] = value;
            totalSize += String(value).length;
        } else if (typeof value === 'string') {
            // Only allow strings from allowlist or UUID-like patterns
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
            const isShortSafe = value.length <= 100 && !/[<>{}]/.test(value) // No HTML/JSON
            ;
            if (isAllowed || isUUID || isShortSafe && lowerKey.includes('id')) {
                redacted[key] = value;
                totalSize += value.length;
            } else {
                redacted[key] = '[REDACTED]';
            }
        } else if (value === null || value === undefined) {
            redacted[key] = value;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Recursively redact nested objects
            redacted[key] = redactPHI(value, maxSize - totalSize);
            totalSize += JSON.stringify(redacted[key]).length;
        } else {
            // Arrays and other types - redact to be safe
            redacted[key] = '[REDACTED]';
        }
        // Enforce size limit
        if (totalSize > maxSize) {
            console.warn('[audit/log] Metadata/diff size exceeded limit, truncating');
            break;
        }
    }
    return redacted;
}
async function logAuditEvent(event) {
    const startTime = Date.now();
    try {
        // Validate event
        if (!event.entity_type) {
            return {
                success: false,
                error: 'entity_type is required'
            };
        }
        if (!event.entity_id) {
            return {
                success: false,
                error: 'entity_id is required'
            };
        }
        if (!event.action) {
            return {
                success: false,
                error: 'action is required'
            };
        }
        if (!event.source) {
            return {
                success: false,
                error: 'source is required'
            };
        }
        // Get Supabase client
        const supabase = getAuditClient();
        if (!supabase) {
            console.error('[audit/log] Cannot create Supabase client');
            return {
                success: false,
                error: 'Supabase client unavailable'
            };
        }
        // Redact PHI from diff and metadata
        const safeMetadata = redactPHI(event.metadata || {});
        const safeDiff = {};
        if (event.diff?.before) {
            safeDiff.before = redactPHI(event.diff.before);
        }
        if (event.diff?.after) {
            safeDiff.after = redactPHI(event.diff.after);
        }
        if (event.diff?.changes) {
            safeDiff.changes = redactPHI(event.diff.changes);
        }
        // Prepare audit log entry
        const auditEntry = {
            org_id: event.org_id || null,
            actor_user_id: event.actor_user_id || null,
            actor_role: event.actor_role || null,
            source: event.source,
            entity_type: event.entity_type,
            entity_id: event.entity_id,
            action: event.action,
            diff: safeDiff || {},
            metadata: safeMetadata || {}
        };
        // Insert audit log
        const { data, error } = await supabase.from('audit_log').insert(auditEntry).select('id').single();
        if (error) {
            console.error('[audit/log] Failed to insert audit event', {
                error,
                entity_type: event.entity_type,
                entity_id: event.entity_id,
                action: event.action
            });
            return {
                success: false,
                error: error.message
            };
        }
        const duration = Date.now() - startTime;
        console.log('[audit/log] Audit event logged successfully', {
            audit_id: data.id,
            entity_type: event.entity_type,
            entity_id: event.entity_id,
            action: event.action,
            duration_ms: duration
        });
        return {
            success: true,
            audit_id: data.id
        };
    } catch (err) {
        console.error('[audit/log] Unexpected error logging audit event', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}
async function logReportGenerated(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'report',
        entity_id: params.report_id,
        action: 'generate',
        metadata: {
            assessment_id: params.assessment_id,
            algorithm_version: params.algorithm_version,
            prompt_version: params.prompt_version,
            report_version: params.report_version,
            safety_score: params.safety_score
        }
    });
}
async function logReportFlagged(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'system',
        entity_type: 'report',
        entity_id: params.report_id,
        action: 'flag',
        metadata: {
            safety_score: params.safety_score,
            finding_count: params.finding_count
        }
    });
}
async function logReportReviewed(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'report',
        entity_id: params.report_id,
        action: params.action,
        metadata: {
            reason: params.reason
        }
    });
}
async function logTaskEvent(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'task',
        entity_id: params.task_id,
        action: params.action,
        metadata: {
            status_from: params.status_from,
            status_to: params.status_to,
            assigned_to_role: params.assigned_to_role
        }
    });
}
async function logFunnelConfigChange(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'admin-ui',
        entity_type: 'funnel_catalog',
        entity_id: params.funnel_id,
        action: params.action,
        diff: {
            after: {
                is_active: params.is_active
            }
        }
    });
}
async function logFunnelVersionRollout(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'admin-ui',
        entity_type: 'funnel_version',
        entity_id: params.version_id,
        action: 'rollout',
        diff: {
            before: {
                rollout_percent: params.rollout_percent_from
            },
            after: {
                rollout_percent: params.rollout_percent_to
            }
        }
    });
}
async function logConsentChange(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'consent',
        entity_id: params.consent_id,
        action: params.action,
        metadata: {
            consent_type: params.consent_type,
            granted: params.granted
        }
    });
}
async function logSupportCaseCreated(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'support_case',
        entity_id: params.support_case_id,
        action: 'create',
        metadata: {
            // PHI-safe: NO patient_id, only category/priority metadata
            has_notes: false
        }
    });
}
async function logSupportCaseEscalated(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'support_case',
        entity_id: params.support_case_id,
        action: 'escalate',
        metadata: {
            task_id: params.task_id,
            assigned_to_role: params.assigned_to_role
        }
    });
}
async function logSupportCaseStatusChanged(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'support_case',
        entity_id: params.support_case_id,
        action: 'update',
        metadata: {
            status_from: params.status_from,
            status_to: params.status_to,
            has_notes: params.has_notes ?? false
        }
    });
}
async function logAccountDeletionRequest(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'account',
        entity_id: params.account_id,
        action: 'deletion_request',
        metadata: {
            deletion_reason: params.deletion_reason,
            scheduled_for: params.scheduled_for,
            retention_period_days: params.retention_period_days
        }
    });
}
async function logAccountDeletionCancel(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'api',
        entity_type: 'account',
        entity_id: params.account_id,
        action: 'deletion_cancel',
        metadata: {
            reason: params.cancellation_reason
        }
    });
}
async function logAccountDeletionExecute(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: params.executed_by === 'system' ? 'system' : 'admin-ui',
        entity_type: 'account',
        entity_id: params.account_id,
        action: 'deletion_execute',
        metadata: {
            records_deleted: params.records_deleted,
            records_anonymized: params.records_anonymized,
            executed_by: params.executed_by
        }
    });
}
async function logAccountAnonymize(params) {
    return logAuditEvent({
        org_id: params.org_id,
        actor_user_id: params.actor_user_id,
        actor_role: params.actor_role,
        source: 'system',
        entity_type: 'account',
        entity_id: params.account_id,
        action: 'anonymize',
        metadata: {
            records_anonymized: params.records_anonymized,
            reason: params.anonymization_reason
        }
    });
}
}),
"[project]/lib/audit/index.ts [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
/**
 * Audit Module
 * 
 * Provides comprehensive audit logging for decision-relevant events.
 * 
 * @module lib/audit
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audit$2f$log$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/audit/log.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/lib/actions/onboarding.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Onboarding Server Actions
 * 
 * Server-side handlers for patient onboarding flow.
 * Handles consent recording and baseline profile management with:
 * - Idempotent operations
 * - RLS enforcement
 * - Audit logging
 * 
 * @module lib/actions/onboarding
 */ /* __next_internal_action_entry_do_not_use__ [{"004ed9cac90fdf834ec1f94940af796d1833666018":"hasUserConsented","006d7e00afcc2588ac5c809edc63b116c82fef896e":"getOnboardingStatus","0089c700a0e4e1138dbdb2e08f18f91a98bca27d8c":"getBaselineProfile","4095d5d901dd6b27acd1be17849398125002266397":"saveBaselineProfile","40c1011b8932b09d60aa15b29237df90b5e17d9b7f":"recordConsent"},"",""] */ __turbopack_context__.s([
    "getBaselineProfile",
    ()=>getBaselineProfile,
    "getOnboardingStatus",
    ()=>getOnboardingStatus,
    "hasUserConsented",
    ()=>hasUserConsented,
    "recordConsent",
    ()=>recordConsent,
    "saveBaselineProfile",
    ()=>saveBaselineProfile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/supabase.server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/contracts/onboarding.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audit$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/audit/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audit$2f$log$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/audit/log.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
// PostgreSQL error codes
const PG_ERROR_UNIQUE_VIOLATION = '23505';
// ============================================================
// Helper: Get Authenticated Supabase Client
// ============================================================
async function getAuthenticatedClient() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return {
            supabase: null,
            user: null,
            error: 'Not authenticated'
        };
    }
    return {
        supabase,
        user,
        error: null
    };
}
async function recordConsent(formData) {
    try {
        // Validate input
        const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ConsentFormSchema"].safeParse(formData);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                error: firstError?.message || 'Invalid consent data'
            };
        }
        // Get authenticated client
        const { supabase, user, error: authError } = await getAuthenticatedClient();
        if (authError || !supabase || !user) {
            return {
                success: false,
                error: authError || 'Authentication failed'
            };
        }
        // Check if consent already exists (idempotent check)
        // Use limit(1) instead of maybeSingle() to avoid hard failures if duplicates exist.
        const { data: existingConsents, error: existingConsentError } = await supabase.from('user_consents').select('*').eq('user_id', user.id).eq('consent_version', formData.consentVersion).order('consented_at', {
            ascending: false
        }).limit(1);
        if (existingConsentError) {
            console.error('[onboarding/recordConsent] Existing consent check error:', existingConsentError);
            return {
                success: false,
                error: 'Failed to check existing consent'
            };
        }
        const existingConsent = existingConsents?.[0];
        if (existingConsent) {
            // Already consented - idempotent success
            return {
                success: true,
                data: existingConsent
            };
        }
        // Insert new consent record
        const { data, error } = await supabase.from('user_consents').insert({
            user_id: user.id,
            consent_version: formData.consentVersion
        }).select().single();
        if (error) {
            // Idempotent under races: if another request inserted concurrently, treat as success.
            if (error?.code === PG_ERROR_UNIQUE_VIOLATION) {
                const { data: retryData, error: retryError } = await supabase.from('user_consents').select('*').eq('user_id', user.id).eq('consent_version', formData.consentVersion).order('consented_at', {
                    ascending: false
                }).limit(1);
                if (retryError) {
                    console.error('[onboarding/recordConsent] Retry after conflict failed:', retryError);
                    return {
                        success: false,
                        error: 'Failed to record consent'
                    };
                }
                const retryConsent = retryData?.[0];
                if (retryConsent) {
                    return {
                        success: true,
                        data: retryConsent
                    };
                }
            }
            console.error('[onboarding/recordConsent] Database error:', error);
            return {
                success: false,
                error: 'Failed to record consent'
            };
        }
        // Log audit event
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audit$2f$log$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logAuditEvent"])({
            source: 'api',
            entity_type: 'consent',
            entity_id: data.id,
            action: 'create',
            actor_user_id: user.id,
            metadata: {
                consent_version: formData.consentVersion
            }
        });
        return {
            success: true,
            data: data
        };
    } catch (err) {
        console.error('[onboarding/recordConsent] Unexpected error:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unexpected error'
        };
    }
}
async function hasUserConsented() {
    try {
        const { supabase, user, error: authError } = await getAuthenticatedClient();
        if (authError || !supabase || !user) {
            return {
                success: false,
                error: authError || 'Authentication failed'
            };
        }
        const { data, error } = await supabase.from('user_consents').select('id').eq('user_id', user.id).eq('consent_version', __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CURRENT_CONSENT_VERSION"]).order('consented_at', {
            ascending: false
        }).limit(1);
        if (error) {
            console.error('[onboarding/hasUserConsented] Database error:', error);
            return {
                success: false,
                error: 'Failed to check consent status'
            };
        }
        return {
            success: true,
            data: (data?.length ?? 0) > 0
        };
    } catch (err) {
        console.error('[onboarding/hasUserConsented] Unexpected error:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unexpected error'
        };
    }
}
async function saveBaselineProfile(profileData) {
    try {
        // Validate input
        const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BaselineProfileSchema"].safeParse(profileData);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                error: firstError?.message || 'Invalid profile data'
            };
        }
        // Get authenticated client
        const { supabase, user, error: authError } = await getAuthenticatedClient();
        if (authError || !supabase || !user) {
            return {
                success: false,
                error: authError || 'Authentication failed'
            };
        }
        // Check if profile exists
        const { data: existingProfiles, error: existingProfileError } = await supabase.from('patient_profiles').select('*').eq('user_id', user.id).order('created_at', {
            ascending: false
        }).limit(1);
        if (existingProfileError) {
            console.error('[onboarding/saveBaselineProfile] Existing profile check error:', existingProfileError);
            return {
                success: false,
                error: 'Failed to check profile'
            };
        }
        const existingProfile = existingProfiles?.[0];
        let result = null;
        let isUpdate = false;
        if (existingProfile) {
            // Update existing profile and mark onboarding as completed (E6.4.2 AC1)
            isUpdate = true;
            const { data, error } = await supabase.from('patient_profiles').update({
                full_name: validationResult.data.full_name,
                birth_year: validationResult.data.birth_year,
                sex: validationResult.data.sex,
                onboarding_status: 'completed'
            }).eq('id', existingProfile.id).select().single();
            if (error) {
                console.error('[onboarding/saveBaselineProfile] Update error:', error);
                return {
                    success: false,
                    error: 'Failed to update profile'
                };
            }
            result = data;
        } else {
            // Insert new profile and mark onboarding as completed (E6.4.2 AC1)
            const { data, error } = await supabase.from('patient_profiles').insert({
                user_id: user.id,
                full_name: validationResult.data.full_name,
                birth_year: validationResult.data.birth_year,
                sex: validationResult.data.sex,
                onboarding_status: 'completed'
            }).select().single();
            if (error) {
                // Idempotent under races: if a concurrent request inserted a profile, update the latest.
                if (error?.code === PG_ERROR_UNIQUE_VIOLATION) {
                    const { data: retryProfiles, error: retryExistingError } = await supabase.from('patient_profiles').select('*').eq('user_id', user.id).order('created_at', {
                        ascending: false
                    }).limit(1);
                    if (retryExistingError) {
                        console.error('[onboarding/saveBaselineProfile] Retry fetch after conflict failed:', retryExistingError);
                        return {
                            success: false,
                            error: 'Failed to create profile'
                        };
                    }
                    const retryExisting = retryProfiles?.[0];
                    if (!retryExisting) {
                        return {
                            success: false,
                            error: 'Failed to create profile'
                        };
                    }
                    isUpdate = true;
                    const { data: retryUpdateData, error: retryUpdateError } = await supabase.from('patient_profiles').update({
                        full_name: validationResult.data.full_name,
                        birth_year: validationResult.data.birth_year,
                        sex: validationResult.data.sex,
                        onboarding_status: 'completed'
                    }).eq('id', retryExisting.id).select().single();
                    if (retryUpdateError) {
                        console.error('[onboarding/saveBaselineProfile] Retry update after conflict failed:', retryUpdateError);
                        return {
                            success: false,
                            error: 'Failed to update profile'
                        };
                    }
                    result = retryUpdateData;
                } else {
                    console.error('[onboarding/saveBaselineProfile] Insert error:', error);
                    return {
                        success: false,
                        error: 'Failed to create profile'
                    };
                }
            }
            if (!result) {
                result = data;
            }
        }
        if (!result) {
            return {
                success: false,
                error: 'Failed to save profile'
            };
        }
        // Log audit event
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$audit$2f$log$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logAuditEvent"])({
            source: 'api',
            entity_type: 'consent',
            entity_id: result.id,
            action: isUpdate ? 'update' : 'create',
            actor_user_id: user.id,
            metadata: {
                profile_updated: 'baseline'
            }
        });
        return {
            success: true,
            data: result
        };
    } catch (err) {
        console.error('[onboarding/saveBaselineProfile] Unexpected error:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unexpected error'
        };
    }
}
async function getBaselineProfile() {
    try {
        const { supabase, user, error: authError } = await getAuthenticatedClient();
        if (authError || !supabase || !user) {
            return {
                success: false,
                error: authError || 'Authentication failed'
            };
        }
        const { data, error } = await supabase.from('patient_profiles').select('*').eq('user_id', user.id).order('created_at', {
            ascending: false
        }).limit(1);
        if (error) {
            console.error('[onboarding/getBaselineProfile] Database error:', error);
            return {
                success: false,
                error: 'Failed to fetch profile'
            };
        }
        return {
            success: true,
            data: data?.[0] ?? null
        };
    } catch (err) {
        console.error('[onboarding/getBaselineProfile] Unexpected error:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unexpected error'
        };
    }
}
async function getOnboardingStatus() {
    try {
        const { supabase, user, error: authError } = await getAuthenticatedClient();
        if (authError || !supabase || !user) {
            return {
                success: false,
                error: authError || 'Authentication failed'
            };
        }
        // Check consent
        const { data: consentData, error: consentError } = await supabase.from('user_consents').select('id').eq('user_id', user.id).eq('consent_version', __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$contracts$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CURRENT_CONSENT_VERSION"]).order('consented_at', {
            ascending: false
        }).limit(1);
        if (consentError) {
            console.error('[onboarding/getOnboardingStatus] Consent check error:', consentError);
            return {
                success: false,
                error: 'Failed to check onboarding status'
            };
        }
        const hasConsent = (consentData?.length ?? 0) > 0;
        // Check profile (must have at least full_name) and get onboarding_status (E6.4.2)
        const { data: profileData, error: profileError } = await supabase.from('patient_profiles').select('id, full_name, onboarding_status').eq('user_id', user.id).order('created_at', {
            ascending: false
        }).limit(1);
        if (profileError) {
            console.error('[onboarding/getOnboardingStatus] Profile check error:', profileError);
            return {
                success: false,
                error: 'Failed to check onboarding status'
            };
        }
        const firstProfile = profileData?.[0];
        const hasProfile = !!(firstProfile && firstProfile.full_name);
        const onboardingStatus = firstProfile?.onboarding_status;
        return {
            success: true,
            data: {
                hasConsent,
                hasProfile,
                isComplete: hasConsent && hasProfile,
                status: onboardingStatus
            }
        };
    } catch (err) {
        console.error('[onboarding/getOnboardingStatus] Unexpected error:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unexpected error'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    recordConsent,
    hasUserConsented,
    saveBaselineProfile,
    getBaselineProfile,
    getOnboardingStatus
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(recordConsent, "40c1011b8932b09d60aa15b29237df90b5e17d9b7f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(hasUserConsented, "004ed9cac90fdf834ec1f94940af796d1833666018", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(saveBaselineProfile, "4095d5d901dd6b27acd1be17849398125002266397", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getBaselineProfile, "0089c700a0e4e1138dbdb2e08f18f91a98bca27d8c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getOnboardingStatus, "006d7e00afcc2588ac5c809edc63b116c82fef896e", null);
}),
"[project]/apps/rhythm-patient-ui/.next-internal/server/app/patient/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions/onboarding.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/onboarding.ts [app-rsc] (ecmascript)");
;
;
;
;
;
}),
"[project]/apps/rhythm-patient-ui/.next-internal/server/app/patient/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions/onboarding.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "004ed9cac90fdf834ec1f94940af796d1833666018",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasUserConsented"],
    "006d7e00afcc2588ac5c809edc63b116c82fef896e",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOnboardingStatus"],
    "0089c700a0e4e1138dbdb2e08f18f91a98bca27d8c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBaselineProfile"],
    "4095d5d901dd6b27acd1be17849398125002266397",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveBaselineProfile"],
    "40c1011b8932b09d60aa15b29237df90b5e17d9b7f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordConsent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f2e$next$2d$internal$2f$server$2f$app$2f$patient$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/apps/rhythm-patient-ui/.next-internal/server/app/patient/page/actions.js { ACTIONS_MODULE0 => "[project]/lib/actions/onboarding.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$onboarding$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/onboarding.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_795c92b7._.js.map