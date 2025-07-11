export function collectAllNodeIds(node: any, ids = new Set<string>()) {
  if (!node) return ids;
  ids.add(node.id);
  node.children?.forEach((child: any) => collectAllNodeIds(child, ids));
  return ids;
}

export function collectSubtreeNodeIds(node: any, ids = new Set<string>()) {
  // Same as collectAllNodeIds, but for subtree only
  return collectAllNodeIds(node, ids);
}
