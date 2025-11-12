import eslint from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
export default [
  eslint.configs.recommended,
  {
    // React configuration
    files: ["**/*.{js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        React: "readonly",
        JSX: "readonly",
        ...globals.browser, // 👈 this line tells ESLint that fetch, window, document, etc. are defined
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React recommended rules
      ...reactPlugin.configs.recommended.rules,
      // React Hooks recommended rules
      ...reactHooksPlugin.configs.recommended.rules,
      "react/prop-types": "off",
      // Optional custom overrides
      // 'react/react-in-jsx-scope': 'error', // Not needed in React 19+
    },
  },
];