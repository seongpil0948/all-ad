import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import localRules from "./config/eslint-rules/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const config = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/build/**",
      "**/dist/**",
      "**/coverage/**",
      "supabase/functions/**",
      "**/public/**",
      "tests/**",
      "playwright/.cache/**",
      "playwright/**/*.js",
      "playwright/index.tsx",
      "**/*.min.js",
      "**/*.config.js",
      "scripts/**",
    ],
  },
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "prettier",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  }),
  // Suppress triple-slash reference lint error in auto-generated next-env.d.ts
  {
    files: ["next-env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  // Relax rules for declaration files under types/
  {
    files: ["types/**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "app/**/*.{js,jsx,ts,tsx}",
      "components/**/*.{js,jsx,ts,tsx}",
      "lib/**/*.{js,jsx,ts,tsx}",
      "pages/**/*.{js,jsx,ts,tsx}",
    ],
    plugins: {
      local: localRules,
    },
    rules: {
      "local/no-literal-strings": [
        "warn",
        {
          allowAttributes: [
            "className",
            "id",
            "href",
            "src",
            "role",
            "data-testid",
            "viewBox",
            "fill",
            "stroke",
            "d",
            "width",
            "height",
            "x",
            "y",
            "cx",
            "cy",
            "r",
            "type",
            "name",
            "value",
            "color",
            "variant",
            "size",
            "key",
            "initialMode",
          ],
        },
      ],
    },
  },
  // Allow explicit any in specific 3rd-party integration shim where SDK lacks types
  {
    files: ["services/meta-ads/meta-ads-integration.service.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
