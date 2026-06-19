import type { GenerateConfig } from '@node-initializr/shared';

export type FragmentManifest = {
  id: string;
  requires?: string[];
  excludes?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  envVars?: EnvVar[];
};

export type EnvVar = {
  key: string;
  example: string;
  description: string;
  required: boolean;
};

export type Fragment = {
  id: string;
  path: string;
  manifest: FragmentManifest;
  priority: number;
};

export type { GenerateConfig };
