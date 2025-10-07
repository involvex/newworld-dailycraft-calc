import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "node_modules/*",
      "dist/*",
      "build/*",
      "public/*",
      "coverage/*",
      "eslint.config.mjs",
      ".clinerules/*",
      "dist-electron/*",
      "docs/*",
      "*.css",
      "*.json",
      "README.md",
      "SECURITY.md",
      "src/*.css",
      "AppKopie.tsx",
      "simple-server.js",
      "icons/*",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      react: pluginReact,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: Object.assign({}, tseslint.configs.recommended.rules, pluginReact.configs.recommended.rules, {
      "@typescript-eslint/no-explicit-any": "off",
      "@/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_", "ignoreRestSiblings": true }],
      "react/react-in-jsx-scope": "off",
    }),
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);