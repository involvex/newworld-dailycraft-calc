export function collectAllNodeIds(node: any): string[] {
  const ids: string[] = [];
  function traverse(n: any) {
    ids.push(n.id);
    if (n.children) n.children.forEach(traverse);
  }
  traverse(node);
  return ids;
}

export function findNodeById(node: any, id: string): any | null {
  if (node.id === id) {
    return node;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function collectSubtreeNodeIds(node: any): string[] {
  const ids: string[] = [];
  function traverse(n: any) {
    ids.push(n.id);
    if (n.children) n.children.forEach(traverse);
  }
  traverse(node);
  return ids;
}

// Collect all node IDs from root to the target node (including target)
export function collectPathToNode(
  rootNode: any,
  targetNodeId: string
): string[] {
  const path: string[] = [];

  function findPath(node: any, target: string, currentPath: string[]): boolean {
    currentPath.push(node.id);

    if (node.id === target) {
      path.push(...currentPath);
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (findPath(child, target, [...currentPath])) {
          return true;
        }
      }
    }

    return false;
  }

  findPath(rootNode, targetNodeId, []);
  return path;
}

// Collect all ancestor node IDs from root to parent of target node (excluding target)
export function collectAncestorNodeIds(
  rootNode: any,
  targetNodeId: string
): string[] {
  const path = collectPathToNode(rootNode, targetNodeId);
  // Remove the target node itself, keeping only ancestors
  return path.slice(0, -1);
}
