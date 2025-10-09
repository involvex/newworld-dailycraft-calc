import { useMemo } from "react";
import {
  AllBonuses,
  RawMaterial,
  XPSummary,
  CraftingSummary,
  Item,
  Recipe
} from "../types";
import {
  calculateCraftingTree,
  aggregateRawMaterials,
  calculateXPGains
} from "../services/craftingService";
import { CraftingNodeData } from "../types";
import { RECIPES } from "../data/recipes";

interface UseCraftingTreeProps {
  _selectedPreset: string;
  selectedItemId: string;
  quantity: number;
  multiItems: any[];
  bonuses: AllBonuses;
  selectedIngredients: Record<string, string>;
  viewMode: string;
  summaryMode: string;
  collapsedNodes: Set<string>;
  removedNodes: Set<string>;
  items: Record<string, Item>;
  inventory: Record<string, number>;
}

const useCraftingTree = ({
  selectedItemId,
  quantity,
  multiItems,
  bonuses,
  selectedIngredients,
  viewMode,
  summaryMode,
  collapsedNodes,
  inventory,
  removedNodes,
  _selectedPreset,
  items
}: UseCraftingTreeProps) => {
  const craftingData: CraftingNodeData | null = useMemo(() => {
    if (Object.keys(items).length === 0 || Object.keys(RECIPES).length === 0) {
      return null;
    }
    if (multiItems.length > 0) {
      const children = multiItems
        .map(item =>
          calculateCraftingTree(
            item.id,
            item.qty,
            bonuses,
            items,
            selectedIngredients,
            viewMode as "net" | "gross"
          )
        )
        .filter((c): c is CraftingNodeData => c !== null);
      return {
        id: "MULTI",
        item: {
          id: "MULTI",
          name: "Multi-item",
          iconId: "",
          tier: 0,
          type: "",
          weight: 0,
          maxStack: 0,
          types: ""
        },
        quantity: 1,
        totalQuantity: 1,
        yieldBonus: 0,
        children
      };
    }
    if (selectedItemId) {
      return calculateCraftingTree(
        selectedItemId,
        quantity,
        bonuses,
        items,
        selectedIngredients,
        viewMode as "net" | "gross"
      );
    }
    return null;
  }, [
    selectedItemId,
    quantity,
    multiItems,
    bonuses,
    selectedIngredients,
    viewMode,
    _selectedPreset,
    items
  ]);

  const filteredCraftingData = useMemo(() => {
    if (!craftingData) return null;

    const filterNodes = (node: CraftingNodeData): CraftingNodeData | null => {
      if (removedNodes.has(node.id)) {
        return null;
      }
      const newChildren = node.children
        ?.map(filterNodes)
        .filter((c): c is CraftingNodeData => c !== null);
      return { ...node, children: newChildren };
    };

    return filterNodes(craftingData);
  }, [craftingData, removedNodes]);

  // Convert collapsedNodes Set to array for proper React dependency tracking
  const collapsedNodesArray = useMemo(
    () => Array.from(collapsedNodes).sort(),
    [collapsedNodes]
  );

  const summaryData = useMemo(() => {
    if (!filteredCraftingData) return { materials: [], title: "", xpGains: [] };

    const allMaterials = aggregateRawMaterials(
      filteredCraftingData,
      collapsedNodes,
      items,
      viewMode as "net" | "gross",
      bonuses,
      selectedIngredients
    );
    const xpGains = calculateXPGains(
      filteredCraftingData,
      bonuses,
      viewMode as "net" | "gross"
    );

    if (summaryMode === "xp") {
      // Return XP summary mode
      return {
        materials: [],
        title: "Experience Summary",
        xpGains
      };
    }

    if (summaryMode === "net") {
      const netMaterials = allMaterials
        .map(material => {
          const inInventory = inventory[material.item.id] || 0;
          const needed = Math.max(0, material.quantity - inInventory);
          return {
            ...material,
            quantity: needed,
            inInventory,
            originalQuantity: material.quantity
          };
        })
        .filter(m => m.quantity > 0);
      return {
        materials: netMaterials,
        title: "Net Materials",
        xpGains
      };
    }

    // Gross mode (or other modes)
    return {
      materials: allMaterials,
      title: "Gross Materials",
      xpGains
    };
  }, [
    filteredCraftingData,
    collapsedNodesArray.join(","), // Use serialized array instead of Set
    viewMode,
    summaryMode,
    JSON.stringify(inventory),
    JSON.stringify(bonuses),
    JSON.stringify(selectedIngredients),
    _selectedPreset,
    items
  ]);

  const allCraftableItems: Item[] = useMemo(
    () =>
      Object.values(items)
        .filter(item => RECIPES[item.id])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const netRequirementsWithInventory = useMemo(() => {
    if (summaryMode !== "net") return [];
    return summaryData.materials;
  }, [summaryData, summaryMode]);

  return {
    craftingData: filteredCraftingData,
    summaryData,
    allCraftableItems,
    filteredItems: allCraftableItems, // Placeholder, will be filtered by search term in App.tsx
    netRequirementsWithInventory
  };
};

export default useCraftingTree;
