import { Item } from "../types";
import { RECIPES } from "../data/recipes";
import { ITEMS } from "../data/items";

const DATA_ENDPOINTS = {
  Leatherworking:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_tradeskillleatherworking.json",
  Smelting:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_tradeskillsmelting.json",
  Stonecutting:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_tradeskillstonecutting.json",
  Weaving:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_tradeskillweaving.json",
  Woodworking:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_tradeskillwoodworking.json",
  itemdefinitions_master_crafting:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_itemdefinitions_master_crafting.json",
  Crafting_Refining:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_crafting_refining.json",
  Gatherables:
    "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables/javelindata_gatherables.json"
};

async function fetchJson(_url: string) {
  try {
    const response = await fetch(_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${_url}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${_url}:`, error);
    return []; // Return empty array on error to prevent breaking Promise.all
  }
}

function processItemData(itemData: any[]): Record<string, Item> {
  const items: Record<string, Item> = {};
  if (!Array.isArray(itemData)) {
    console.error("Expected itemData to be an array, but got:", itemData);
    return items;
  }
  itemData.forEach((item: any) => {
    const itemId = item.ItemID;
    if (itemId) {
      items[itemId] = {
        id: itemId,
        name: item.Name,
        iconId: item.IconPath,
        tier: item.Tier || 1,
        type: item.ItemType,
        weight: item.Weight || 0.1,
        maxStack: item.MaxStack,
        types: item.ItemType
      };
    }
  });
  return items;
}

export async function loadDynamicData() {
  const [itemDefinitions, gatherables] = await Promise.all([
    fetchJson(DATA_ENDPOINTS.itemdefinitions_master_crafting),
    fetchJson(DATA_ENDPOINTS.Gatherables)
  ]);

  const allItems = [...itemDefinitions, ...gatherables];

  const dynamicItems = processItemData(allItems);

  // Merge with static items to ensure we have all necessary items
  const items = { ...ITEMS, ...dynamicItems };

  // Use static recipes for now
  const recipes = RECIPES;

  return { items, recipes };
}
