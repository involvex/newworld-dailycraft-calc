import { Recipe, Item, BonusConfiguration } from "../types";

/**
 * Interface for crafting calculation results
 */
export interface CraftingCalculation {
  recipeId: string;
  itemName: string;
  baseGearScore: number;
  minGearScore: number;
  maxGearScore: number;
  tradeskillXP: number;
  standingXP: number;
  perkChances: {
    tier1: number; // Common
    tier2: number; // Uncommon
    tier3: number; // Rare
    tier4: number; // Epic
    tier5: number; // Legendary
  };
  cost: number;
  nwdbUrl: string;
  requiredMaterials: { itemId: string; itemName: string; quantity: number }[];
}

/**
 * Calculate gear score for a crafted item based on bonuses
 */
export function calculateGearScore(
  baseGearScore: number,
  bonusConfig: BonusConfiguration
): { min: number; max: number } {
  const { skillLevel, gearBonus, fortActive } = bonusConfig;

  // Base gear score range calculation
  // New World formula: GS can roll between min and max based on skill level
  let gsMin = baseGearScore;
  let gsMax = baseGearScore + 25; // Base range

  // Skill level bonus (every 10 levels adds +1 to min GS)
  const skillBonus = Math.floor(skillLevel / 10);
  gsMin += skillBonus;
  gsMax += skillBonus;

  // Gear bonus increases both min and max
  const gearBonusValue = Math.floor(baseGearScore * gearBonus);
  gsMin += gearBonusValue;
  gsMax += gearBonusValue;

  // Fort bonus adds +5 to both min and max
  if (fortActive) {
    gsMin += 5;
    gsMax += 5;
  }

  return { min: Math.floor(gsMin), max: Math.floor(gsMax) };
}

/**
 * Calculate perk chances based on item tier and bonuses
 */
export function calculatePerkChances(
  _itemTier: number,
  bonusConfig: BonusConfiguration
): {
  tier1: number;
  tier2: number;
  tier3: number;
  tier4: number;
  tier5: number;
} {
  const { skillLevel, gearBonus } = bonusConfig;

  // Base perk chances (simplified New World model)
  // Higher skill level and gear bonus increase legendary perk chances
  const baseTier1 = 50; // Common
  const baseTier2 = 30; // Uncommon
  const baseTier3 = 15; // Rare
  const baseTier4 = 4; // Epic
  const baseTier5 = 1; // Legendary

  // Skill bonus: +0.1% per 10 skill levels to legendary chance
  const skillMultiplier = 1 + skillLevel / 1000;

  // Gear bonus multiplier
  const gearMultiplier = 1 + gearBonus;

  // Calculate modified chances
  let tier5Chance = baseTier5 * skillMultiplier * gearMultiplier;
  let tier4Chance = baseTier4 * skillMultiplier * gearMultiplier;
  let tier3Chance = baseTier3 * skillMultiplier;
  let tier2Chance = baseTier2;
  let tier1Chance = baseTier1;

  // Normalize to 100%
  const total =
    tier1Chance + tier2Chance + tier3Chance + tier4Chance + tier5Chance;
  tier1Chance = (tier1Chance / total) * 100;
  tier2Chance = (tier2Chance / total) * 100;
  tier3Chance = (tier3Chance / total) * 100;
  tier4Chance = (tier4Chance / total) * 100;
  tier5Chance = (tier5Chance / total) * 100;

  return {
    tier1: Math.round(tier1Chance * 10) / 10,
    tier2: Math.round(tier2Chance * 10) / 10,
    tier3: Math.round(tier3Chance * 10) / 10,
    tier4: Math.round(tier4Chance * 10) / 10,
    tier5: Math.round(tier5Chance * 10) / 10
  };
}

/**
 * Calculate total cost of materials based on prices
 */
export function calculateMaterialCost(
  materials: { itemId: string; quantity: number }[],
  priceData: Record<string, { price: number }>
): number {
  let totalCost = 0;
  for (const mat of materials) {
    const priceInfo = priceData[mat.itemId];
    if (priceInfo && priceInfo.price) {
      totalCost += priceInfo.price * mat.quantity;
    }
  }
  return totalCost;
}

