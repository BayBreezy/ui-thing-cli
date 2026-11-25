# UI Thing CLI

![Cover Image](https://uithing.com/cover.png)

A CLI for adding [UI Thing](https://uithing.com) components to your Nuxt project. Pick only the components you need — no bloat, no lock-in.

## Credits

- [shadcn/ui](https://ui.shadcn.com) — design inspiration
- [Reka UI](https://reka-ui.com) — headless primitives
- [TailwindCSS](https://tailwindcss.com)
- [Nuxt](https://nuxt.com)

Thanks to the maintainers of all third-party libraries used in this project.

## 💸 Support

If you find this useful 😊

<a href="https://buymeacoffee.com/llehXIrI8g" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important" ></a>

---

## Getting Started

**1. Create a Nuxt project**

```bash
npx nuxi@latest init my-app
cd my-app
```

**2. Run the init command**

```bash
npx ui-thing@latest init
```

This sets up TailwindCSS, installs core dependencies, writes the theme CSS, and saves a `ui-thing.config.ts` to your project.

**3. Start adding components**

```bash
npx ui-thing@latest add button card dialog   # by name
npx ui-thing@latest add                      # or pick from a list
```

### Scripts, CI and AI agents

Every step can run without prompts:

```bash
npx nuxi@latest init my-app --template minimal --packageManager bun --no-install
cd my-app && bun install
npx ui-thing@latest init --yes
npx ui-thing@latest add button card vee-input --yes
npx ui-thing@latest theme rose --yes
```

`block`, `prettier` and `shortcuts` are interactive. AI agents can use the [UI Thing agent skill](https://github.com/BayBreezy/ui-thing/tree/v2/skills/uithing) (`npx skills add https://github.com/BayBreezy/ui-thing --skill uithing`) and the [MCP server](https://uithing.com/getting-started/mcp).

---

## Package Manager Support

The CLI works with all major package managers. `init` asks which one you use, or detects it from your lockfile when you pass `--yes`.

| Manager | Supported |
| ------- | --------- |
| npm     | ✅        |
| yarn    | ✅        |
| pnpm    | ✅        |
| bun     | ✅        |
| deno    | ✅        |

---

## Commands

### `init`

```bash
npx ui-thing@latest init
```

Bootstraps your Nuxt project for UI Thing. This command:

- Installs all core dependencies (`reka-ui`, `tailwind-variants`, `@nuxt/fonts`, `@vueuse/nuxt`, etc.)
- Writes the Tailwind CSS theme file
- Registers required Nuxt modules
- Creates `ui-thing.config.ts` with your chosen paths and package manager

**Options**

| Flag                         | Description                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `-y, --yes`                  | Skip all prompts and use defaults. Detects your package manager from your lockfile and skips the Prettier question |
| `-f, --force`                | Overwrite `ui-thing.config.ts` if it already exists                                                                |
| `-n, --nuxtVersion <number>` | Set the Nuxt version instead of detecting it from `package.json`                                                   |

`init` also installs TypeScript 6 (`typescript@^6`). TypeScript 7 has no compiler API, so Vue cannot compile components with it yet.

---

### `add`

```bash
npx ui-thing@latest add [componentNames...]
```

Adds one or more components to your project. If no names are passed, an interactive search lets you pick from the full library.

```bash
# interactive selection
npx ui-thing@latest add

# add specific components
npx ui-thing@latest add button input popover

# add every component at once
npx ui-thing@latest add --all
```

After a component is added, the CLI prints a link to its documentation page.

**Options**

| Flag                     | Description                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `-a, --all`              | Add every available component in one shot                                                                    |
| `--skip-config`          | Add components without a `ui-thing.config.ts` file. Auto-detects the Nuxt version and uses its default paths |
| `--package-manager <pm>` | Set the package manager when using `--skip-config` (skips the PM prompt)                                     |
| `-y, --yes`              | Skip confirmation prompts (uses yup for vee-validate components)                                             |
| `--validator <name>`     | Schema library to install for vee-validate components: `yup`, `zod`, `joi` or `valibot`                      |

**`--skip-config` example**

Useful when you just want the files without committing to the full config workflow:

```bash
# prompts for package manager, uses Nuxt 4 defaults
npx ui-thing@latest add popover --skip-config

# fully non-interactive
npx ui-thing@latest add popover --skip-config --package-manager bun
```

> **Note:** Shared utility files installed by one component are also used by others. Removing them manually may break components that depend on them.

---

### Installing from registries

`add` also installs components from any shadcn-style registry (the `registry-item.json` format used by shadcn-ui and shadcn-vue). Files are placed using your `ui-thing.config.ts` paths, npm dependencies are installed, and `css`/`cssVars`/`envVars` are merged into your project.

```bash
# a registry item URL
ui-thing add https://nxui.geoql.in/r/fluid-glass.json

# a namespaced item (@vue-bits and @nxui are built in)
ui-thing add @vue-bits/HoloMosaic

# skip the confirmation prompts
ui-thing add @nxui/fluid-glass --yes
```

Registry code is remote code, so `add` lists every file and package before writing anything. Paths that escape the project (`..`, absolute paths) are refused. If an item imports `cn` from `~/lib/utils` and your project has none, a standard `cn` (clsx + tailwind-merge) is created at `<srcDir>/lib/utils.ts`.

Installed registry items are recorded in `ui-thing.lock.json`, which `list --installed`, `update` and `remove` use.

Browse and configure registries:

```bash
ui-thing registry list                 # configured registries
ui-thing registry list @nxui           # every item in a registry
ui-thing registry search glass         # search all configured registries
ui-thing registry search holo @vue-bits
ui-thing registry add-namespace @acme https://acme.dev/r/{name}.json
```

Namespaces live under `registries` in `ui-thing.config.ts`. A value is a URL template containing `{name}`, or an object with `url`, `headers` and `params`; `${ENV_VAR}` references are expanded:

```ts
registries: {
  "@acme": { url: "https://acme.dev/r/{name}.json", headers: { Authorization: "Bearer ${ACME_TOKEN}" } },
}
```

### `list`

```bash
npx ui-thing@latest list
```

Lists all components available in the UI Thing library. With `--installed`, it also lists items you added from registries.

```bash
# show all available components
npx ui-thing@latest list

# show only components already installed in your project
npx ui-thing@latest list --installed
```

**Options**

| Flag              | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `-i, --installed` | Filter to components whose files are already present in your project |

---

### `update`

```bash
npx ui-thing@latest update [componentNames...]
```

Re-fetches component files from the API and overwrites them with the latest version, without asking. Commit your local edits first. Items installed from a registry are re-fetched from the source recorded in `ui-thing.lock.json`.

```bash
# update specific components
npx ui-thing@latest update button input

# pick from installed components interactively
npx ui-thing@latest update
```

---

### `remove`

```bash
npx ui-thing@latest remove [componentNames...]
```

Deletes installed component files from your project (component files, utils, and composables). Prompts for confirmation before deleting anything. For registry items, only the files recorded in `ui-thing.lock.json` are deleted.

```bash
# remove specific components
npx ui-thing@latest remove button

# pick from installed components interactively
npx ui-thing@latest remove
```

> **Note:** Shared utility files used by multiple components will be deleted. Any other components that depend on them may stop working and will need to be re-added.

---

### `block`

```bash
npx ui-thing@latest block
```

Adds pre-built UI blocks (page sections, layouts, etc.) to your project. It asks for a category, the blocks you want and where to put them (default `app/components/Blocks`), then adds the components the blocks use.

```bash
npx ui-thing@latest block --category Hero
```

---

### `theme`

```bash
npx ui-thing@latest theme
```

Swaps your project's color theme. Overwrites the Tailwind CSS theme file with the chosen theme.

```bash
npx ui-thing@latest theme rose          # pass the name to skip the picker
npx ui-thing@latest theme rose --yes    # also skip the overwrite confirmation
```

---

### `prettier`

```bash
npx ui-thing@latest prettier
```

Adds a Prettier configuration pre-configured for Tailwind CSS class sorting and installs `prettier`, `prettier-plugin-tailwindcss` and `@ianvs/prettier-plugin-sort-imports`. Safe to run on an existing project — it will offer to merge with your current `.prettierrc` if one exists. It does not reformat your files; run `npx prettier --write .` when you want to.

---

### `shortcuts`

```bash
npx ui-thing@latest shortcuts
```

Adds a `shortcuts.ts` file to your composables folder with `defineShortcuts` (register keyboard shortcuts) and `useKbd`, and installs the VueUse Nuxt module.

---

## Configuration

Running `init` creates a `ui-thing.config.ts` file at the root of your project:

```ts
export default {
  theme: "zinc",
  tailwindCSSLocation: "app/assets/css/tailwind.css",
  componentsLocation: "app/components/Ui",
  composablesLocation: "app/composables",
  pluginsLocation: "app/plugins",
  utilsLocation: "app/utils",
  force: true,
  useDefaultFilename: true,
  packageManager: "bun",
  // optional: third-party registries for `ui-thing add @namespace/item`
  registries: {
    "@acme": "https://acme.dev/r/{name}.json",
  },
};
```

| Key                   | Description                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `theme`               | Color theme (zinc, slate, rose, blue, etc.)                                                    |
| `tailwindCSSLocation` | Path to your Tailwind CSS file                                                                 |
| `componentsLocation`  | Where component `.vue` files are written                                                       |
| `composablesLocation` | Where composable files are written                                                             |
| `pluginsLocation`     | Where plugin files are written                                                                 |
| `utilsLocation`       | Where utility files are written                                                                |
| `force`               | Overwrite existing files without prompting                                                     |
| `useDefaultFilename`  | Skip per-file path prompts when adding components                                              |
| `packageManager`      | Package manager used for installing dependencies                                               |
| `registries`          | Optional. Extra shadcn-style registries by `@namespace` (`@vue-bits` and `@nxui` are built in) |

---

## Prose components

The `prose` command was removed in v0.4.0. Prose components for Nuxt Content docs (callouts, steps, tabs and more) ship with the [docd](https://github.com/BayBreezy/docd) Nuxt layer: `npx create-docd my-docs`.
