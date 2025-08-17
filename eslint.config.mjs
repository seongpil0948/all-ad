// import path from "node:path";
// import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import localRules from "./config/eslint-rules/index.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export default [
  // Global ignores first
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

  // Base config
  js.configs.recommended,

  // TypeScript files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        React: "readonly",
        JSX: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      local: localRules,
    },
    rules: {
      // Disable problematic rules
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Enforce i18n: discourage raw literals in JSX for app/components/lib
  {
    files: [
      "app/**/*.{js,jsx,ts,tsx}",
      "components/**/*.{js,jsx,ts,tsx}",
      "lib/**/*.{js,jsx,ts,tsx}",
      "pages/**/*.{js,jsx,ts,tsx}",
    ],
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
];
