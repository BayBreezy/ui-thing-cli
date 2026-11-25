import { describe, expect, it } from "vitest";

import { buildCssAdditions, mergeEnv } from "../../src/registry/css";

describe("registry/css", () => {
  it("serializes keyframes, utilities and statements", () => {
    const css = buildCssAdditions(
      [
        {
          css: {
            "@keyframes spin-slow": { to: { transform: "rotate(360deg)" } },
            '@plugin "@tailwindcss/typography"': {},
          },
        },
      ],
      ""
    );
    expect(css).toContain("@keyframes spin-slow {");
    expect(css).toContain("transform: rotate(360deg);");
    expect(css).toContain('@plugin "@tailwindcss/typography";');
  });

  it("is idempotent for css rules and cssVars", () => {
    const item = {
      css: { "@keyframes pulse2": { to: { opacity: "1" } } },
      cssVars: {
        theme: { "color-brand": "red" },
        light: { brand: "red" },
        dark: { brand: "blue" },
      },
    };
    const first = buildCssAdditions([item], "");
    expect(first).toContain("@theme inline {");
    expect(first).toContain(":root {");
    expect(first).toContain(".dark {");
    expect(buildCssAdditions([item], first)).toBe("");
  });

  it("mergeEnv only adds missing keys", () => {
    expect(mergeEnv("A=1", { A: "2", B: "3" })).toBe("A=1\nB=3\n");
    expect(mergeEnv("A=1\n", { A: "2" })).toBe("A=1\n");
  });
});
