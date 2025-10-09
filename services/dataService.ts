import { Item, Recipe } from "../types";
import { RECIPES as STATIC_RECIPES } from "../data/recipes";
import { ITEMS as STATIC_ITEMS } from "../data/items";

// Using 'main' branch for latest data - change to specific commit hash for stability
const NW_BUDDY_BASE_URL =
  "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables";

const DATA_ENDPOINTS = {
  Leatherworking: `${NW_BUDDY_BASE_URL}/javelindata_tradeskillleatherworking.json`,
  Smelting: `${NW_BUDDY_BASE_URL}/javelindata_tradeskillsmelting.json`,
  Stonecutting: `${NW_BUDDY_BASE_URL}/javelindata_tradeskillstonecutting.json`,
  Weaving: `${NW_BUDDY_BASE_URL}/javelindata_tradeskillweaving.json`,
  Woodworking: `${NW_BUDDY_BASE_URL}/javelindata_tradeskillwoodworking.json`,
  itemdefinitions_master_crafting: `${NW_BUDDY_BASE_URL}/javelindata_itemdefinitions_master_crafting.json`,
  Crafting_Refining: `${NW_BUDDY_BASE_URL}/javelindata_crafting_refining.json`,
  Gatherables: `${NW_BUDDY_BASE_URL}/javelindata_gatherables.json`
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
        name: item.Name || itemId,
        iconId: item.IconPath || itemId.toLowerCase(),
        tier: item.Tier || 1,
        type: item.ItemType || "Unknown",
        weight: item.Weight || 0.1,
        maxStack: item.MaxStack || 10000,
        types: item.ItemType || "Unknown"
      };
    }
  });
  return items;
}

function processRecipeData(
  recipeData: any[],
  category: string
): Record<string, Recipe> {
  const recipes: Record<string, Recipe> = {};
  if (!Array.isArray(recipeData)) {
    console.error("Expected recipeData to be an array, but got:", recipeData);
    return recipes;
  }

  recipeData.forEach((recipe: any) => {
    const recipeId = recipe.RecipeID;
    const itemId = recipe.ItemID;

    // Skip recipes without valid IDs
    if (!recipeId || !itemId) return;

    // Parse ingredients
    const ingredients: { itemId: string; quantity: number }[] = [];
    for (let i = 1; i <= 8; i++) {
      const ingredientId = recipe[`Ingredient${i}`];
      const ingredientQty = recipe[`Qty${i}`];
      if (ingredientId && ingredientQty > 0) {
        ingredients.push({
          itemId: ingredientId,
          quantity: ingredientQty
        });
      }
    }

    // Skip recipes with no ingredients
    if (ingredients.length === 0) return;

    recipes[itemId] = {
      recipeId: recipeId,
      itemId: itemId,
      baseYield: recipe.OutputQty || 1,
      category: category,
      isCooldown: recipe.CooldownSeconds > 0,
      baseTier: recipe.Tier || 1,
      bonusItemChance: recipe.BonusItemChance || 0,
      craftAll: true,
      ingredients: ingredients
    };
  });

  return recipes;
}

export async function loadDynamicData() {
  console.log("🔄 Loading data from nw-buddy repository...");

  try {
    // Fetch all data in parallel
    const [
      itemDefinitions,
      gatherables,
      smeltingData,
      weavingData,
      leatherworkingData,
      woodworkingData,
      stonecuttingData
    ] = await Promise.all([
      fetchJson(DATA_ENDPOINTS.itemdefinitions_master_crafting),
      fetchJson(DATA_ENDPOINTS.Gatherables),
      fetchJson(DATA_ENDPOINTS.Smelting),
      fetchJson(DATA_ENDPOINTS.Weaving),
      fetchJson(DATA_ENDPOINTS.Leatherworking),
      fetchJson(DATA_ENDPOINTS.Woodworking),
      fetchJson(DATA_ENDPOINTS.Stonecutting)
    ]);

    // Process items
    const allItems = [...itemDefinitions, ...gatherables];
    const dynamicItems = processItemData(allItems);

    // Merge with static items to ensure we have all necessary items (static items as fallback)
    const items = { ...dynamicItems, ...STATIC_ITEMS };

    // Process recipes from each category
    const smeltingRecipes = processRecipeData(smeltingData, "Smelting");
    const weavingRecipes = processRecipeData(weavingData, "Weaving");
    const leatherworkingRecipes = processRecipeData(
      leatherworkingData,
      "Tanning"
    );
    const woodworkingRecipes = processRecipeData(
      woodworkingData,
      "Woodworking"
    );
    const stonecuttingRecipes = processRecipeData(
      stonecuttingData,
      "Stonecutting"
    );

    // Merge all recipes
    const dynamicRecipes = {
      ...smeltingRecipes,
      ...weavingRecipes,
      ...leatherworkingRecipes,
      ...woodworkingRecipes,
      ...stonecuttingRecipes
    };

    // Merge with static recipes (static recipes override dynamic for quality control)
    const recipes = { ...dynamicRecipes, ...STATIC_RECIPES };

    console.log("✅ Data loaded successfully:", {
      totalItems: Object.keys(items).length,
      dynamicItems: Object.keys(dynamicItems).length,
      staticItems: Object.keys(STATIC_ITEMS).length,
      totalRecipes: Object.keys(recipes).length,
      dynamicRecipes: Object.keys(dynamicRecipes).length,
      staticRecipes: Object.keys(STATIC_RECIPES).length,
      categories: {
        Smelting: Object.keys(smeltingRecipes).length,
        Weaving: Object.keys(weavingRecipes).length,
        Tanning: Object.keys(leatherworkingRecipes).length,
        Woodworking: Object.keys(woodworkingRecipes).length,
        Stonecutting: Object.keys(stonecuttingRecipes).length
      }
    });

    return { items, recipes };
  } catch (error) {
    console.error(
      "❌ Error loading dynamic data, using static fallback:",
      error
    );
    // Fallback to static data if dynamic loading fails
    return { items: STATIC_ITEMS, recipes: STATIC_RECIPES };
  }
}
