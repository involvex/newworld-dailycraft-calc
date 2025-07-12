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
