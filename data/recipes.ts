import { Recipe } from '../types';

// Recipes have been completely overhauled and audited against live game data to ensure accuracy.
// This corrects all previous calculation errors stemming from outdated data.
export const RECIPES: Record<string, Recipe> = {
  // --- Smelting (Fixed based on smelting.csv) ---
  PRISMATIC_INGOT: {
    itemId: 'PRISMATIC_INGOT',
    baseYield: 1,
    category: 'Smelting',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.3, // -30% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'ASMODEUM', quantity: 1 }, // IngotT51
      { itemId: 'MYTHRIL_INGOT', quantity: 10 }, // IngotT52
      { itemId: 'OBSIDIAN_FLUX', quantity: 4 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 4 } // CharcoalT1
    ]
  },
  MYTHRIL_INGOT: {
    itemId: 'MYTHRIL_INGOT',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 5,
    bonusItemChance: -0.2, // -20% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'MYTHRIL_ORE', quantity: 12 }, // OreT52
      { itemId: 'ORICHALCUM_INGOT', quantity: 2 }, // IngotT5
      { itemId: 'OBSIDIAN_FLUX', quantity: 1 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 2 } // CharcoalT1
    ]
  },
  ORICHALCUM_INGOT: {
    itemId: 'ORICHALCUM_INGOT',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 5,
    bonusItemChance: -0.07, // -7% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'ORICHALCUM_ORE', quantity: 8 }, // OreT5
      { itemId: 'STARMETAL_INGOT', quantity: 2 }, // IngotT4
      { itemId: 'OBSIDIAN_FLUX', quantity: 1 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 2 } // CharcoalT1
    ]
  },
  STARMETAL_INGOT: {
    itemId: 'STARMETAL_INGOT',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 4,
    bonusItemChance: -0.05, // -5% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'STARMETAL_ORE', quantity: 6 }, // OreT4
      { itemId: 'STEEL_INGOT', quantity: 2 }, // IngotT3
      { itemId: 'OBSIDIAN_FLUX', quantity: 1 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 2 } // CharcoalT1
    ]
  },
  STEEL_INGOT: {
    itemId: 'STEEL_INGOT',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 3,
    bonusItemChance: -0.02, // -2% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'IRON_INGOT', quantity: 3 }, // IngotT2
      { itemId: 'OBSIDIAN_FLUX', quantity: 1 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 2 } // CharcoalT1
    ]
  },
  IRON_INGOT: {
    itemId: 'IRON_INGOT',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 2,
    bonusItemChance: 0, // 0% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'IRON_ORE', quantity: 4 } // OreT1
    ]
  },
  CHARCOAL: {
    itemId: 'CHARCOAL',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 1,
    bonusItemChance: 0, // 0% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'GREEN_WOOD', quantity: 2 } // Wood
    ]
  },
  ASMODEUM: {
    itemId: 'ASMODEUM',
    baseYield: 1,
    category: 'Smelting',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.25, // -25% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'ORICHALCUM_INGOT', quantity: 5 }, // IngotT5
      { itemId: 'CINNABAR', quantity: 2 }, // CinnabarT1
      { itemId: 'OBSIDIAN_FLUX', quantity: 1 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 2 } // CharcoalT1
    ]
  },

  // --- Weaving (Fixed based on weaving.csv) ---
  PRISMATIC_CLOTH: {
    itemId: 'PRISMATIC_CLOTH',
    baseYield: 1,
    category: 'Weaving',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.3, // -30% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'PHOENIXWEAVE', quantity: 1 }, // ClothT51
      { itemId: 'SPINWEAVE', quantity: 10 }, // ClothT52
      { itemId: 'WIREWEAVE', quantity: 4 } // ClothWeaveT5
    ]
  },
  PHOENIXWEAVE: {
    itemId: 'PHOENIXWEAVE',
    baseYield: 1,
    category: 'Weaving',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.25, // -25% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'INFUSED_SILK', quantity: 5 }, // ClothT5
      { itemId: 'SCALECLOTH', quantity: 2 }, // ScaleclothT1
      { itemId: 'WIREWEAVE', quantity: 1 } // ClothWeaveT5
    ]
  },
  SPINWEAVE: {
    itemId: 'SPINWEAVE',
    baseYield: 1,
    category: 'Weaving',
    baseTier: 5,
    bonusItemChance: -0.2, // -20% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'SPINFIBER', quantity: 12 }, // FiberT52
      { itemId: 'INFUSED_SILK', quantity: 2 }, // ClothT5
      { itemId: 'WIREWEAVE', quantity: 1 } // ClothWeaveT5
    ]
  },
  INFUSED_SILK: {
    itemId: 'INFUSED_SILK',
    baseYield: 1,
    category: 'Weaving',
    baseTier: 5,
    bonusItemChance: -0.07, // -7% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'WIREFIBER', quantity: 8 }, // FiberT5
      { itemId: 'SILK', quantity: 2 }, // ClothT4
      { itemId: 'WIREWEAVE', quantity: 1 } // ClothWeaveT5
    ]
  },
  SILK: {
    itemId: 'SILK',
    baseYield: 1,
    category: 'Weaving',
    baseTier: 4,
    bonusItemChance: -0.05, // -5% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'SILK_THREADS', quantity: 6 }, // FiberT4
      { itemId: 'SATEEN', quantity: 2 }, // ClothT3
      { itemId: 'WIREWEAVE', quantity: 1 } // ClothWeaveT5
    ]
  },
  SATEEN: {
    itemId: 'SATEEN',
    baseYield: 1,
    category: 'Weaving',
    baseTier: 3,
    bonusItemChance: -0.02, // -2% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'LINEN', quantity: 4 }, // ClothT2
      { itemId: 'WIREWEAVE', quantity: 1 } // ClothWeaveT5
    ]
  },
  LINEN: {
    itemId: 'LINEN',
    baseYield: 1,
    category: 'Weaving',
    baseTier: 2,
    bonusItemChance: 0, // 0% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'FIBERS', quantity: 4 } // FiberT1
    ]
  },

  // --- Tanning (Fixed based on leatherworking.csv) ---
  PRISMATIC_LEATHER: {
    itemId: 'PRISMATIC_LEATHER',
    baseYield: 1,
    category: 'Tanning',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.3, // -30% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'RUNIC_LEATHER', quantity: 1 }, // LeatherT51
      { itemId: 'DARK_LEATHER', quantity: 12 }, // LeatherT52
      { itemId: 'AGED_TANNIN', quantity: 4 } // TanninT5
    ]
  },
  RUNIC_LEATHER: {
    itemId: 'RUNIC_LEATHER',
    baseYield: 1,
    category: 'Tanning',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.25, // -25% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'INFUSED_LEATHER', quantity: 5 }, // LeatherT5
      { itemId: 'SCARHIDE', quantity: 2 }, // ScarhideT1
      { itemId: 'AGED_TANNIN', quantity: 1 } // TanninT5
    ]
  },
  DARK_LEATHER: {
    itemId: 'DARK_LEATHER',
    baseYield: 1,
    category: 'Tanning',
    baseTier: 5,
    bonusItemChance: -0.2, // -20% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'DARK_HIDE', quantity: 16 }, // RawhideT52
      { itemId: 'INFUSED_LEATHER', quantity: 2 }, // LeatherT5
      { itemId: 'AGED_TANNIN', quantity: 1 } // TanninT5
    ]
  },
  INFUSED_LEATHER: {
    itemId: 'INFUSED_LEATHER',
    baseYield: 1,
    category: 'Tanning',
    baseTier: 5,
    bonusItemChance: -0.07, // -7% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'IRON_HIDE', quantity: 8 }, // HideT5
      { itemId: 'LAYERED_LEATHER', quantity: 2 }, // LeatherT4
      { itemId: 'AGED_TANNIN', quantity: 1 } // TanninT5
    ]
  },
  LAYERED_LEATHER: {
    itemId: 'LAYERED_LEATHER',
    baseYield: 1,
    category: 'Tanning',
    baseTier: 4,
    bonusItemChance: -0.05, // -5% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'THICK_HIDE', quantity: 6 }, // RawhideT4
      { itemId: 'RUGGED_LEATHER', quantity: 2 }, // LeatherT3
      { itemId: 'AGED_TANNIN', quantity: 1 } // TanninT5
    ]
  },
  RUGGED_LEATHER: {
    itemId: 'RUGGED_LEATHER',
    baseYield: 1,
    category: 'Tanning',
    baseTier: 3,
    bonusItemChance: -0.02, // -2% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'COARSE_LEATHER', quantity: 4 }, // LeatherT2
      { itemId: 'AGED_TANNIN', quantity: 1 } // TanninT5
    ]
  },
  COARSE_LEATHER: {
    itemId: 'COARSE_LEATHER',
    baseYield: 1,
    category: 'Tanning',
    baseTier: 2,
    bonusItemChance: 0, // 0% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'RAWHIDE', quantity: 4 } // RawhideT1
    ]
  },

  // --- Woodworking (Fixed based on woodworking.csv) ---
  PRISMATIC_PLANKS: {
    itemId: 'PRISMATIC_PLANKS',
    baseYield: 1,
    category: 'Woodworking',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.3, // -30% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'GLITTERING_EBONY', quantity: 1 }, // TimberT51
      { itemId: 'IRONWOOD_PLANKS', quantity: 10 }, // TimberT52 - corrected quantity
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 4 } // SandpaperT5
    ]
  },
  GLITTERING_EBONY: {
    itemId: 'GLITTERING_EBONY',
    baseYield: 1,
    category: 'Woodworking',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.25,
    craftAll: true,
    ingredients: [
      { itemId: 'IRONWOOD_PLANKS', quantity: 5 },
      { itemId: 'WILDWOOD', quantity: 2 },
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 }
    ]
  },
  IRONWOOD_PLANKS: {
    itemId: 'IRONWOOD_PLANKS',
    baseYield: 1,
    category: 'Woodworking',
    baseTier: 5,
    bonusItemChance: -0.07,
    craftAll: true,
    ingredients: [
      { itemId: 'IRONWOOD', quantity: 8 },
      { itemId: 'WYRDWOOD_PLANKS', quantity: 2 },
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 }
    ]
  },
  WYRDWOOD_PLANKS: {
    itemId: 'WYRDWOOD_PLANKS',
    baseYield: 1,
    category: 'Woodworking',
    baseTier: 4,
    bonusItemChance: -0.05,
    craftAll: true,
    ingredients: [
      { itemId: 'AGED_WOOD', quantity: 6 },
      { itemId: 'LUMBER', quantity: 2 },
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 }
    ]
  },
  LUMBER: {
    itemId: 'LUMBER',
    baseYield: 1,
    category: 'Woodworking',
    baseTier: 3,
    bonusItemChance: -0.02,
    craftAll: true,
    ingredients: [
      { itemId: 'TIMBER', quantity: 4 },
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 }
    ]
  },
  TIMBER: {
    itemId: 'TIMBER',
    baseYield: 1,
    category: 'Woodworking',
    baseTier: 2,
    bonusItemChance: 0,
    craftAll: true,
    ingredients: [
      { itemId: 'GREEN_WOOD', quantity: 4 }
    ]
  }
};