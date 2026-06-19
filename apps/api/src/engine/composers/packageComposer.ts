import semver from 'semver';

import type { GenerateConfig } from '@node-initializr/shared';

import type { Fragment } from '../types.js';

type PackageJsonShape = {
  name: string;
  version: string;
  description: string;
  main: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  engines: {
    node: string;
  };
};

export function composePackageJson(
  config: GenerateConfig,
  fragments: Fragment[],
): PackageJsonShape {
  return {
    name: config.name,
    version: '1.0.0',
    description: '',
    main: getMainEntry(config),
    scripts: mergeScripts(config, fragments),
    dependencies: mergeDependencies(fragments, 'dependencies'),
    devDependencies: mergeDependencies(fragments, 'devDependencies'),
    engines: {
      node: '>=20.0.0',
    },
  };
}

function getMainEntry(config: GenerateConfig): string {
  if (config.language === 'typescript') {
    return 'dist/server.js';
  }

  return 'src/server.js';
}

function mergeDependencies(
  fragments: Fragment[],
  field: 'dependencies' | 'devDependencies',
): Record<string, string> {
  const dependencies: Record<string, string> = {};

  for (const fragment of fragments) {
    const fragmentDependencies = fragment.manifest[field] ?? {};

    for (const [name, version] of Object.entries(fragmentDependencies)) {
      dependencies[name] = mergeVersions(dependencies[name], sanitizeVersion(version));
    }
  }

  return dependencies;
}

export function mergeScripts(
  config: GenerateConfig,
  fragments: Fragment[],
): Record<string, string> {
  const scripts: Record<string, string> = {};
  const orderedFragments = [...fragments].sort((first, second) => first.priority - second.priority);

  for (const fragment of orderedFragments) {
    const fragmentScripts = fragment.manifest.scripts ?? {};

    for (const [name, command] of Object.entries(fragmentScripts)) {
      if (scripts[name] === undefined) {
        scripts[name] = command;
      }
    }
  }

  const baseScripts = getBaseScripts(config);

  for (const [name, command] of Object.entries(baseScripts)) {
    if (scripts[name] === undefined) {
      scripts[name] = command;
    }
  }

  return scripts;
}

function getBaseScripts(config: GenerateConfig): Record<string, string> {
  if (config.language === 'typescript') {
    return {
      dev: 'tsx watch src/server.ts',
      build: 'tsc',
      start: 'node dist/server.js',
    };
  }

  return {
    dev: 'node src/server.js',
    build: 'echo "No build step required"',
    start: 'node src/server.js',
  };
}

export function mergeVersions(currentVersion: string | undefined, nextVersion: string): string {
  if (!currentVersion) {
    return nextVersion;
  }

  if (semver.gt(nextVersion, currentVersion)) {
    return nextVersion;
  }

  return currentVersion;
}

function sanitizeVersion(version: string): string {
  return version.replace(/^[\^~]/, '');
}
