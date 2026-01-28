import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // E50 "No Fantasy Names": Enforce env module usage
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.object.name='process'][object.property.name='env']",
          message: "Direct process.env access is forbidden. Use env from @/lib/env instead. Exceptions: lib/env.ts, next.config.ts, scripts/**, tools/**",
        },
      ],
      
      // V05-HYGIENE: Enforce canonical DB access patterns
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/supabase-js",
              importNames: ["createClient"],
              message: "Direct createClient import is forbidden. Use canonical factories from @/lib/db/supabase.* instead. Exceptions: lib/db/supabase.*.ts",
            },
            {
              name: "@supabase/ssr",
              importNames: ["createServerClient"],
              message: "Direct createServerClient import is forbidden. Use createServerSupabaseClient from @/lib/db/supabase.server instead. Exceptions: lib/db/supabase.server.ts",
            },
            {
              name: "@/lib/db/supabase.admin",
              message: "Admin client import is restricted. Only use in server-side API routes (app/api/**) or server-only lib modules. Document justification for each use.",
            },
          ],
          patterns: [
            {
              group: ["*supabase*"],
              importNames: ["createClient", "createServerClient"],
              message: "Direct Supabase client imports (including aliases) are forbidden. Use canonical factories from @/lib/db/supabase.* instead.",
            },
            {
              group: ["@/legacy/**", "**/legacy/**", "legacy/**"],
              message: "R-LEGACY-001: Imports from legacy/** are forbidden. Legacy code is ghosted and must not be used in production. See legacy/README.md for migration guidance.",
            },
          ],
        },
      ],
    },
  },
  // File-specific overrides for allowed process.env usage
  {
    files: [
      "lib/env.ts",
      "next.config.ts",
      "apps/**/next.config.ts",
      "apps/**/next.config.mjs",
      "scripts/**/*",
      "tools/**/*",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Override for scripts/tools - allow CommonJS require where it exists today.
  {
    files: ["scripts/**/*", "tools/**/*"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override for tests - allow `any` in test scaffolding.
  {
    files: [
      "**/__tests__/**/*",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override for canonical DB client factories
  {
    files: ["lib/db/supabase.*.ts", "lib/audit/log.ts", "lib/utils/contentResolver.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override for API routes - allow admin client with documentation requirement
  {
    files: ["app/api/**/*.ts", "apps/**/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/supabase-js",
              importNames: ["createClient"],
              message: "Direct createClient import is forbidden. Use canonical factories from @/lib/db/supabase.* instead.",
            },
            {
              name: "@supabase/ssr",
              importNames: ["createServerClient"],
              message: "Direct createServerClient import is forbidden. Use createServerSupabaseClient from @/lib/db/supabase.server instead.",
            },
          ],
          patterns: [
            {
              group: ["*supabase*"],
              importNames: ["createClient", "createServerClient"],
              message: "Direct Supabase client imports (including aliases) are forbidden. Use canonical factories from @/lib/db/supabase.* instead.",
            },
          ],
        },
      ],
    },
  },
  // Override for server-only lib modules - allow admin client with documentation requirement
  {
    files: ["lib/**/*.server.ts", "lib/**/*.server.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/supabase-js",
              importNames: ["createClient"],
              message:
                "Direct createClient import is forbidden. Use canonical factories from @/lib/db/supabase.* instead.",
            },
            {
              name: "@supabase/ssr",
              importNames: ["createServerClient"],
              message:
                "Direct createServerClient import is forbidden. Use createServerSupabaseClient from @/lib/db/supabase.server instead.",
            },
          ],
          patterns: [
            {
              group: ["*supabase*"],
              importNames: ["createClient", "createServerClient"],
              message:
                "Direct Supabase client imports (including aliases) are forbidden. Use canonical factories from @/lib/db/supabase.* instead.",
            },
          ],
        },
      ],
    },
  },
  // Re-apply override for canonical DB client factories (must come AFTER server-only override)
  {
    files: ["lib/db/supabase.*.ts", "lib/audit/log.ts", "lib/utils/contentResolver.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "**/.turbo/**",
    "**/.vercel/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/coverage/**",
    "**/artifacts/**",
    "**/node_modules/**",
    "next-env.d.ts",

    // Project docs contain design/reference code that is not shipped.
    "docs/**",

    // Legacy/unused file (not part of Next runtime)
    "proxy.ts",

    // E73.6: Legacy ghosted code (R-LEGACY-001, R-LEGACY-003)
    "legacy/**",
  ]),
]);

export default eslintConfig;
