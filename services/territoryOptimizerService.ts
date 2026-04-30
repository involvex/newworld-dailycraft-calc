import {
  MaterialInventory,
  OptimizerResult,
  OptimizerCraftBatch
} from "../types";

// Territory Supplies recipe definitions (match those in data/recipes.ts)
interface TerritoryRecipe {
  tier: 1 | 2 | 3 | 4;
  standingBase: number;
  ingredients: Array<{ itemId: string; quantity: number }>;
}

const TERRITORY_RECIPES: Record<number, TerritoryRecipe> = {
  1: {
    tier: 1,
    standingBase: 560,
    ingredients: [
      { itemId: "AZOTH", quantity: 200 },
      { itemId: "CORRUPTED_FRAGMENT", quantity: 20 },
      { itemId: "STONE_BRICK", quantity: 40 },
      { itemId: "TIMBER", quantity: 20 }
    ]
  },
  2: {
    tier: 2,
    standingBase: 1000,
    ingredients: [
      { itemId: "AZOTH", quantity: 200 },
      { itemId: "CORRUPTED_SHARD", quantity: 10 },
      { itemId: "LODESTONE_BRICK", quantity: 20 },
      { itemId: "LUMBER", quantity: 20 }
    ]
  },
  3: {
    tier: 3,
    standingBase: 2436,
    ingredients: [
      { itemId: "AZOTH", quantity: 200 },
      { itemId: "CORRUPTED_CRYSTAL", quantity: 3 },
      { itemId: "OBSIDIAN_VOIDSTONE", quantity: 6 },
      { itemId: "WYRDWOOD_PLANKS", quantity: 20 }
    ]
  },
  4: {
    tier: 4,
    standingBase: 5280,
    ingredients: [
      { itemId: "AZOTH", quantity: 200 },
      { itemId: "CORRUPTED_LODESTONE", quantity: 2 },
      { itemId: "RUNESTONE", quantity: 2 },
      { itemId: "IRONWOOD_PLANKS", quantity: 20 }
    ]
  }
};

/**
 * Computes maximum number of crafts possible for a given tier based on current inventory.
 * Returns the limiting material and its count.
 */
function maxCraftsForTier(
  tier: 1 | 2 | 3 | 4,
  inventory: MaterialInventory
): { max: number; limitingMaterial: string | null } {
  const recipe = TERRITORY_RECIPES[tier];
  let max = Infinity;
  let limiting: string | null = null;

  for (const ing of recipe.ingredients) {
    const have = inventory[ing.itemId as keyof MaterialInventory] ?? 0;
    const possible = Math.floor(have / ing.quantity);
    if (possible < max) {
      max = possible;
      limiting = ing.itemId;
    }
  }

  // Also ensure non-negative and finite
  if (max === Infinity) max = 0;
  return { max, limitingMaterial: limiting };
}

/**
 * Subtracts consumed materials from inventory (mutates the provided inventory copy).
 */
function consumeMaterials(
  inventory: MaterialInventory,
  tier: 1 | 2 | 3 | 4,
  count: number
): void {
  const recipe = TERRITORY_RECIPES[tier];
  for (const ing of recipe.ingredients) {
    const key = ing.itemId as keyof MaterialInventory;
    inventory[key] -= ing.quantity * count;
    // Clamp to 0 to avoid negative due to rounding errors
    if (inventory[key] < 0) inventory[key] = 0;
  }
}

/**
 * Calculates effective standing after applying multiplier.
 */
function effectiveStanding(base: number, multiplier: number): number {
  return Math.round(base * multiplier);
}

/**
 * Core greedy optimizer: maximize standing using only inventory (no purchases).
 *
 * Strategy: always craft highest-tier recipe first as it gives best standing per Azoth
 * and uses unique rare materials that cannot be used elsewhere.
 */
