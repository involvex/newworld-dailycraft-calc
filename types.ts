export interface Item {
  id: string;
  name: string;
  iconId: string; // e.g. 'ingotprismatic' for correct icon fetching
  tier: number;
  type: string; // The primary type e.g., 'Legendary Resource'
  // New detailed properties
  weight: number;
  maxStack: number;
  types: string; // A descriptive string of all types
}

export interface Ingredient {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  itemId:string;
  ingredients: Ingredient[];
  baseYield: number; // How many items one craft makes
  category: 'Smelting' | 'Weaving' | 'Tanning' | 'Woodworking';
  isCooldown?: boolean; // Is this a daily cooldown recipe?
  // Fields for advanced yield calculation
  baseTier?: number;
  bonusItemChance?: number; // Base chance as a decimal, e.g., 0.02 for 2%
  bonusItemChanceIncrease?: string; // Comma-separated percentages for higher tier mats
  bonusItemChanceDecrease?: string; // Comma-separated percentages for lower tier mats
  craftAll?: boolean; // Can this recipe be crafted in bulk for yield bonus
  skipGrantItems?: boolean; // Does this recipe skip granting bonus items
}

export interface CraftingNodeData {
  id: string; // Unique ID for state management, e.g., 'ROOT>ASMODEUM'
  item: Item;
  quantity: number;
  totalQuantity: number;
  yieldBonus: number;
  children: CraftingNodeData[];
}

export interface RawMaterial {
  item: Item;
  quantity: number;
}

export interface BonusConfiguration {
  skillLevel: number;
  gearBonus: number; // Stored as decimal, e.g. 0.10 for 10%
  fortActive: boolean;
}

export interface AllBonuses {
  [category: string]: BonusConfiguration;
}