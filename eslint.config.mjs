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
        },
      ],
    },
  },
  // File-specific overrides for allowed process.env usage
  {
    files: ["lib/env.ts", "next.config.ts", "scripts/**/*", "tools/**/*"],
    rules: {
      "no-restricted-syntax": "off",
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
    files: ["app/api/**/*.ts"],
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
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