export function optimizeTerritoryStanding(
  inventory: MaterialInventory,
  standingGainMultiplier: number = 1.0
): OptimizerResult {
  // Work on a copy to avoid mutating original
  const remaining: MaterialInventory = { ...inventory };
  const batches: OptimizerCraftBatch[] = [];
  let totalStandingBase = 0;
  let totalStandingEffective = 0;
  let azothConsumed = 0;

  // Process tiers from highest to lowest
  for (const tier of [4, 3, 2, 1] as const) {
    const { max: possible } = maxCraftsForTier(tier, remaining);
    if (possible <= 0) continue;

    // Craft all possible of this tier
    const recipe = TERRITORY_RECIPES[tier];
    const effective = effectiveStanding(
      recipe.standingBase,
      standingGainMultiplier
    );

    const batch: OptimizerCraftBatch = {
      tier,
      count: possible,
      standingBase: recipe.standingBase,
      standingEffective: effective * possible,
      materialsUsed: {}
    };

    // Record materials used for this batch
    for (const ing of recipe.ingredients) {
      const used = ing.quantity * possible;
      batch.materialsUsed[ing.itemId] = used;
    }

    // Update remaining inventory
    consumeMaterials(remaining, tier, possible);

    // Update totals
    totalStandingBase += recipe.standingBase * possible;
    totalStandingEffective += effective * possible;
    azothConsumed += 200 * possible;

    batches.push(batch);
  }

  return {
    batches,
    totalStandingBase,
    totalStandingEffective,
    shortageGold: 0,
    materialsNeededToBuy: {},
    azothConsumed,
    azothRemaining: remaining.azoth
  };
}

/**
 * Optimizer with gold budget — batch greedy.
 * For each tier high→low:
 *   while we have Azoth and gold to cover shortages for one more craft, craft it.
 */
export function optimizeTerritoryStandingWithGold(
  inventory: MaterialInventory,
  standingGainMultiplier: number,
  goldBudget: number,
  priceData: Record<string, number>
): OptimizerResult {
  const remaining: MaterialInventory = { ...inventory };
  const batches: OptimizerCraftBatch[] = [];
  let totalStandingBase = 0;
  let totalStandingEffective = 0;
  let azothConsumed = 0;
  let remainingGold = goldBudget;
  const materialsBought: Record<string, number> = {};

  // Tracking counts per tier
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  const getPrice = (itemId: string): number => priceData[itemId] ?? 0;

  // Continue until no tier can be crafted due to Azoth or gold
  let progress = true;
  while (progress && remaining.azoth >= 200) {
    progress = false;

    // Try each tier from highest to lowest
    for (const tier of [4, 3, 2, 1] as const) {
      if (remaining.azoth < 200) break;

      const recipe = TERRITORY_RECIPES[tier];

      // Compute shortage for a single craft of this tier
      let shortageCost = 0;
      let shortageMap: Record<string, number> = {};
      let impossible = false;

      for (const ing of recipe.ingredients) {
        const key = ing.itemId as keyof MaterialInventory;
        const have = remaining[key];
        if (have < ing.quantity) {
          const deficit = ing.quantity - have;
          const price = getPrice(ing.itemId);
          if (price <= 0) {
            impossible = true; // cannot purchase missing item
            break;
          }
          shortageCost += deficit * price;
          shortageMap[ing.itemId] = deficit;
        }
      }

      if (impossible || shortageCost > remainingGold) {
        // Cannot afford this tier right now; try lower tier
        continue;
      }

      // We can afford one craft of this tier
      // Commit: buy shortages then consume
      for (const [itemId, qty] of Object.entries(shortageMap)) {
        const key = itemId as keyof MaterialInventory;
        remaining[key] += qty; // add purchased materials
        materialsBought[itemId] = (materialsBought[itemId] || 0) + qty;
      }
      remainingGold -= shortageCost;
      consumeMaterials(remaining, tier, 1);
      azothConsumed += 200;
      counts[tier]++;

      progress = true; // we made a craft, continue loop
      // After crafting one, try same tier again (since we may still afford more)
      // But also allow checking higher tiers first in next iteration
      break; // exit for-loop, restart while from highest tier again
    }
  }

  // Build batches from counts
  for (const tier of [4, 3, 2, 1] as const) {
    const count = counts[tier];
    if (count === 0) continue;
    const recipe = TERRITORY_RECIPES[tier];
    const effective = effectiveStanding(
      recipe.standingBase,
      standingGainMultiplier
    );

    const batch: OptimizerCraftBatch = {
      tier,
      count,
      standingBase: recipe.standingBase,
      standingEffective: effective * count,
      materialsUsed: {}
    };

    for (const ing of recipe.ingredients) {
      batch.materialsUsed[ing.itemId] = ing.quantity * count;
    }

    totalStandingBase += recipe.standingBase * count;
    totalStandingEffective += effective * count;
    batches.push(batch);
  }

  return {
    batches,
    totalStandingBase,
    totalStandingEffective,
    shortageGold: goldBudget - remainingGold,
    materialsNeededToBuy: materialsBought,
    azothConsumed,
    azothRemaining: remaining.azoth
  };
}

/**
 * Helper: format material name for display
 */
export function formatMaterialName(itemId: string): string {
  // Convert snake_case to Title Case
  return itemId
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
}
