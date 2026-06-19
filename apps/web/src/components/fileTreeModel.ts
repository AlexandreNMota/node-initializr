import type { GenerateConfig } from '@node-initializr/shared';

export type TreeNode = {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
};

export function buildFileTree(config: GenerateConfig): TreeNode[] {
  const extension = config.language === 'typescript' ? 'ts' : 'js';

  const srcChildren: TreeNode[] = [
    {
      name: `app.${extension}`,
      type: 'file',
    },
    {
      name: `server.${extension}`,
      type: 'file',
    },
    {
      name: 'routes',
      type: 'directory',
      children: [
        {
          name: `index.${extension}`,
          type: 'file',
        },
      ],
    },
  ];

  if (config.orm === 'prisma') {
    srcChildren.push({
      name: 'lib',
      type: 'directory',
      children: [
        {
          name: `prisma.${extension}`,
          type: 'file',
        },
      ],
    });
  }

  if (config.auth === 'jwt') {
    srcChildren.push(
      {
        name: 'lib',
        type: 'directory',
        children: [
          {
            name: `jwt.${extension}`,
            type: 'file',
          },
        ],
      },
      {
        name: 'middlewares',
        type: 'directory',
        children: [
          {
            name: `auth.${extension}`,
            type: 'file',
          },
        ],
      },
    );
  }

  const tree: TreeNode[] = [
    {
      name: 'src',
      type: 'directory',
      children: srcChildren,
    },
    {
      name: 'package.json',
      type: 'file',
    },
    {
      name: '.env.example',
      type: 'file',
    },
    {
      name: '.gitignore',
      type: 'file',
    },
  ];

  if (config.language === 'typescript') {
    tree.push({
      name: 'tsconfig.json',
      type: 'file',
    });
  }

  if (config.orm === 'prisma') {
    tree.push({
      name: 'prisma',
      type: 'directory',
      children: [
        {
          name: 'schema.prisma',
          type: 'file',
        },
      ],
    });
  }

  if (config.dependencies.includes('docker')) {
    tree.push(
      {
        name: 'Dockerfile',
        type: 'file',
      },
      {
        name: 'docker-compose.yml',
        type: 'file',
      },
    );
  }

  return tree;
}
