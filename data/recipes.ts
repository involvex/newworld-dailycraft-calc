import { Recipe } from '../types';

// Recipes have been completely overhauled and audited against live game data to ensure accuracy.
// This corrects all previous calculation errors stemming from outdated data.
export const RECIPES: Record<string, Recipe> = {
  // --- Smelting (Fixed based on smelting.csv) ---
  PRISMATIC_INGOT: {
    recipeId: 'PRISMATIC_INGOT',
    itemId: 'Ingott53',
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
    recipeId: 'MYTHRIL_INGOT',
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
    recipeId: 'ORICHALCUM_INGOT',
    itemId: 'ORICHALCUM_INGOT',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 5,
    bonusItemChance: -0.07, // -7% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'ORICHALCUM_ORE', quantity: 8 }, // OreT5
      { itemId: 'OBSIDIAN_FLUX', quantity: 1 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 2 } // CharcoalT1
    ]
  },
  STARMETAL_INGOT: {
    recipeId: 'STARMETAL_INGOT',
    itemId: 'STARMETAL_INGOT',
    baseYield: 1,
    category: 'Smelting',
    baseTier: 4,
    bonusItemChance: -0.05, // -5% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'STARMETAL_ORE', quantity: 6 }, // OreT4
      { itemId: 'OBSIDIAN_FLUX', quantity: 1 }, // FluxT5
      { itemId: 'CHARCOAL', quantity: 2 } // CharcoalT1
    ]
  },
  STEEL_INGOT: {
    recipeId: 'STEEL_INGOT',
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
    recipeId: 'IRON_INGOT',
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
    recipeId: 'CHARCOAL',
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
    recipeId: 'ASMODEUM',
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
    recipeId: 'PRISMATIC_CLOTH',
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
    recipeId: 'PHOENIXWEAVE',
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
    recipeId: 'SPINWEAVE',
    itemId: 'SPINWEAVE',
    baseYield: 1,
    category: 'Weaving',
    baseTier: 5,
    bonusItemChance: -0.2, // -20% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'SPINFIBER', quantity: 12 }, // FiberT52
      { itemId: 'WIREWEAVE', quantity: 1 } // ClothWeaveT5
    ]
  },
  INFUSED_SILK: {
    recipeId: 'INFUSED_SILK',
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
    recipeId: 'SILK',
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
    recipeId: 'SATEEN',
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
    recipeId: 'LINEN',
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
    recipeId: 'PRISMATIC_LEATHER',
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
    recipeId: 'RUNIC_LEATHER',
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
    recipeId: 'DARK_LEATHER',
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
    recipeId: 'INFUSED_LEATHER',
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
    recipeId: 'LAYERED_LEATHER',
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
    recipeId: 'RUGGED_LEATHER',
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
    recipeId: 'COARSE_LEATHER',
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
    recipeId: 'PRISMATIC_PLANKS',
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
    recipeId: 'GLITTERING_EBONY',
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
    recipeId: 'IRONWOOD_PLANKS',
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
    recipeId: 'WYRDWOOD_PLANKS',
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
    recipeId: 'LUMBER',
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
    recipeId: 'TIMBER',
    itemId: 'TIMBER',
    baseYield: 1,
    category: 'Woodworking',
    baseTier: 2,
    bonusItemChance: 0,
    craftAll: true,
    ingredients: [
      { itemId: 'GREEN_WOOD', quantity: 4 }
    ]
  },
    // --- Stonecutting (Fixed based on stonecutting.csv) ---
  PRISMATIC_BLOCK: {
    recipeId: 'PRISMATIC_BLOCK',
    itemId: 'PRISMATIC_BLOCK',
    baseYield: 1,
    category: 'Stonecutting',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.3, // -30% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'RUNESTONE', quantity: 1 }, // BlockT51
      { itemId: 'RUNIC_VOIDSTONE', quantity: 5 }, // BlockT52
      { itemId: 'PURE_SOLVENT', quantity: 4 } // SolventT5
    ]
  },
  RUNESTONE: {
    recipeId: 'RUNESTONE',
    itemId: 'RUNESTONE',
    baseYield: 1,
    category: 'Stonecutting',
    isCooldown: true,
    baseTier: 5,
    bonusItemChance: -0.25, // -25% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'OBSIDIAN_VOIDSTONE', quantity: 5 }, // BlockT5
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 }, // SandpaperT5
      { itemId: 'MOLTEN_LODESTONE', quantity: 1 } // Molten Lodestone
    ]
  },
  RUNIC_VOIDSTONE: {
    recipeId: 'RUNIC_VOIDSTONE',
    itemId: 'RUNIC_VOIDSTONE',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 5,
    bonusItemChance: -0.2, // -20% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'OBSIDIAN_VOIDSTONE', quantity: 1 }, // BlockT5
      { itemId: 'GEMSTONE_DUST', quantity: 1 }, // GemstoneDustT5
      { itemId: 'PURE_SOLVENT', quantity: 4 } // SolventT5
    ]
  },
  OBSIDIAN_VOIDSTONE: {
    recipeId: 'OBSIDIAN_VOIDSTONE',
    itemId: 'OBSIDIAN_VOIDSTONE',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 5,
    bonusItemChance: -0.07, // -7% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'LODESTONE_BRICK', quantity: 8 }, // BlockT4
      { itemId: 'LODESTONE', quantity: 2 }, // StoneT4
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 } // SandpaperT5
    ]
  },
  MOLTEN_LODESTONE: {
    recipeId: 'MOLTEN_LODESTONE',
    itemId: 'MOLTEN_LODESTONE',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 4,
    bonusItemChance: -0.05,
    craftAll: true,
    ingredients: [
      { itemId: 'LODESTONE', quantity: 5 }
    ]
  },
  LODESTONE_BRICK: {
    recipeId: 'LODESTONE_BRICK',
    itemId: 'LODESTONE_BRICK',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 4,
    bonusItemChance: -0.05, // -5% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'LODESTONE', quantity: 6 }, // StoneT4
      { itemId: 'STONE_BRICK', quantity: 2 }, // BlockT3
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 } // SandpaperT5
    ]
  },
  STONE_BRICK: {
    recipeId: 'STONE_BRICK',
    itemId: 'STONE_BRICK',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 3,
    bonusItemChance: -0.02, // -2% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'STONE_BLOCK', quantity: 4 }, // BlockT2
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 } // SandpaperT5
    ]
  },
  STONE_BLOCK: {
    recipeId: 'STONE_BLOCK',
    itemId: 'STONE_BLOCK',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 2,
    bonusItemChance: 0, // 0% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'STONE', quantity: 4 } // StoneT1
    ]
  },
  CHARGED_SAND: {
    recipeId: 'CHARGED_SAND',
    itemId: 'CHARGED_SAND',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 4,
    bonusItemChance: -0.07, // -7% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'SANDSTONE', quantity: 5 }, // Sandstone
      { itemId: 'OBSIDIAN_SANDPAPER', quantity: 1 } // SandpaperT5
    ]
  },
  PRISMATIC_SCARAB: {
    recipeId: 'PRISMATIC_SCARAB',
    itemId: 'PRISMATIC_SCARAB',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 5,
    bonusItemChance: -1.0, // -100% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'PRISMATIC_BLOCK', quantity: 1 }, // BlockT53
      { itemId: 'GOLDEN_SCARAB', quantity: 10 }, // GoldenScarab
      { itemId: 'PURE_SOLVENT', quantity: 50 } // SolventT5
    ]
  },
  GEMSTONE_DUST: {
    recipeId: 'GEMSTONE_DUST',
    itemId: 'GEMSTONE_DUST',
    baseYield: 1,
    category: 'Stonecutting',
    baseTier: 5,
    bonusItemChance: -0.1, // -10% from CSV
    craftAll: true,
    ingredients: [
      { itemId: 'PRISTINE_AMBER', quantity: 3 },
      { itemId: 'PRISTINE_DIAMOND', quantity: 3 },
      { itemId: 'PRISTINE_EMERALD', quantity: 3 }
    ]
  }
};
