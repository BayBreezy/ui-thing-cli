export type UIConfig = {
  theme: string;
  tailwindCSSLocation: string;
  tailwindConfigLocation: string;
  componentsLocation: string;
  composablesLocation: string;
  utilsLocation: string;
  force: boolean;
  useDefaultFilename: boolean;
  packageManager: string;
};

export type InitOptions = { force?: boolean };

export type Component = {
  name: string;
  value: string;
  deps: string[];
  devDeps: string[];
  nuxtModules: string[];
  instructions?: string[];
  files: Composable[];
  utils: Composable[];
  composables: Composable[];
  plugins: Composable[];
  components?: string[];
  askValidator?: boolean;
};

export type Composable = {
  fileName: string;
  dirPath: string;
  fileContent: string;
};
