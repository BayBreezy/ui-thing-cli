/**
 * VS Code extensions recommendations for Tailwind CSS development.
 */
export const VS_CODE_RECOMMENDATIONS = {
  recommendations: [
    "vue.volar",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "antfu.iconify",
    "formulahendry.auto-close-tag",
    "formulahendry.auto-rename-tag",
  ],
};

/**
 * VS Code settings for Tailwind CSS development.
 */
export const VS_CODE_SETTINGS = {
  "editor.formatOnSave": true,
  "editor.quickSuggestions": { strings: "on" },
  "files.associations": { "*.css": "tailwindcss" },
  "tailwindCSS.classFunctions": ["tw", "clsx", "tw\\.[a-z-]+"],
  "tailwindCSS.experimental.classRegex": [["([\"'`][^\"'`]*.*?[\"'`])", "[\"'`]([^\"'`]*)[\"'`]"]],
};
