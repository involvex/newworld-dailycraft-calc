import { RECIPES } from "../data/recipes";

// CSV parsing utility to extract XP data from buddy CSV files
export interface CSVRecipeData {
  itemId: string;
  tradeskillXP: number;
  standingXP: number;
  category: string;
}

// Parse CSV data from nw-buddy.de exports
export function parseCSVForXPData(
  csvContent: string
): Record<string, CSVRecipeData> {
  const lines = csvContent.split("\n");
  if (lines.length < 2) return {};

  // Parse header to find column indices
  const header = lines[0].split(",").map(col => col.replace(/"/g, "").trim());
  const itemIdIndex = header.indexOf("Item ID");
  const tradeskillXPIndex = header.indexOf("Tradskill XP");
  const standingXPIndex = header.indexOf("Standing XP");
  const tradeskillIndex = header.indexOf("Tradeskill");

  if (
    itemIdIndex === -1 ||
    tradeskillXPIndex === -1 ||
    standingXPIndex === -1 ||
    tradeskillIndex === -1
  ) {
    console.warn("CSV missing required columns for XP parsing");
    return {};
  }

  const xpData: Record<string, CSVRecipeData> = {};

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(",").map(col => col.replace(/"/g, "").trim());
    if (
      columns.length <=
      Math.max(itemIdIndex, tradeskillXPIndex, standingXPIndex, tradeskillIndex)
    )
      continue;

    const itemId = columns[itemIdIndex];
    const tradeskillXPStr = columns[tradeskillXPIndex];
    const standingXPStr = columns[standingXPIndex];
    const category = columns[tradeskillIndex];

    if (!itemId || !tradeskillXPStr || !category) continue;

    const tradeskillXP = parseInt(tradeskillXPStr, 10) || 0;
    const standingXP = parseInt(standingXPStr, 10) || 0;

    // Only include items that have recipes in our system
    if (RECIPES[itemId]) {
      xpData[itemId] = {
        itemId,
        tradeskillXP,
        standingXP,
        category
      };
    }
  }

  return xpData;
}

// Hardcoded XP data extracted from CSV files for immediate use
export const XP_DATA: Record<string, CSVRecipeData> = {
  // Smelting XP Data
  PRISMATIC_INGOT: {
    itemId: "Ingott53",
    tradeskillXP: 157105,
    standingXP: 38,
    category: "Smelting"
  },
  MYTHRIL_INGOT: {
    itemId: "MYTHRIL_INGOT",
    tradeskillXP: 43299,
    standingXP: 34,
    category: "Smelting"
  },
  ORICHALCUM_INGOT: {
    itemId: "ORICHALCUM_INGOT",
    tradeskillXP: 9384,
    standingXP: 26,
    category: "Smelting"
  },
  STARMETAL_INGOT: {
    itemId: "STARMETAL_INGOT",
    tradeskillXP: 2208,
    standingXP: 18,
    category: "Smelting"
  },
  STEEL_INGOT: {
    itemId: "STEEL_INGOT",
    tradeskillXP: 552,
    standingXP: 10,
    category: "Smelting"
  },
  IRON_INGOT: {
    itemId: "IRON_INGOT",
    tradeskillXP: 138,
    standingXP: 2,
    category: "Smelting"
  },
  SILVER_INGOT: {
    itemId: "SILVER_INGOT",
    tradeskillXP: 138,
    standingXP: 2,
    category: "Smelting"
  },
  GOLD_INGOT: {
    itemId: "GOLD_INGOT",
    tradeskillXP: 552,
    standingXP: 10,
    category: "Smelting"
  },
  PLATINUM_INGOT: {
    itemId: "PLATINUM_INGOT",
    tradeskillXP: 2208,
    standingXP: 18,
    category: "Smelting"
  },
  CHARCOAL: {
    itemId: "CHARCOAL",
    tradeskillXP: 22,
    standingXP: 0,
    category: "Smelting"
  },

  // Weaving XP Data
  PRISMATIC_CLOTH: {
    itemId: "PRISMATIC_CLOTH",
    tradeskillXP: 141750,
    standingXP: 30,
    category: "Weaving"
  },
  SPINWEAVE_CLOTH: {
    itemId: "SPINWEAVE_CLOTH",
    tradeskillXP: 43705,
    standingXP: 30,
    category: "Weaving"
  },
  PHOENIXWEAVE_CLOTH: {
    itemId: "PHOENIXWEAVE_CLOTH",
    tradeskillXP: 9180,
    standingXP: 22,
    category: "Weaving"
  },
  INFUSED_SILK_CLOTH: {
    itemId: "INFUSED_SILK_CLOTH",
    tradeskillXP: 2070,
    standingXP: 14,
    category: "Weaving"
  },
  SILK_CLOTH: {
    itemId: "SILK_CLOTH",
    tradeskillXP: 460,
    standingXP: 6,
    category: "Weaving"
  },
  SATEEN_CLOTH: {
    itemId: "SATEEN_CLOTH",
    tradeskillXP: 230,
    standingXP: 0,
    category: "Weaving"
  },
  LINEN_CLOTH: {
    itemId: "LINEN_CLOTH",
    tradeskillXP: 44,
    standingXP: 0,
    category: "Weaving"
  },

  // Tanning XP Data
  RUNIC_LEATHER: {
    itemId: "RUNIC_LEATHER",
    tradeskillXP: 139050,
    standingXP: 30,
    category: "Tanning"
  },
  GLITTERING_LEATHER: {
    itemId: "GLITTERING_LEATHER",
    tradeskillXP: 42030,
    standingXP: 30,
    category: "Tanning"
  },
  INFUSED_LEATHER: {
    itemId: "INFUSED_LEATHER",
    tradeskillXP: 8970,
    standingXP: 22,
    category: "Tanning"
  },
  LAYERED_LEATHER: {
    itemId: "LAYERED_LEATHER",
    tradeskillXP: 1995,
    standingXP: 14,
    category: "Tanning"
  },
  COARSE_LEATHER: {
    itemId: "COARSE_LEATHER",
    tradeskillXP: 420,
    standingXP: 6,
    category: "Tanning"
  },
  RAWHIDE: {
    itemId: "RAWHIDE",
    tradeskillXP: 40,
    standingXP: 0,
    category: "Tanning"
  },

  // Woodworking XP Data
  GLIMMERING_LUMBER: {
    itemId: "GLIMMERING_LUMBER",
    tradeskillXP: 124200,
    standingXP: 26,
    category: "Woodworking"
  },
  WILDWOOD_LUMBER: {
    itemId: "WILDWOOD_LUMBER",
    tradeskillXP: 36720,
    standingXP: 26,
    category: "Woodworking"
  },
  BARBVINE_LUMBER: {
    itemId: "BARBVINE_LUMBER",
    tradeskillXP: 7956,
    standingXP: 18,
    category: "Woodworking"
  },
  IRONWOOD_LUMBER: {
    itemId: "IRONWOOD_LUMBER",
    tradeskillXP: 1764,
    standingXP: 10,
    category: "Woodworking"
  },
  WYRDWOOD_LUMBER: {
    itemId: "WYRDWOOD_LUMBER",
    tradeskillXP: 441,
    standingXP: 2,
    category: "Woodworking"
  },
  LUMBER: {
    itemId: "LUMBER",
    tradeskillXP: 84,
    standingXP: 0,
    category: "Woodworking"
  },

  // Stonecutting (from stonecutting.csv)
  ASMODEUM: {
    itemId: "ASMODEUM",
    tradeskillXP: 157105,
    standingXP: 38,
    category: "Stonecutting"
  },
  RUNESTONE: {
    itemId: "RUNESTONE",
    tradeskillXP: 43299,
    standingXP: 34,
    category: "Stonecutting"
  },
  LODESTONE: {
    itemId: "LODESTONE",
    tradeskillXP: 9384,
    standingXP: 26,
    category: "Stonecutting"
  },
  OBSIDIAN_SANDPAPER: {
    itemId: "OBSIDIAN_SANDPAPER",
    tradeskillXP: 2208,
    standingXP: 18,
    category: "Stonecutting"
  },
  STEEL_CUTTING_GRIT: {
    itemId: "STEEL_CUTTING_GRIT",
    tradeskillXP: 552,
    standingXP: 10,
    category: "Stonecutting"
  },
  COARSE_SANDPAPER: {
    itemId: "COARSE_SANDPAPER",
    tradeskillXP: 138,
    standingXP: 2,
    category: "Stonecutting"
  },
  SANDPAPER: {
    itemId: "SANDPAPER",
    tradeskillXP: 44,
    standingXP: 0,
    category: "Stonecutting"
  },
  STONE_BLOCK: {
    itemId: "STONE_BLOCK",
    tradeskillXP: 44,
    standingXP: 0,
    category: "Stonecutting"
  }
};
