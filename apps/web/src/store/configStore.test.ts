import { beforeEach, describe, expect, it } from 'vitest';

import { useConfigStore } from './configStore';

describe('configStore - estado inicial', () => {
  beforeEach(() => {
    useConfigStore.getState().resetConfig();
  });

  it('deve iniciar com uma config valida padrao', () => {
    const { config } = useConfigStore.getState();

    expect(config).toEqual({
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
    });
  });
});

describe('configStore - setField', () => {
  beforeEach(() => {
    useConfigStore.getState().resetConfig();
  });

  it('deve atualizar um campo simples da config', () => {
    useConfigStore.getState().setField('name', 'api-produto');

    expect(useConfigStore.getState().config.name).toBe('api-produto');
  });

  it('deve atualizar campos enumerados da config', () => {
    useConfigStore.getState().setField('framework', 'fastify');
    useConfigStore.getState().setField('language', 'javascript');

    expect(useConfigStore.getState().config.framework).toBe('fastify');
    expect(useConfigStore.getState().config.language).toBe('javascript');
  });
});

describe('configStore - resetConfig', () => {
  beforeEach(() => {
    useConfigStore.getState().resetConfig();
  });

  it('deve restaurar o estado inicial', () => {
    useConfigStore.getState().setField('name', 'alterado');
    useConfigStore.getState().setField('framework', 'nestjs');
    useConfigStore.getState().addDependency('docker');

    useConfigStore.getState().resetConfig();

    expect(useConfigStore.getState().config).toEqual({
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
    });
  });
});

describe('configStore - dependencies', () => {
  beforeEach(() => {
    useConfigStore.getState().resetConfig();
  });

  it('deve adicionar uma dependency', () => {
    useConfigStore.getState().addDependency('docker');

    expect(useConfigStore.getState().config.dependencies).toEqual(['docker']);
  });

  it('nao deve adicionar dependency duplicada', () => {
    useConfigStore.getState().addDependency('docker');
    useConfigStore.getState().addDependency('docker');

    expect(useConfigStore.getState().config.dependencies).toEqual(['docker']);
  });

  it('deve remover uma dependency', () => {
    useConfigStore.getState().addDependency('docker');
    useConfigStore.getState().addDependency('swagger');

    useConfigStore.getState().removeDependency('docker');

    expect(useConfigStore.getState().config.dependencies).toEqual(['swagger']);
  });

  it('deve manter a lista igual ao remover dependency inexistente', () => {
    useConfigStore.getState().addDependency('swagger');

    useConfigStore.getState().removeDependency('docker');

    expect(useConfigStore.getState().config.dependencies).toEqual(['swagger']);
  });
});
