import fs from 'node:fs/promises';
import path from 'node:path';

import ejs from 'ejs';

import type { GenerateConfig } from '@node-initializr/shared';

import type { EnvVar, Fragment, GeneratedFile } from '../types.js';

export async function renderFiles(
  fragments: Fragment[],
  config: GenerateConfig,
): Promise<GeneratedFile[]> {
  const generatedFiles: GeneratedFile[] = [];
  const usedPaths = new Set<string>();

  for (const fragment of fragments) {
    const filesDir = path.join(fragment.path, 'files');

    await assertFilesDirExists(filesDir);

    const templatePaths = await findEjsTemplates(filesDir);

    for (const templatePath of templatePaths) {
      const generatedFile = await renderTemplateFile(templatePath, filesDir, config);

      if (generatedFile.content.trim() === '') {
        continue;
      }

      if (usedPaths.has(generatedFile.path)) {
        throw new Error(`Duplicate generated file path: ${generatedFile.path}`);
      }

      usedPaths.add(generatedFile.path);
      generatedFiles.push(generatedFile);
    }
  }

  const envExample = buildEnvExample(getEnvVars(fragments));

  if (envExample) {
    generatedFiles.push({
      path: '.env.example',
      content: envExample,
      encoding: 'utf-8',
    });
  }

  return generatedFiles;
}

async function assertFilesDirExists(filesDir: string): Promise<void> {
  try {
    const stat = await fs.stat(filesDir);

    if (!stat.isDirectory()) {
      throw new Error();
    }
  } catch {
    throw new Error(`Fragment files/ directory not found: ${filesDir}`);
  }
}

async function findEjsTemplates(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const templates: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      templates.push(...(await findEjsTemplates(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.ejs')) {
      templates.push(entryPath);
    }
  }

  return templates.sort();
}

async function renderTemplateFile(
  templatePath: string,
  filesDir: string,
  config: GenerateConfig,
): Promise<GeneratedFile> {
  const template = await fs.readFile(templatePath, 'utf-8');
  const isTypeScript = config.language === 'typescript';
  const rendered = ejs.render(template, {
    config,
    isTypeScript,
    ...config,
  });

  return {
    path: normalizeGeneratedPath(stripEjsExtension(path.relative(filesDir, templatePath))),
    content: rendered,
    encoding: 'utf-8',
  };
}

function getEnvVars(fragments: Fragment[]): EnvVar[] {
  return fragments.flatMap((fragment) => fragment.manifest.envVars ?? []);
}

export function buildEnvExample(envVars: EnvVar[]): string {
  const uniqueEnvVars = new Map<string, EnvVar>();

  for (const envVar of envVars) {
    if (!uniqueEnvVars.has(envVar.key)) {
      uniqueEnvVars.set(envVar.key, envVar);
    }
  }

  return Array.from(uniqueEnvVars.values())
    .map((envVar) => `${envVar.key}=${envVar.example}`)
    .join('\n');
}

export function stripEjsExtension(filePath: string): string {
  return filePath.replace(/\.ejs$/, '');
}

function normalizeGeneratedPath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}
