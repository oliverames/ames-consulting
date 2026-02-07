module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2023: true
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest"
  },
  rules: {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ]
  }
};
