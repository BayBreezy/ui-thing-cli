import fs from "fs";

/**
 * Detect the Nuxt.js version from package.json.
 */
export function detectNuxtVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    const nuxtVer = pkg.dependencies?.nuxt || pkg.devDependencies?.nuxt;
    if (nuxtVer) {
      // check if version is 4.x
      // check for all possible formats with a regex
      if (/^[~^>=<\s]*4/.test(nuxtVer)) return 4;
      return 3;
    }
  } catch {
    return null;
  }
  return null;
}
