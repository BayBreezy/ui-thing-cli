export type UIConfig = {
  nuxtVersion?: number;
  theme: string;
  tailwindCSSLocation: string;
  tailwindConfigLocation: string;
  componentsLocation: string;
  composablesLocation: string;
  pluginsLocation?: string;
  utilsLocation: string;
  force: boolean;
  useDefaultFilename: boolean;
  packageManager: string;
};

export type InitOptions = { force?: boolean; yes?: boolean; nuxtVersion?: number };

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
