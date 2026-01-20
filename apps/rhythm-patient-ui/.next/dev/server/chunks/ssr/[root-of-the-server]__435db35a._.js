module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/apps/rhythm-patient-ui/app/global-error.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/global-error.tsx [app-rsc] (ecmascript)"));
}),
"[project]/apps/rhythm-patient-ui/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/apps/rhythm-patient-ui/app/loading.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/loading.tsx [app-rsc] (ecmascript)"));
}),
"[project]/apps/rhythm-patient-ui/app/not-found.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/not-found.tsx [app-rsc] (ecmascript)"));
}),
"[project]/apps/rhythm-patient-ui/app/patient/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/apps/rhythm-patient-ui/app/patient/error.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/error.tsx [app-rsc] (ecmascript)"));
}),
"[project]/apps/rhythm-patient-ui/app/patient/loading.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/loading.tsx [app-rsc] (ecmascript)"));
}),
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
"[project]/lib/config/funnelAllowlist.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Funnel Reachability Allowlist
 *
 * Defines which funnel slugs are patient-reachable (can be accessed directly).
 * Funnels not in this allowlist are "ADMIN-ONLY" and cannot be started by patients.
 *
 * Note: `is_active` in the database means the funnel definition is active,
 * NOT that patients can start it. This allowlist controls patient reachability.
 *
 * @module lib/config/funnelAllowlist
 */ /**
 * Patient-reachable funnel slugs
 *
 * Add slugs here to make them accessible to patients.
 * Remove or don't include slugs to restrict them to admin-only.
 */ __turbopack_context__.s([
    "DEFAULT_PATIENT_FUNNEL",
    ()=>DEFAULT_PATIENT_FUNNEL,
    "PATIENT_REACHABLE_FUNNELS",
    ()=>PATIENT_REACHABLE_FUNNELS,
    "isFunnelPatientReachable",
    ()=>isFunnelPatientReachable
]);
const PATIENT_REACHABLE_FUNNELS = [
    'stress-assessment',
    'cardiovascular-age'
];
function isFunnelPatientReachable(slug) {
    return PATIENT_REACHABLE_FUNNELS.includes(slug);
}
const DEFAULT_PATIENT_FUNNEL = 'stress-assessment';
}),
"[project]/lib/utils/dashboardFirstPolicy.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearDashboardVisit",
    ()=>clearDashboardVisit,
    "enforceDashboardFirst",
    ()=>enforceDashboardFirst,
    "extractFunnelSlug",
    ()=>extractFunnelSlug,
    "hasDashboardVisit",
    ()=>hasDashboardVisit,
    "isFunnelRoute",
    ()=>isFunnelRoute,
    "markDashboardVisited",
    ()=>markDashboardVisited,
    "requiresDashboardFirst",
    ()=>requiresDashboardFirst
]);
/**
 * Dashboard-First Policy Enforcement (E6.5.1)
 * 
 * Ensures patients always land on the dashboard before accessing other routes.
 * Prevents direct deep-linking into funnels, results, or other patient pages.
 * 
 * Policy:
 * - After login/onboarding, users must visit /patient/dashboard first
 * - Direct access to /patient/funnel/*, /patient/funnels, /patient/history, etc.
 *   redirects to dashboard if dashboard hasn't been visited in this session
 * - Dashboard sets a session marker allowing subsequent navigation
 * 
 * @module lib/utils/dashboardFirstPolicy
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$funnelAllowlist$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/config/funnelAllowlist.ts [app-rsc] (ecmascript)");
;
;
;
/**
 * Cookie name for tracking dashboard visit
 */ const DASHBOARD_VISITED_COOKIE = 'dashboard_visited';
/**
 * Cookie max age (1 hour - session-like behavior)
 */ const COOKIE_MAX_AGE = 60 * 60 // 1 hour
;
/**
 * Routes that require dashboard-first entry
 * These routes will redirect to dashboard if not visited yet
 */ const PROTECTED_ROUTES = [
    '/patient/funnel',
    '/patient/funnels',
    '/patient/history',
    '/patient/assessment',
    '/patient/support',
    '/patient/escalation',
    '/patient/documents'
];
/**
 * Routes that are exempt from dashboard-first policy
 * These can be accessed directly
 */ const EXEMPT_ROUTES = [
    '/patient/dashboard',
    '/patient/onboarding'
];
/**
 * Special case: patient root route (redirects to dashboard anyway)
 */ const PATIENT_ROOT = '/patient';
/**
 * Funnel route prefix for slug extraction
 */ const FUNNEL_ROUTE_PREFIX = '/patient/funnel/';
