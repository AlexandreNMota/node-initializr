import type { GenerateConfig } from '@node-initializr/shared';

import { buildFileTree, type TreeNode } from './fileTreeModel';

type FileTreeProps = {
  config: GenerateConfig;
};

export function FileTree({ config }: FileTreeProps) {
  const tree = buildFileTree(config);

  return (
    <div aria-label="Project file tree">
      <TreeNodeList nodes={tree} />
    </div>
  );
}

function TreeNodeList({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul>
      {nodes.map((node) => (
        <TreeNodeItem key={`${node.type}-${node.name}`} node={node} />
      ))}
    </ul>
  );
}

function TreeNodeItem({ node }: { node: TreeNode }) {
  return (
    <li>
      <span>{node.name}</span>

      {node.children ? <TreeNodeList nodes={node.children} /> : null}
    </li>
  );
}
