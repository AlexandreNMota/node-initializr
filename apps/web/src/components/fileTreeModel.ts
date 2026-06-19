import type { GenerateConfig } from '@node-initializr/shared';

export type TreeNode = {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
};

export function buildFileTree(config: GenerateConfig): TreeNode[] {
  const extension = config.language === 'typescript' ? 'ts' : 'js';
  const srcChildren: TreeNode[] = [
    createFile(`app.${extension}`),
    createFile(`server.${extension}`),
    createDirectory('routes', [createFile(`index.${extension}`)]),
    ...createArchitectureDirectories(config.architecture),
  ];

  const libChildren: TreeNode[] = [];

  if (config.orm === 'prisma') {
    libChildren.push(createFile(`prisma.${extension}`));
  }

  if (config.auth === 'jwt') {
    libChildren.push(createFile(`jwt.${extension}`));

    srcChildren.push(createDirectory('middlewares', [createFile(`auth.${extension}`)]));
  }

  if (libChildren.length > 0) {
    srcChildren.push(createDirectory('lib', libChildren));
  }

  const tree: TreeNode[] = [
    createDirectory('src', srcChildren),
    createFile('package.json'),
    createFile('.env.example'),
    createFile('.gitignore'),
  ];

  if (config.language === 'typescript') {
    tree.push(createFile('tsconfig.json'));
  }

  if (config.orm === 'prisma') {
    tree.push(createDirectory('prisma', [createFile('schema.prisma')]));
  }

  if (config.dependencies.includes('docker')) {
    tree.push(createFile('Dockerfile'), createFile('docker-compose.yml'));
  }

  return tree;
}

function createFile(name: string): TreeNode {
  return {
    name,
    type: 'file',
  };
}

function createDirectory(name: string, children: TreeNode[] = []): TreeNode {
  return {
    name,
    type: 'directory',
    children,
  };
}

function createArchitectureDirectories(architecture: GenerateConfig['architecture']): TreeNode[] {
  if (architecture === 'clean') {
    return [
      createDirectory('domain'),
      createDirectory('application'),
      createDirectory('infrastructure'),
    ];
  }

  if (architecture === 'mvc') {
    return [createDirectory('controllers'), createDirectory('models'), createDirectory('views')];
  }

  return [createDirectory('modules')];
}