function extractFunnelSlug(pathname) {
    if (!pathname.startsWith(FUNNEL_ROUTE_PREFIX)) {
        return null;
    }
    // Extract slug: '/patient/funnel/stress-assessment' → 'stress-assessment'
    // Handle nested routes: '/patient/funnel/stress-assessment/result' → 'stress-assessment'
    const remainder = pathname.slice(FUNNEL_ROUTE_PREFIX.length);
    const slugEnd = remainder.indexOf('/');
    return slugEnd === -1 ? remainder : remainder.slice(0, slugEnd);
}
function isFunnelRoute(pathname) {
    return pathname.startsWith(FUNNEL_ROUTE_PREFIX);
}
async function hasDashboardVisit() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const visited = cookieStore.get(DASHBOARD_VISITED_COOKIE);
    return visited?.value === 'true';
}
async function markDashboardVisited() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const isProduction = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["env"].NODE_ENV === 'production';
    cookieStore.set(DASHBOARD_VISITED_COOKIE, 'true', {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
        path: '/patient',
        secure: isProduction
    });
}
async function clearDashboardVisit() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete(DASHBOARD_VISITED_COOKIE);
}
/**
 * Helper: Checks if a pathname matches a route exactly or is a subdirectory
 * 
 * @param pathname - Current pathname (e.g., '/patient/dashboard')
 * @param route - Route to check against (e.g., '/patient/onboarding')
 * @returns boolean - true if exact match or subdirectory
 * 
 * @example
 * matchesRoute('/patient/dashboard', '/patient/dashboard') // true (exact)
 * matchesRoute('/patient/onboarding/consent', '/patient/onboarding') // true (subdir)
 * matchesRoute('/patient/funnels', '/patient/funnel') // false (different)
 */ function matchesRoute(pathname, route) {
    return pathname === route || pathname.startsWith(route + '/');
}
function requiresDashboardFirst(pathname) {
    // Special case: patient root is handled by its own redirect logic
    if (pathname === PATIENT_ROOT) {
        return false;
    }
    // Check if it's an exempt route (exact match or subdirectory)
    const isExempt = EXEMPT_ROUTES.some((route)=>matchesRoute(pathname, route));
    if (isExempt) {
        return false;
    }
    // Special case: patient-reachable funnels are exempt from dashboard-first
    // This allows direct access to allowlisted funnels like stress-assessment
    if (isFunnelRoute(pathname)) {
        const slug = extractFunnelSlug(pathname);
        if (slug && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$funnelAllowlist$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isFunnelPatientReachable"])(slug)) {
            return false;
        }
    }
    // Check if it's a protected route (prefix match)
    return PROTECTED_ROUTES.some((route)=>pathname.startsWith(route));
}
async function enforceDashboardFirst(pathname) {
    // Check if this route requires dashboard-first
    if (!requiresDashboardFirst(pathname)) {
        return null;
    }
    // Check if dashboard has been visited
    const hasVisited = await hasDashboardVisit();
    if (!hasVisited) {
        // Redirect to dashboard with return URL
        const returnUrl = encodeURIComponent(pathname);
        return `/patient/dashboard?return=${returnUrl}`;
    }
    return null;
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx <module evaluation>", "default");
}),
"[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx", "default");
}),
"[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$funnels$2f$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$funnels$2f$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$funnels$2f$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/apps/rhythm-patient-ui/app/patient/funnels/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FunnelCatalogPage,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/supabase.server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$dashboardFirstPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils/dashboardFirstPolicy.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$funnels$2f$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/funnels/client.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
const dynamic = 'force-dynamic';
async function FunnelCatalogPage() {
    // Create Supabase server client (canonical)
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$supabase$2e$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
    // E6.5.1 AC3: Check authentication FIRST (401-first, no DB calls before auth)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/');
    }
    // E6.5.1 AC2: Enforce dashboard-first policy
    const redirectUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2f$dashboardFirstPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["enforceDashboardFirst"])('/patient/funnels');
    if (redirectUrl) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])(redirectUrl);
    }
    // Render client component
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$rhythm$2d$patient$2d$ui$2f$app$2f$patient$2f$funnels$2f$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
        fileName: "[project]/apps/rhythm-patient-ui/app/patient/funnels/page.tsx",
        lineNumber: 40,
        columnNumber: 10
    }, this);
}
}),
"[project]/apps/rhythm-patient-ui/app/patient/funnels/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/rhythm-patient-ui/app/patient/funnels/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__435db35a._.js.map