import type { DependencyId, GenerateConfig } from '@node-initializr/shared';

import { fragmentRegistry, type FragmentId } from './fragmentRegistry.js';
import type { Fragment } from './types.js';

export function resolveFragments(config: GenerateConfig): Fragment[] {
  const fragmentIds: FragmentId[] = [
    getBaseFragmentId(config),
    getFrameworkFragmentId(config),
    ...getOrmFragmentIds(config),
    ...getAuthFragmentIds(config),
    ...getDependencyFragmentIds(config.dependencies),
  ];

  return fragmentIds
    .map((fragmentId) => fragmentRegistry[fragmentId])
    .sort((first, second) => first.priority - second.priority);
}

function getBaseFragmentId(config: GenerateConfig): FragmentId {
  return `base/${config.language}` as FragmentId;
}

function getFrameworkFragmentId(config: GenerateConfig): FragmentId {
  return `frameworks/${config.framework}` as FragmentId;
}

function getOrmFragmentIds(config: GenerateConfig): FragmentId[] {
  if (config.orm === 'none') {
    return [];
  }

  return [`orms/${config.orm}` as FragmentId];
}

function getAuthFragmentIds(config: GenerateConfig): FragmentId[] {
  if (config.auth === 'none') {
    return [];
  }

  return [`auth/${config.auth}` as FragmentId];
}

function getDependencyFragmentIds(dependencies: DependencyId[]): FragmentId[] {
  return dependencies.map((dependency) => `deps/${dependency}` as FragmentId);
}