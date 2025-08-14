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
};

export type Component = {
  name: string;
  value: string;
  deps?: string[];
  devDeps?: string[];
  nuxtModules?: string[];
  instructions?: string[];
  files: Composable[];
  utils: Composable[];
  composables: Composable[];
  plugins: Composable[];
  components?: string[];
  askValidator?: boolean;
  overrides?: Record<string, any>;
};

export type Composable = {
  fileName: string;
  dirPath: string;
  fileContent: string;
};
