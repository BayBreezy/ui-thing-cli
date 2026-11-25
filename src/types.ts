/**
 * Represents the UI Thing configuration options.
 */
export type UIConfig = {
  /**
   * The Nuxt version being used
   *
   * @default 4
   *
   * @deprecated This is now auto detected based on package.json.
   */
  nuxtVersion?: number;
  /**
   * The theme to use
   *
   * @default "zinc"
   */
  theme: string;
  /**
   * Path to the Tailwind CSS file
   */
  tailwindCSSLocation: string;
  /**
   * Path to the components directory
   */
  componentsLocation: string;
  /**
   * Path to the composables directory
   */
  composablesLocation: string;
  /**
   * Path to the plugins directory
   */
  pluginsLocation?: string;
  /**
   * Path to the utils directory
   */
  utilsLocation: string;
  /**
   * Whether to overwrite existing files
   */
  force: boolean;
  /**
   * Whether to use the default filename when adding components.
   *
   * @default true
   */
  useDefaultFilename: boolean;
  /**
   * The default package manager to use for installing dependencies.
   */
  packageManager: string;
  /**
   * Third-party component registries, keyed by `@namespace`.
   * The value is a URL template containing `{name}`, or an object with `url`, `headers` and `params`.
   * `${ENV_VAR}` references are expanded.
   *
   * @example { "@vue-bits": "https://vue-bits.dev/r/{name}.json" }
   */
  registries?: Record<
    string,
    string | { url: string; headers?: Record<string, string>; params?: Record<string, string> }
  >;
};

/**
 * CLI options passed to the `init` command.
 */
export type InitOptions = {
  /**
   * Whether to overwrite existing configuration files.
   *
   * @default false
   */
  force?: boolean;
  /**
   * Whether to skip prompts and use default values.
   *
   * @default false
   */
  yes?: boolean;
  /**
   * The Nuxt version to use.
   *
   * @default 4
   */
  nuxtVersion?: number;
};

export type AddCommand = {
  /**
   * Whether to add all components.
   *
   * @default false
   */
  all?: boolean;
  /**
   * Skip loading the ui-thing config file and use auto-detected defaults instead.
   * Useful for adding components to a project that has no ui-thing.config.ts.
   *
   * @default false
   */
  skipConfig?: boolean;
  /**
   * Override the package manager when using --skip-config.
   * If not set and --skip-config is active, the user will be prompted.
   */
  packageManager?: string;
  /**
   * Skip confirmation prompts (registry install summary and package install).
   *
   * @default false
   */
  yes?: boolean;
  /**
   * The schema library to install for vee-validate components (yup, zod, joi or valibot).
   * Defaults to yup when `--yes` is set, otherwise the CLI asks.
   */
  validator?: string;
};

type TemplateFile = {
  fileName: string;
  dirPath: string;
  fileContent: string;
};

export type Component = {
  name: string;
  value: string;
  deps?: string[];
  devDeps?: string[];
  nuxtModules?: string[];
  instructions?: string[];
  files: TemplateFile[];
  utils: TemplateFile[];
  composables: TemplateFile[];
  plugins: TemplateFile[];
  components?: string[];
  askValidator?: boolean;
  overrides?: Record<string, any>;
  docsPath?: string;
};

export type BlockComponent = {
  /** The display name of the block */
  name: string;
  /** The filename of the block */
  fileName: string;
  /** The actual file content of the block */
  file: string;
  /** The category of the block */
  category: string;
  /** The path to the block */
  path: string;
  /** The components used by the block */
  components?: string[];
};
