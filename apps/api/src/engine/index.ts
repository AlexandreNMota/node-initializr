import { existsSync } from 'node:fs';
import path from 'node:path';
import { PassThrough } from 'node:stream';

import { ZipArchive } from 'archiver';

import type { GenerateConfig, ValidationError } from '@node-initializr/shared';

import { composeInfraFiles } from './composers/infraComposer.js';
import { composePackageJson } from './composers/packageComposer.js';
import { renderFiles } from './composers/fileRenderer.js';
import { resolveFragments } from './resolver.js';
import type { GeneratedFile } from './types.js';
import { validate } from './validator.js';

type GenerationError = Error & {
  code: string;
  details?: ValidationError;
};

export async function generateProject(config: GenerateConfig): Promise<Buffer> {
  const validation = validate(config);

  if (!validation.success) {
    throw createGenerationError(validation.error.code, validation.error.message, validation.error);
  }

  try {
    const fragments = resolveFragments(validation.data);
    const renderableFragments = fragments.filter(hasFilesDirectory);
    const renderedFiles = await renderFiles(renderableFragments, validation.data);
    const packageJson = composePackageJson(validation.data, fragments);
    const infraFiles = composeInfraFiles(validation.data);

    const files: GeneratedFile[] = [
      ...renderedFiles,
      ...infraFiles,
      {
        path: 'package.json',
        content: `${JSON.stringify(packageJson, null, 2)}\n`,
        encoding: 'utf-8',
      },
    ];

    return zipFiles(files);
  } catch (error) {
    if (isGenerationError(error)) {
      throw error;
    }

    throw createGenerationError('GENERATION_FAILED', 'Falha ao gerar projeto.');
  }
}

function zipFiles(files: GeneratedFile[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on('error', reject);
    stream.on('error', reject);

    archive.pipe(stream);

    for (const file of files) {
      archive.append(file.content, { name: file.path });
    }

    archive.finalize().catch(reject);
  });
}

function createGenerationError(
  code: string,
  message: string,
  details?: ValidationError,
): GenerationError {
  const error = new Error(message) as GenerationError;
  error.code = code;
  error.details = details;

  return error;
}

function isGenerationError(error: unknown): error is GenerationError {
  return error instanceof Error && 'code' in error;
}

function hasFilesDirectory(fragment: { path: string }): boolean {
  return existsSync(path.join(fragment.path, 'files'));
}
