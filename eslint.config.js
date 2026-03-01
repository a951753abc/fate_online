import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "node_modules/", "client/dist/"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["server/**/*.ts"],
  },

  {
    files: ["client/src/**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
);
