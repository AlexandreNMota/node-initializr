import type { GenerateConfig } from '@node-initializr/shared';
import { describe, expect, it } from 'vitest';

import type { Fragment } from '../types.js';
import { composePackageJson, mergeVersions } from './packageComposer.js';

const baseConfig: GenerateConfig = {
  name: 'meu-projeto',
  packageManager: 'pnpm',
  framework: 'express',
  language: 'typescript',
  architecture: 'modular',
  database: 'postgresql',
  orm: 'prisma',
  auth: 'jwt',
  messaging: 'none',
  dependencies: [],
};

function makeFragment(overrides: Partial<Fragment['manifest']> = {}): Fragment {
  return {
    id: 'test/fragment',
    path: '/fake/path',
    priority: 10,
    manifest: {
      id: 'test/fragment',
      dependencies: {},
      devDependencies: {},
      scripts: {},
      ...overrides,
    },
  };
}

describe('PackageComposer - campos obrigatorios', () => {
  it('deve gerar todos os campos obrigatorios', () => {
    const packageJson = composePackageJson(baseConfig, [makeFragment()]);

    expect(packageJson.name).toBeDefined();
    expect(packageJson.version).toBeDefined();
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.engines).toBeDefined();
  });

  it('deve usar o name da config', () => {
    const packageJson = composePackageJson({ ...baseConfig, name: 'outro-projeto' }, []);

    expect(packageJson.name).toBe('outro-projeto');
  });

  it('deve sempre gerar version 1.0.0', () => {
    const packageJson = composePackageJson(baseConfig, []);

    expect(packageJson.version).toBe('1.0.0');
  });

  it('deve sempre gerar engines.node >= 20.0.0', () => {
    const packageJson = composePackageJson(baseConfig, []);

    expect(packageJson.engines.node).toBe('>=20.0.0');
  });
});

describe('PackageComposer - agregacao de dependencias', () => {
  it('deve agregar dependencies de multiplos fragmentos', () => {
    const fragments = [
      makeFragment({ dependencies: { express: '4.19.0' } }),
      makeFragment({ dependencies: { zod: '3.23.0' } }),
    ];

    const packageJson = composePackageJson(baseConfig, fragments);

    expect(packageJson.dependencies.express).toBe('4.19.0');
    expect(packageJson.dependencies.zod).toBe('3.23.0');
  });

  it('deve agregar devDependencies separadamente', () => {
    const fragments = [
      makeFragment({ devDependencies: { typescript: '5.5.0' } }),
      makeFragment({ devDependencies: { vitest: '1.6.0' } }),
    ];

    const packageJson = composePackageJson(baseConfig, fragments);

    expect(packageJson.devDependencies.typescript).toBe('5.5.0');
    expect(packageJson.devDependencies.vitest).toBe('1.6.0');
  });

  it('nao deve incluir devDependency em dependencies', () => {
    const fragments = [makeFragment({ devDependencies: { typescript: '5.5.0' } })];

    const packageJson = composePackageJson(baseConfig, fragments);

    expect(packageJson.dependencies.typescript).toBeUndefined();
  });

  it('deve usar a versao maior quando ha conflito', () => {
    const fragments = [
      makeFragment({ dependencies: { express: '4.18.0' } }),
      makeFragment({ dependencies: { express: '4.19.2' } }),
    ];

    const packageJson = composePackageJson(baseConfig, fragments);

    expect(packageJson.dependencies.express).toBe('4.19.2');
  });
});

it('deve sanitizar prefixos ^ e ~ antes de agregar versoes', () => {
  const fragments = [
    makeFragment({
      dependencies: { express: '^4.19.0' },
      devDependencies: { typescript: '~5.5.0' },
    }),
  ];

  const packageJson = composePackageJson(baseConfig, fragments);

  expect(packageJson.dependencies.express).toBe('4.19.0');
  expect(packageJson.devDependencies.typescript).toBe('5.5.0');
});

it('deve falhar quando a mesma lib aparece em dependencies e devDependencies no mesmo fragmento', () => {
  const fragments = [
    makeFragment({
      dependencies: { typescript: '5.5.0' },
      devDependencies: { typescript: '5.5.0' },
    }),
  ];

  expect(() => composePackageJson(baseConfig, fragments)).toThrow('typescript');
});

describe('PackageComposer - scripts', () => {
  it('deve incluir scripts dev, build e start', () => {
    const packageJson = composePackageJson(baseConfig, []);

    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.start).toBeDefined();
  });

  it('deve agregar scripts de multiplos fragmentos', () => {
    const fragments = [
      makeFragment({ scripts: { 'db:migrate': 'prisma migrate dev' } }),
      makeFragment({ scripts: { 'db:generate': 'prisma generate' } }),
    ];

    const packageJson = composePackageJson(baseConfig, fragments);

    expect(packageJson.scripts['db:migrate']).toBe('prisma migrate dev');
    expect(packageJson.scripts['db:generate']).toBe('prisma generate');
  });

  it('fragmento de maior prioridade nao deve ser sobrescrito', () => {
    const highPriority: Fragment = {
      ...makeFragment({ scripts: { dev: 'tsx src/app.ts' } }),
      priority: 1,
    };
    const lowPriority: Fragment = {
      ...makeFragment({ scripts: { dev: 'node src/app.js' } }),
      priority: 99,
    };

    const packageJson = composePackageJson(baseConfig, [highPriority, lowPriority]);

    expect(packageJson.scripts.dev).toBe('tsx src/app.ts');
  });
});

describe('PackageComposer - versoes fixadas', () => {
  it('nao deve gerar versoes com ^ ou ~', () => {
    const fragments = [
      makeFragment({
        dependencies: { express: '4.19.0', zod: '3.23.0' },
        devDependencies: { typescript: '5.5.0', vitest: '1.6.0' },
      }),
    ];

    const packageJson = composePackageJson(baseConfig, fragments);
    const allVersions = [
      ...Object.values(packageJson.dependencies),
      ...Object.values(packageJson.devDependencies),
    ];

    for (const version of allVersions) {
      expect(version).not.toMatch(/^[\^~]/);
    }
  });
});

describe('PackageComposer - scripts por linguagem', () => {
  it('scripts typescript devem referenciar tsx ou tsc', () => {
    const packageJson = composePackageJson({ ...baseConfig, language: 'typescript' }, []);

    expect(packageJson.scripts.dev).toMatch(/tsx|tsc/);
  });

  it('scripts javascript devem referenciar node', () => {
    const packageJson = composePackageJson({ ...baseConfig, language: 'javascript' }, []);

    expect(packageJson.scripts.dev).toMatch(/node/);
  });
});

describe('mergeVersions', () => {
  it('deve retornar nextVersion quando currentVersion nao existe', () => {
    expect(mergeVersions(undefined, '1.2.0')).toBe('1.2.0');
  });

  it('deve retornar a maior versao quando nextVersion for maior', () => {
    expect(mergeVersions('1.0.0', '1.2.0')).toBe('1.2.0');
  });

  it('deve manter currentVersion quando ela for maior', () => {
    expect(mergeVersions('2.0.0', '1.2.0')).toBe('2.0.0');
  });
});
