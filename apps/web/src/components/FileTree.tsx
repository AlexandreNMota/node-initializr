import { useMemo, useState } from 'react';

import type { GenerateConfig } from '@node-initializr/shared';
import { ChevronRight, File, Folder, FolderOpen, Package, Settings2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import { buildFileTree, type TreeNode } from './fileTreeModel';

type FileTreeProps = {
  config: GenerateConfig;
};

export function FileTree({ config }: FileTreeProps) {
  const tree = buildFileTree(config);
  const directoryPaths = useMemo(() => collectDirectoryPaths(tree), [tree]);
  const [closedPaths, setClosedPaths] = useState<Set<string>>(() => new Set());

  function toggleDirectory(path: string): void {
    setClosedPaths((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }

  return (
    <div
      aria-label="Project file tree"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Package className="size-4 text-blue-600" aria-hidden="true" />
          <span>{config.name}</span>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
          {config.language === 'typescript' ? 'TS' : 'JS'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <PreviewTag>{config.framework}</PreviewTag>
          <PreviewTag>{config.architecture}</PreviewTag>
          <PreviewTag>{config.packageManager}</PreviewTag>
        </div>
        <span className="shrink-0 text-xs text-slate-500">{directoryPaths.length} folders</span>
      </div>

      <div className="max-h-[540px] overflow-auto px-3 py-3">
        <TreeNodeList
          nodes={tree}
          level={0}
          parentPath=""
          closedPaths={closedPaths}
          onToggleDirectory={toggleDirectory}
        />
      </div>
    </div>
  );
}

function PreviewTag({ children }: { children: string }) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function TreeNodeList({
  nodes,
  level,
  parentPath,
  closedPaths,
  onToggleDirectory,
}: {
  nodes: TreeNode[];
  level: number;
  parentPath: string;
  closedPaths: Set<string>;
  onToggleDirectory: (path: string) => void;
}) {
  return (
    <ul className={cn(level > 0 && 'ml-4 border-l border-slate-200 pl-3')}>
      {nodes.map((node) => {
        const path = joinPath(parentPath, node.name);

        return (
          <TreeNodeItem
            key={`${node.type}-${path}`}
            node={node}
            level={level}
            path={path}
            closedPaths={closedPaths}
            onToggleDirectory={onToggleDirectory}
          />
        );
      })}
    </ul>
  );
}

function TreeNodeItem({
  node,
  level,
  path,
  closedPaths,
  onToggleDirectory,
}: {
  node: TreeNode;
  level: number;
  path: string;
  closedPaths: Set<string>;
  onToggleDirectory: (path: string) => void;
}) {
  const isDirectory = node.type === 'directory';
  const isClosed = closedPaths.has(path);
  const hasChildren = Boolean(node.children?.length);

  return (
    <li className="py-1">
      {isDirectory ? (
        <button
          type="button"
          className="flex min-h-7 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          aria-expanded={!isClosed}
          onClick={() => onToggleDirectory(path)}
        >
          <ChevronRight
            className={cn(
              'size-3.5 shrink-0 text-slate-400 transition-transform',
              !isClosed && 'rotate-90',
            )}
            aria-hidden="true"
          />
          <DirectoryIcon isOpen={!isClosed} />
          <span className="font-mono text-[0.84rem] leading-5">{node.name}</span>
        </button>
      ) : (
        <div className="flex min-h-7 items-center gap-2 rounded-md px-2 pl-8 text-sm text-slate-700 transition-colors hover:bg-slate-50">
          <FileNodeIcon name={node.name} />
          <span className="font-mono text-[0.84rem] leading-5">{node.name}</span>
        </div>
      )}

      {hasChildren && !isClosed ? (
        <TreeNodeList
          nodes={node.children ?? []}
          level={level + 1}
          parentPath={path}
          closedPaths={closedPaths}
          onToggleDirectory={onToggleDirectory}
        />
      ) : null}
    </li>
  );
}

function DirectoryIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return <FolderOpen className="size-4 shrink-0 text-blue-600" aria-hidden="true" />;
  }

  return <Folder className="size-4 shrink-0 text-blue-600" aria-hidden="true" />;
}

function FileNodeIcon({ name }: { name: string }) {
  if (name === 'package.json' || name.endsWith('.json')) {
    return <Settings2 className="size-4 shrink-0 text-slate-500" aria-hidden="true" />;
  }

  return <File className="size-4 shrink-0 text-slate-500" aria-hidden="true" />;
}

function collectDirectoryPaths(nodes: TreeNode[], parentPath = ''): string[] {
  return nodes.flatMap((node) => {
    if (node.type !== 'directory') {
      return [];
    }

    const path = joinPath(parentPath, node.name);

    return [path, ...collectDirectoryPaths(node.children ?? [], path)];
  });
}

function joinPath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}
