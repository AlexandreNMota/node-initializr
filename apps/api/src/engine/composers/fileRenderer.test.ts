import path from 'node:path';

import type { GenerateConfig } from '@node-initializr/shared';
import { describe, expect, it } from 'vitest';

import type { Fragment } from '../types.js';
import {
  assertSafeGeneratedPath,
  buildEnvExample,
  renderFiles,
  stripEjsExtension,
} from './fileRenderer.js';

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

function makeFragment(pathName: string, overrides: Partial<Fragment['manifest']> = {}): Fragment {
  return {
    id: `test/${pathName}`,
    path: path.resolve(__dirname, '__fixtures__', pathName),
    priority: 10,
    manifest: {
      id: `test/${pathName}`,
      dependencies: {},
      devDependencies: {},
      scripts: {},
      ...overrides,
    },
  };
}

describe('FileRenderer - renderizacao basica', () => {
  it('deve retornar um GeneratedFile por arquivo .ejs', async () => {
    const files = await renderFiles([makeFragment('fragment-simple')], baseConfig);

    expect(files.length).toBeGreaterThan(0);
  });

  it('deve remover extensao .ejs do path gerado', async () => {
    const files = await renderFiles([makeFragment('fragment-simple')], baseConfig);

    for (const file of files) {
      expect(file.path).not.toMatch(/\.ejs$/);
    }
  });

  it('deve sempre gerar encoding utf-8', async () => {
    const files = await renderFiles([makeFragment('fragment-simple')], baseConfig);

    for (const file of files) {
      expect(file.encoding).toBe('utf-8');
    }
  });
});

describe('FileRenderer - injecao de variaveis', () => {
  it('deve injetar o name da config no conteudo', async () => {
    const files = await renderFiles([makeFragment('fragment-variables')], {
      ...baseConfig,
      name: 'projeto-teste',
    });

    const readme = files.find((file) => file.path === 'README.md');

    expect(readme?.content).toContain('projeto-teste');
  });

  it('deve renderizar bloco typescript quando language e typescript', async () => {
    const files = await renderFiles([makeFragment('fragment-conditional')], {
      ...baseConfig,
      language: 'typescript',
    });

    const appFile = files.find((file) => file.path === 'src/app.ts');

    expect(appFile).toBeDefined();
    expect(appFile?.content).toContain('typescript app');
  });

  it('nao deve incluir blocos typescript quando language e javascript', async () => {
    const files = await renderFiles([makeFragment('fragment-conditional')], {
      ...baseConfig,
      language: 'javascript',
    });

    const tsFile = files.find((file) => file.path === 'src/app.ts');
    const jsFile = files.find((file) => file.path === 'src/app.js');

    expect(tsFile).toBeUndefined();
    expect(jsFile).toBeDefined();
    expect(jsFile?.content).toContain('javascript app');
  });
});

describe('FileRenderer - caminhos dos arquivos', () => {
  it('path nao deve incluir o prefixo files/', async () => {
    const files = await renderFiles([makeFragment('fragment-simple')], baseConfig);

    for (const file of files) {
      expect(file.path).not.toMatch(/^files\//);
    }
  });

  it('multiplos fragmentos nao devem colidir nos paths', async () => {
    const files = await renderFiles(
      [makeFragment('fragment-simple'), makeFragment('fragment-no-collision')],
      baseConfig,
    );

    const paths = files.map((file) => file.path);
    const uniquePaths = new Set(paths);

    expect(uniquePaths.size).toBe(paths.length);
  });
});

describe('FileRenderer - .env.example', () => {
  it('deve gerar .env.example com as envVars dos fragmentos', async () => {
    const files = await renderFiles(
      [
        makeFragment('fragment-simple', {
          envVars: [
            {
              key: 'DATABASE_URL',
              example: 'postgresql://user:pass@localhost:5432/db',
              description: 'Conexao com o banco',
              required: true,
            },
            {
              key: 'JWT_SECRET',
              example: 'sua-chave-secreta',
              description: 'Secret para JWT',
              required: true,
            },
          ],
        }),
      ],
      baseConfig,
    );

    const envFile = files.find((file) => file.path === '.env.example');

    expect(envFile).toBeDefined();
    expect(envFile?.content).toContain('DATABASE_URL=');
    expect(envFile?.content).toContain('JWT_SECRET=');
  });

  it('nao deve duplicar variaveis de ambiente', async () => {
    const files = await renderFiles(
      [
        makeFragment('fragment-simple', {
          envVars: [
            {
              key: 'PORT',
              example: '3000',
              description: 'Porta',
              required: true,
            },
          ],
        }),
        makeFragment('fragment-no-collision', {
          envVars: [
            {
              key: 'PORT',
              example: '3000',
              description: 'Porta',
              required: true,
            },
          ],
        }),
      ],
      baseConfig,
    );

    const envFile = files.find((file) => file.path === '.env.example');
    const portOccurrences = envFile?.content.match(/^PORT=/gm)?.length ?? 0;

    expect(portOccurrences).toBe(1);
  });
});

describe('FileRenderer - tratamento de erros', () => {
  it('deve lancar erro se template EJS tiver sintaxe invalida', async () => {
    await expect(renderFiles([makeFragment('fragment-broken-ejs')], baseConfig)).rejects.toThrow();
  });

  it('deve lancar erro se pasta files/ nao existir no fragmento', async () => {
    await expect(renderFiles([makeFragment('fragment-no-files-dir')], baseConfig)).rejects.toThrow(
      'files/',
    );
  });
});

describe('buildEnvExample', () => {
  it('deve gerar conteudo deterministico com KEY=example', () => {
    const content = buildEnvExample([
      {
        key: 'DATABASE_URL',
        example: 'postgresql://user:pass@localhost:5432/db',
        description: 'Conexao com o banco',
        required: true,
      },
      {
        key: 'JWT_SECRET',
        example: 'secret',
        description: 'Secret JWT',
        required: true,
      },
    ]);

    expect(content).toBe(
      ['DATABASE_URL=postgresql://user:pass@localhost:5432/db', 'JWT_SECRET=secret'].join('\n'),
    );
  });

  it('deve remover variaveis duplicadas mantendo a primeira ocorrencia', () => {
    const content = buildEnvExample([
      {
        key: 'PORT',
        example: '3000',
        description: 'Porta',
        required: true,
      },
      {
        key: 'PORT',
        example: '4000',
        description: 'Porta alternativa',
        required: true,
      },
    ]);

    expect(content).toBe('PORT=3000');
  });
});

describe('stripEjsExtension', () => {
  it('deve remover extensao .ejs do final do path', () => {
    expect(stripEjsExtension('src/app.ts.ejs')).toBe('src/app.ts');
  });

  it('nao deve alterar path sem extensao .ejs', () => {
    expect(stripEjsExtension('src/app.ts')).toBe('src/app.ts');
  });
});

describe('assertSafeGeneratedPath', () => {
  it('deve rejeitar path traversal', () => {
    expect(() => assertSafeGeneratedPath('../outside.ts')).toThrow('Unsafe generated file path');
  });

  it('deve rejeitar path absoluto', () => {
    expect(() => assertSafeGeneratedPath('C:/temp/outside.ts')).toThrow(
      'Unsafe generated file path',
    );
  });

  it('deve aceitar path relativo seguro', () => {
    expect(assertSafeGeneratedPath('src/app.ts')).toBe('src/app.ts');
  });
});
