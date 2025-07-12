import { useCallback, Dispatch, SetStateAction } from 'react'; // Added Dispatch, SetStateAction
import { collectSubtreeNodeIds, collectAncestorNodeIds } from '../utils/treeUtils';

interface UseTreeCollapseProps {
  collapsedNodes: Set<string>;
  setCollapsedNodes: Dispatch<SetStateAction<Set<string>>>; // Updated type
}

export default function useTreeCollapse({ collapsedNodes, setCollapsedNodes }: UseTreeCollapseProps) {
  // Removed internal useState for collapsedNodes as it's now passed as a prop

  // Collapse all nodes in the tree
  const handleCollapseAll = useCallback((rootNode?: any) => {
    if (rootNode) {
      const allNodeIds = collectSubtreeNodeIds(rootNode);
      setCollapsedNodes((prev: Set<string>) => { // Explicitly type prev
        const newSet = new Set(prev);
        allNodeIds.forEach(id => newSet.add(id));
        // localStorage.setItem('collapsedNodes', JSON.stringify([...newSet])); // Removed as App.tsx handles this
        return newSet;
      });
    } else {
      // Must be passed the root node for full collapse
      // User of this hook must call with root node
    }
  }, [setCollapsedNodes]); // Added setCollapsedNodes to dependencies

  // Expand all nodes in the tree
  const handleExpandAll = useCallback((rootNode?: any) => {
    if (rootNode) {
      setCollapsedNodes((prev: Set<string>) => { // Explicitly type prev
        const idsToRemove = collectSubtreeNodeIds(rootNode);
        const newSet = new Set(prev);
        idsToRemove.forEach(id => newSet.delete(id));
        // localStorage.setItem('collapsedNodes', JSON.stringify([...newSet])); // Removed as App.tsx handles this
        return newSet;
      });
    } else {
      // User of this hook must call with root node
    }
  }, [setCollapsedNodes]); // Added setCollapsedNodes to dependencies

  // Collapse only a subtree
  const handleCollapseSubtree = useCallback((node: any) => {
    const allNodeIds = collectSubtreeNodeIds(node);
    setCollapsedNodes((prev: Set<string>) => { // Explicitly type prev
      const newSet = new Set(prev);
      allNodeIds.forEach(id => newSet.add(id));
      // localStorage.setItem('collapsedNodes', JSON.stringify([...newSet])); // Removed as App.tsx handles this
      return newSet;
    });
  }, [setCollapsedNodes]); // Added setCollapsedNodes to dependencies

  // Expand only a subtree
  const handleExpandSubtree = useCallback((node: any) => {
    const allNodeIds = collectSubtreeNodeIds(node);
    setCollapsedNodes((prev: Set<string>) => { // Explicitly type prev
      const newSet = new Set(prev);
      allNodeIds.forEach(id => newSet.delete(id));
        // localStorage.setItem('collapsedNodes', JSON.stringify([...newSet])); // Removed as App.tsx handles this
      return newSet;
    });
  }, [setCollapsedNodes]); // Added setCollapsedNodes to dependencies

  // Toggle a single node
  const handleToggleNode = useCallback((nodeId: string) => {
    setCollapsedNodes((prev: Set<string>) => { // Explicitly type prev
      const newSet = new Set(prev);
      newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
      // localStorage.setItem('collapsedNodes', JSON.stringify([...newSet])); // Removed as App.tsx handles this
      return newSet;
    });
  }, [setCollapsedNodes]); // Added setCollapsedNodes to dependencies

  // Restore collapsedNodes from preset
  const restoreCollapsedNodes = useCallback((nodes: string[] | Set<string>) => {
    const newSet = new Set(Array.isArray(nodes) ? nodes : Array.from(nodes));

    const areSetsEqual = (set1: Set<string>, set2: Set<string>) => {
      if (set1.size !== set2.size) return false;
      for (const item of set1) {
        if (!set2.has(item)) return false;
      }
      return true;
    };

    setCollapsedNodes(prev => {
      if (!areSetsEqual(newSet, prev)) {
        return newSet;
      }
      return prev; // Return previous state if no change to prevent re-render
    });
  }, [setCollapsedNodes]);

  // Collapse only the target node (not the entire path)
  const handleCollapseToNode = useCallback((_rootNode: any, targetNodeId: string) => {
    setCollapsedNodes((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.add(targetNodeId); // Only collapse the target node itself
      return newSet;
    });
  }, [setCollapsedNodes]);

  // Expand only nodes from root to the target node (limited expand)
  const handleExpandToNode = useCallback((rootNode: any, targetNodeId: string) => {
    const ancestorNodes = collectAncestorNodeIds(rootNode, targetNodeId);
    setCollapsedNodes((prev: Set<string>) => {
      const newSet = new Set(prev);
      ancestorNodes.forEach(id => newSet.delete(id));
      return newSet;
    });
  }, [setCollapsedNodes]);

  return {
    collapsedNodes, // Now returned from props
    setCollapsedNodes, // Now returned from props
    handleCollapseAll,
    handleExpandAll,
    handleToggleNode,
    handleCollapseSubtree,
    handleExpandSubtree,
    handleCollapseToNode,
    handleExpandToNode,
    restoreCollapsedNodes,
  };
}
