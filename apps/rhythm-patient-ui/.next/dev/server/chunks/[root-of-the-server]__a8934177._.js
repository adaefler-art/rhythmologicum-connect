module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/env.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [middleware] (ecmascript) <export * as z>");
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
const baseEnvSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Client-safe vars (may be inlined at build time by Next.js)
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()),
    // OPTIONAL: Review Queue Sampling
    REVIEW_SAMPLING_PERCENTAGE: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    REVIEW_SAMPLING_SALT: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: Feature Flags
    NEXT_PUBLIC_FEATURE_AMY_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: E6.4.1 Pilot Feature Flags
    NEXT_PUBLIC_PILOT_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    NEXT_PUBLIC_PILOT_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Node Environment
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'development',
        'production',
        'test'
    ]).optional(),
    NEXT_PHASE: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Hosting provider (optional)
    VERCEL_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: Usage Telemetry Toggle
    USAGE_TELEMETRY_ENABLED: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const serverOnlyEnvSchema = baseEnvSchema.extend({
    // OPTIONAL: Dev/Admin tooling feature flags
    DEV_ENDPOINT_CATALOG: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: UI split routing (Package 2)
    STUDIO_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    PATIENT_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    ENGINE_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    // OPTIONAL: E6.4.1 Pilot Allowlists (server-only)
    PILOT_ORG_ALLOWLIST: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    PILOT_USER_ALLOWLIST: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // REQUIRED (server runtime only): Supabase Admin
    SUPABASE_SERVICE_ROLE_KEY: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()),
    // OPTIONAL: Anthropic AI Configuration
    ANTHROPIC_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    ANTHROPIC_API_TOKEN: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    ANTHROPIC_MODEL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // OPTIONAL: Legacy/Alternative Variable Names
    SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional()),
    SUPABASE_SERVICE_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional())
});
const patientEnvSchema = baseEnvSchema.extend({
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('NEXT_PUBLIC_SUPABASE_URL is required')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')),
    ENGINE_BASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('ENGINE_BASE_URL is required'))
});
const studioEnvSchema = baseEnvSchema.extend({
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('NEXT_PUBLIC_SUPABASE_URL is required')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'))
});
const engineEnvSchema = serverOnlyEnvSchema.extend({
    NEXT_PUBLIC_SUPABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('NEXT_PUBLIC_SUPABASE_URL is required')),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].preprocess(sanitizeEnvString, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'))
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
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
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
"[project]/lib/featureFlags.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "featureFlags",
    ()=>featureFlags,
    "getAllFeatureFlags",
    ()=>getAllFeatureFlags,
    "isFeatureEnabled",
    ()=>isFeatureEnabled,
    "parseEnvBoolean",
    ()=>parseEnvBoolean
]);
/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for the application.
 * Flags can be controlled via environment variables (NEXT_PUBLIC_FEATURE_*).
 * 
 * Environment variables:
 * - NEXT_PUBLIC_FEATURE_AMY_ENABLED: Enable/disable AMY AI assistant (default: true)
 * - NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: Enable/disable clinician dashboard (default: true)
 * - NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: Enable/disable charts in clinician views (default: true)
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [middleware] (ecmascript)");
;
function parseEnvBoolean(value, defaultValue) {
    if (value === undefined) {
        return defaultValue;
    }
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
}
const featureFlags = {
    AMY_ENABLED: parseEnvBoolean(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_FEATURE_AMY_ENABLED, true),
    CLINICIAN_DASHBOARD_ENABLED: parseEnvBoolean(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED, true),
    CHARTS_ENABLED: parseEnvBoolean(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["env"].NEXT_PUBLIC_FEATURE_CHARTS_ENABLED, true)
};
function isFeatureEnabled(feature) {
    return featureFlags[feature];
}
function getAllFeatureFlags() {
    return {
        ...featureFlags
    };
}
}),
"[project]/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$featureFlags$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/featureFlags.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [middleware] (ecmascript)");
;
;
;
;
// Check if clinician dashboard feature is enabled
function isClinicianDashboardEnabled() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$featureFlags$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["parseEnvBoolean"])(process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED, true);
}
// Log unauthorized access attempts
async function logUnauthorizedAccess(path, userId, reason) {
    console.warn('[AUTH] Unauthorized access attempt:', {
        path,
        userId: userId || 'anonymous',
        reason: reason || 'unknown',
        timestamp: new Date().toISOString()
    });
}
async function proxy(request) {
    const engineEnv = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["getEngineEnv"])();
    const { pathname } = request.nextUrl;
    // Only protect /clinician and /admin routes
    if (!pathname.startsWith('/clinician') && !pathname.startsWith('/admin')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // Check if clinician dashboard feature is enabled
    if (!isClinicianDashboardEnabled()) {
        console.log('[AUTH] Clinician dashboard feature is disabled');
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('error', 'feature_disabled');
        redirectUrl.searchParams.set('message', 'Das Kliniker-Dashboard ist derzeit nicht verfügbar.');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(redirectUrl);
    }
    let response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request
    });
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["createServerClient"])(engineEnv.NEXT_PUBLIC_SUPABASE_URL, engineEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll () {
                return request.cookies.getAll();
            },
            setAll (cookiesToSet) {
                cookiesToSet.forEach(({ name, value })=>request.cookies.set(name, value));
                response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
                    request
                });
                cookiesToSet.forEach(({ name, value, options })=>response.cookies.set(name, value, options));
            }
        }
    });
    const { data: { user } } = await supabase.auth.getUser();
    // User is not authenticated
    if (!user) {
        await logUnauthorizedAccess(pathname, undefined, 'not_authenticated');
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('error', 'authentication_required');
        redirectUrl.searchParams.set('message', 'Bitte melden Sie sich an, um fortzufahren.');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(redirectUrl);
    }
    const role = user.app_metadata?.role || user.user_metadata?.role;
    // Allow access for clinician and admin roles
    // Currently, clinicians have admin access to /admin/* routes
    const hasAccess = role === 'clinician' || role === 'admin';
    if (!hasAccess) {
        await logUnauthorizedAccess(pathname, user.id, 'insufficient_permissions');
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('error', 'access_denied');
        redirectUrl.searchParams.set('message', 'Sie haben keine Berechtigung, auf diesen Bereich zuzugreifen.');
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(redirectUrl);
    }
    return response;
}
const config = {
    matcher: [
        '/clinician/:path*',
        '/admin/:path*'
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a8934177._.js.map