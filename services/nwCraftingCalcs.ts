import { Recipe, BonusConfiguration } from '../types';

const REFINING_SKILLS = ['Smelting', 'Weaving', 'Tanning', 'Woodworking'];

// In NW, level 200/250 in a refining skill gives a ~2% chance for extra items.
const getBonusFromSkill = (skillLevel: number): number => {
  return skillLevel >= 200 ? 0.02 : 0;
};

/**
 * Main calculation function, adapted from getCraftingYieldBonusInfo.
 * It combines all sources of crafting yield bonus for a given recipe.
 * @param recipe The recipe being crafted.
 * @param bonuses The user's current bonus configuration (skill, gear, fort).
 * @returns The total yield bonus as a decimal (e.g., 0.25 for 25%). This is the EXTRA amount.
 */
export const getCraftingYieldBonus = (recipe: Recipe, bonuses: BonusConfiguration): number => {
  if (!REFINING_SKILLS.includes(recipe.category)) {
      return 0;
  }

  // Base chance inherent to the recipe (e.g., daily cooldowns)
  const chanceBase = recipe.bonusItemChance || 0;

  // Prismatic and Cooldown recipes are special cases and are not affected by skill/gear/fort bonuses.
  if (recipe.isCooldown || recipe.itemId.startsWith('PRISMATIC_')) {
      return chanceBase;
  }
  
  // Bonus for having a high skill level
  const chanceFromSkill = getBonusFromSkill(bonuses.skillLevel);
  
  // Bonus from crafting gear set
  const chanceFromGear = bonuses.gearBonus; // This is stored as a decimal
  
  // Bonus from controlling a fort that buffs this tradeskill
  const chanceFromFort = bonuses.fortActive ? 0.10 : 0;
  
  const total = chanceBase + chanceFromSkill + chanceFromGear + chanceFromFort;
  
  return Math.max(0, total);
};