import { defineConfig } from "tsup";

export default defineConfig({
  sourcemap: true,
  entry: ["src/index.ts"],
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  clean: true,
  format: ["esm"],
  minify: true,
  target: "esnext",
  outDir: "dist",
});
