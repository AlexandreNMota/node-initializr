import { create } from 'zustand';

import type { GenerateConfig } from '@node-initializr/shared';

type ConfigStore = {
  config: GenerateConfig;
  setField: <Key extends keyof GenerateConfig>(field: Key, value: GenerateConfig[Key]) => void;
  resetConfig: () => void;
  addDependency: (dependency: GenerateConfig['dependencies'][number]) => void;
  removeDependency: (dependency: GenerateConfig['dependencies'][number]) => void;
};

export const initialConfig: GenerateConfig = {
  name: 'my-node-app',
  packageManager: 'npm',
  framework: 'express',
  language: 'typescript',
  architecture: 'modular',
  database: 'none',
  orm: 'none',
  auth: 'none',
  messaging: 'none',
  dependencies: [],
};

export const useConfigStore = create<ConfigStore>((set) => ({
  config: initialConfig,

  setField: (field, value) => {
    set((state) => ({
      config: {
        ...state.config,
        [field]: value,
      },
    }));
  },

  resetConfig: () => {
    set({
      config: {
        ...initialConfig,
        dependencies: [],
      },
    });
  },

  addDependency: (dependency) => {
    set((state) => {
      if (state.config.dependencies.includes(dependency)) {
        return state;
      }

      return {
        config: {
          ...state.config,
          dependencies: [...state.config.dependencies, dependency],
        },
      };
    });
  },

  removeDependency: (dependency) => {
    set((state) => ({
      config: {
        ...state.config,
        dependencies: state.config.dependencies.filter((item) => item !== dependency),
      },
    }));
  },
}));