/**
 * Generate NWDB URL for an item
 */
export function getNWDBUrl(itemId: string): string {
  return `https://nwdb.info/db/item/${itemId}`;
}

/**
 * Calculate full crafting details for a recipe
 */
export function calculateCraftingDetails(
  recipe: Recipe,
  item: Item,
  items: Record<string, Item>,
  bonusConfig: BonusConfiguration,
  priceData: Record<string, { price: number }>
): CraftingCalculation {
  // Calculate gear score
  const baseGS = recipe.gearScore || 500;
  const { min: minGS, max: maxGS } = calculateGearScore(baseGS, bonusConfig);

  // Calculate perk chances
  const perkChances = calculatePerkChances(item.tier, bonusConfig);

  // Calculate XP
  const tradeskillXP = recipe.tradeskillXP || 0;
  const standingXP = recipe.standingXP || 0;

  // Get required materials
  const requiredMaterials = recipe.ingredients.map(ing => {
    const mat = items[ing.itemId];
    return {
      itemId: ing.itemId,
      itemName: mat?.name || ing.itemId,
      quantity: ing.quantity
    };
  });

  // Calculate cost
  const cost = calculateMaterialCost(recipe.ingredients, priceData);

  return {
    recipeId: recipe.recipeId,
    itemName: item.name,
    baseGearScore: baseGS,
    minGearScore: minGS,
    maxGearScore: maxGS,
    tradeskillXP,
    standingXP,
    perkChances,
    cost,
    nwdbUrl: getNWDBUrl(recipe.itemId),
    requiredMaterials
  };
}

/**
 * Check if a recipe can be crafted with alternative higher-tier materials
 * (e.g., "Orichalcum Ingot or higher" means Asmodeum works too)
 */
export function checkAlternativeMaterials(
  ingredientId: string,
  items: Record<string, Item>
): string[] {
  const ingredient = items[ingredientId];
  if (!ingredient) return [ingredientId];

  const alternatives: string[] = [ingredientId];

  // Material tier upgrade paths
  const UPGRADE_PATHS: Record<string, string[]> = {
    IRON_INGOT: [
      "STEEL_INGOT",
      "STARMETAL_INGOT",
      "ORICHALCUM_INGOT",
      "ASMODEUM"
    ],
    STEEL_INGOT: ["STARMETAL_INGOT", "ORICHALCUM_INGOT", "ASMODEUM"],
    STARMETAL_INGOT: ["ORICHALCUM_INGOT", "ASMODEUM"],
    ORICHALCUM_INGOT: ["ASMODEUM"],

    COARSE_LEATHER: [
      "RUGGED_LEATHER",
      "LAYERED_LEATHER",
      "RUNIC_LEATHER",
      "INFUSED_LEATHER"
    ],
    RUGGED_LEATHER: ["LAYERED_LEATHER", "RUNIC_LEATHER", "INFUSED_LEATHER"],
    LAYERED_LEATHER: ["RUNIC_LEATHER", "INFUSED_LEATHER"],
    RUNIC_LEATHER: ["INFUSED_LEATHER"],

    LUMBER: ["TIMBER", "WYRDWOOD", "IRONWOOD", "GLITTERING_EBONY"],
    TIMBER: ["WYRDWOOD", "IRONWOOD", "GLITTERING_EBONY"],
    WYRDWOOD: ["IRONWOOD", "GLITTERING_EBONY"],
    IRONWOOD: ["GLITTERING_EBONY"],

    LINEN: ["SATEEN", "SILK", "PHOENIXWEAVE"],
    SATEEN: ["SILK", "PHOENIXWEAVE"],
    SILK: ["PHOENIXWEAVE"]
  };

  const upgrades = UPGRADE_PATHS[ingredientId];
  if (upgrades) {
    alternatives.push(...upgrades);
  }

  return alternatives;
}
