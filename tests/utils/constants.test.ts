import { describe, expect, it } from "vitest";

import {
  CSS_THEME_OPTIONS,
  DEFAULT_CONFIG,
  DEFAULT_CONFIG_NUXT4,
  INIT_DEPS,
  INIT_DEV_DEPS,
  INIT_DEV_DEPS_PRETTIER,
  INIT_MODULES,
  PACKAGE_MANAGER_CHOICES,
  UI_CONFIG_FILENAME,
} from "../../src/utils/constants";

describe("utils/constants", () => {
  describe("UI_CONFIG_FILENAME", () => {
    it("should be a string with correct filename", () => {
      expect(UI_CONFIG_FILENAME).toBe("ui-thing.config.ts");
      expect(typeof UI_CONFIG_FILENAME).toBe("string");
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("should have required properties for Nuxt 3", () => {
      expect(DEFAULT_CONFIG).toHaveProperty("theme");
      expect(DEFAULT_CONFIG).toHaveProperty("tailwindCSSLocation");
      expect(DEFAULT_CONFIG).toHaveProperty("componentsLocation");
      expect(DEFAULT_CONFIG).toHaveProperty("composablesLocation");
      expect(DEFAULT_CONFIG).toHaveProperty("utilsLocation");
      expect(DEFAULT_CONFIG).toHaveProperty("force");
      expect(DEFAULT_CONFIG).toHaveProperty("useDefaultFilename");
      expect(DEFAULT_CONFIG).toHaveProperty("packageManager");
    });

    it("should have correct Nuxt 3 paths", () => {
      expect(DEFAULT_CONFIG.tailwindCSSLocation).toBe("assets/css/tailwind.css");
      expect(DEFAULT_CONFIG.componentsLocation).toBe("components/Ui");
      expect(DEFAULT_CONFIG.composablesLocation).toBe("composables");
    });
  });

  describe("DEFAULT_CONFIG_NUXT4", () => {
    it("should have required properties for Nuxt 4", () => {
      expect(DEFAULT_CONFIG_NUXT4).toHaveProperty("theme");
      expect(DEFAULT_CONFIG_NUXT4).toHaveProperty("tailwindCSSLocation");
      expect(DEFAULT_CONFIG_NUXT4).toHaveProperty("componentsLocation");
    });

    it("should have correct Nuxt 4 paths with app/ prefix", () => {
      expect(DEFAULT_CONFIG_NUXT4.tailwindCSSLocation).toBe("app/assets/css/tailwind.css");
      expect(DEFAULT_CONFIG_NUXT4.componentsLocation).toBe("app/components/Ui");
      expect(DEFAULT_CONFIG_NUXT4.composablesLocation).toBe("app/composables");
    });
  });

  describe("INIT_DEPS", () => {
    it("should be an array of required dependencies", () => {
      expect(Array.isArray(INIT_DEPS)).toBe(true);
      expect(INIT_DEPS.length).toBeGreaterThan(0);
    });

    it("should include essential packages", () => {
      expect(INIT_DEPS).toContain("tailwindcss");
      expect(INIT_DEPS).toContain("reka-ui");
      expect(INIT_DEPS).toContain("@nuxt/icon");
    });
  });

  describe("INIT_DEV_DEPS", () => {
    it("should be an array of dev dependencies", () => {
      expect(Array.isArray(INIT_DEV_DEPS)).toBe(true);
    });

    it("should include typescript", () => {
      expect(INIT_DEV_DEPS).toContain("typescript");
    });
  });

  describe("INIT_DEV_DEPS_PRETTIER", () => {
    it("should include prettier-related packages", () => {
      expect(INIT_DEV_DEPS_PRETTIER).toContain("prettier");
      expect(INIT_DEV_DEPS_PRETTIER).toContain("prettier-plugin-tailwindcss");
    });
  });

  describe("INIT_MODULES", () => {
    it("should be an array of Nuxt modules", () => {
      expect(Array.isArray(INIT_MODULES)).toBe(true);
    });

    it("should include essential Nuxt modules", () => {
      expect(INIT_MODULES).toContain("@nuxtjs/color-mode");
      expect(INIT_MODULES).toContain("@nuxt/icon");
    });
  });

  describe("PACKAGE_MANAGER_CHOICES", () => {
    it("should include all major package managers", () => {
      const values = PACKAGE_MANAGER_CHOICES.map((c) => c.value);
      expect(values).toContain("npm");
      expect(values).toContain("yarn");
      expect(values).toContain("pnpm");
      expect(values).toContain("bun");
    });

    it("should have title and value for each choice", () => {
      PACKAGE_MANAGER_CHOICES.forEach((choice) => {
        expect(choice).toHaveProperty("title");
        expect(choice).toHaveProperty("value");
      });
    });
  });

  describe("CSS_THEME_OPTIONS", () => {
    it("should include various theme options", () => {
      const values = CSS_THEME_OPTIONS.map((c) => c.value);
      expect(values).toContain("zinc");
      expect(values).toContain("slate");
      expect(values).toContain("blue");
      expect(values).toContain("green");
    });

    it("should have at least 10 theme options", () => {
      expect(CSS_THEME_OPTIONS.length).toBeGreaterThanOrEqual(10);
    });

    it("should have title and value for each theme", () => {
      CSS_THEME_OPTIONS.forEach((theme) => {
        expect(theme).toHaveProperty("title");
        expect(theme).toHaveProperty("value");
        expect(typeof theme.title).toBe("string");
        expect(typeof theme.value).toBe("string");
      });
    });
  });
});
