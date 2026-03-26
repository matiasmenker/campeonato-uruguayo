import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/app.ts" },
  outDir: "api",
  format: "esm",
  target: "node20",
  noExternal: ["db"],
  banner: {
    js: [
      'import { createRequire } from "node:module";',
      "const require = createRequire(import.meta.url);",
    ].join("\n"),
  },
});
