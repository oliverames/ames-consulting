import globals from "globals";

export default [
  {
    ignores: [
      ".lighthouseci/**",
      "_site/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    files: ["assets/js/*.js", "functions/**/*.js", "scripts/*.mjs", "tests/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      sourceType: "module",
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["scripts/*.mjs"],
    rules: {
      "no-console": "off",
    },
  },
];
