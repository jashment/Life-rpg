import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Additional plugins for your custom rules
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import jestPlugin from "eslint-plugin-jest";
import globals from "globals";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**"
  ]),

  {
    files: ["**/*.test.{js,ts,tsx}", "**/*.spec.{js,ts,tsx}"],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
  },

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: reactPlugin,
    },
    rules: {
      "indent": ["error", 4],

      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
      
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": "error",

      "react/jsx-filename-extension": ["warn", { extensions: [".tsx"] }],
      "react/jsx-indent": ["error", 4],
      "react/jsx-indent-props": ["error", 4],
      "react/jsx-closing-bracket-location": ["error", "after-props"],
      "react/jsx-first-prop-new-line": ["error", "multiline"],
      "react/jsx-max-props-per-line": ["error", { "maximum": 4, "when": "multiline" }],
      "react/jsx-one-expression-per-line": "off",
      
      "complexity": ["error", 10],
      "no-await-in-loop": "warn",
      "no-eval": "error",
      "no-implied-eval": "error",
      "prefer-promise-reject-errors": "warn",
    },
  },
]);