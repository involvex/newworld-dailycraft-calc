import React, { useMemo } from "react";
import { Recipe, Item, AllBonuses } from "../types";
import {
  calculateCraftingDetails,
  CraftingCalculation
} from "../services/tradeskillService";

interface TradeskillCalculatorProps {
  recipes: Record<string, Recipe[]>;
  items: Record<string, Item>;
  bonuses: AllBonuses;
  priceData: Record<string, { price: number }>;
  favoriteRecipes: Set<string>;
  onToggleFavorite: (recipeId: string) => void;
}

export const TradeskillCalculator: React.FC<TradeskillCalculatorProps> = ({
  recipes,
  items,
  bonuses,
  priceData,
  favoriteRecipes,
  onToggleFavorite
}) => {
  // Get tradeskill categories (not refining)
  const tradeskillCategories = [
    "Weaponsmithing",
    "Armoring",
    "Engineering",
    "Jewelcrafting",
    "Furnishing",
    "Arcana"
  ];

  // Calculate details for all tradeskill recipes
  const tradeskillCalculations = useMemo(() => {
    const calculations: CraftingCalculation[] = [];

    Object.values(recipes).forEach(recipeArray => {
      recipeArray.forEach(recipe => {
        if (tradeskillCategories.includes(recipe.category)) {
          const item = items[recipe.itemId];
          if (item) {
            const bonusConfig =
              bonuses[recipe.category] || bonuses.Weaponsmithing;
            const calculation = calculateCraftingDetails(
              recipe,
              item,
              items,
              bonusConfig,
              priceData
            );
            calculations.push(calculation);
          }
        }
      });
    });

    return calculations;
  }, [recipes, items, bonuses, priceData]);

  // Filter to show favorites first, then others
  const sortedCalculations = useMemo(() => {
    return [...tradeskillCalculations].sort((a, b) => {
      const aFav = favoriteRecipes.has(a.recipeId);
      const bFav = favoriteRecipes.has(b.recipeId);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [tradeskillCalculations, favoriteRecipes]);

  const favoriteCount = Array.from(favoriteRecipes).filter(recipeId =>
    sortedCalculations.some(calc => calc.recipeId === recipeId)
  ).length;

  return (
    <div className="space-y-4">
      {favoriteCount > 0 && (
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-accent)"
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            ⭐ {favoriteCount} favorite recipe{favoriteCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {sortedCalculations.length === 0 ? (
        <div
          className="p-8 text-center rounded-lg"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <p style={{ color: "var(--text-secondary)" }}>
            No tradeskill recipes found. Import recipes from nw-buddy data to
            see calculations here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCalculations.slice(0, 50).map(calc => (
            <div
              key={calc.recipeId}
              className="p-4 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                background: "var(--bg-tertiary)",
                border: favoriteRecipes.has(calc.recipeId)
                  ? "2px solid var(--accent-primary)"
                  : "1px solid var(--border-color)"
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <a
                  href={calc.nwdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-lg font-bold hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {calc.itemName}
                </a>
                <button
                  onClick={() => onToggleFavorite(calc.recipeId)}
                  className="p-1 ml-2 transition-all duration-200 rounded hover:scale-125"
                  title={
                    favoriteRecipes.has(calc.recipeId)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  {favoriteRecipes.has(calc.recipeId) ? "⭐" : "☆"}
                </button>
              </div>

              {/* Gear Score */}
              <div className="mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Gear Score:{" "}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {calc.minGearScore} - {calc.maxGearScore}
                </span>
              </div>

              {/* XP */}
              <div className="mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  XP:{" "}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {calc.tradeskillXP} 🛠️ / {calc.standingXP} 🏛️
                </span>
              </div>

              {/* Cost */}
              {calc.cost > 0 && (
                <div className="mb-3">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cost:{" "}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {calc.cost.toFixed(2)} 💰
                  </span>
                </div>
              )}

              {/* Perk Chances */}
              <div className="mb-3">
                <div
                  className="mb-1 text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Perk Chances:
                </div>
                <div className="grid grid-cols-5 gap-1 text-xs text-center">
                  <div
                    className="px-1 py-1 rounded"
                    style={{ background: "var(--bg-primary)" }}
                    title="Legendary"
                  >
                    <div style={{ color: "var(--accent-primary)" }}>🌟</div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {calc.perkChances.tier5.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    className="px-1 py-1 rounded"
                    style={{ background: "var(--bg-primary)" }}
                    title="Epic"
                  >
                    <div style={{ color: "#a855f7" }}>💎</div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {calc.perkChances.tier4.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    className="px-1 py-1 rounded"
                    style={{ background: "var(--bg-primary)" }}
                    title="Rare"
                  >
                    <div style={{ color: "#3b82f6" }}>💠</div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {calc.perkChances.tier3.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    className="px-1 py-1 rounded"
                    style={{ background: "var(--bg-primary)" }}
                    title="Uncommon"
                  >
                    <div style={{ color: "#22c55e" }}>🟢</div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {calc.perkChances.tier2.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    className="px-1 py-1 rounded"
                    style={{ background: "var(--bg-primary)" }}
                    title="Common"
                  >
                    <div style={{ color: "#9ca3af" }}>⚪</div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {calc.perkChances.tier1.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div>
                <div
                  className="mb-1 text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Required:
                </div>
                <div className="space-y-1">
                  {calc.requiredMaterials.slice(0, 3).map((mat, idx) => (
                    <div
                      key={idx}
                      className="text-xs"
                      style={{ color: "var(--text-primary)" }}
                    >
                      • {mat.quantity}x {mat.itemName}
                    </div>
                  ))}
                  {calc.requiredMaterials.length > 3 && (
                    <div
                      className="text-xs italic"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      +{calc.requiredMaterials.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sortedCalculations.length > 50 && (
        <div
          className="p-4 text-center rounded-lg"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Showing first 50 recipes. Use favorites (⭐) to highlight important
            ones.
          </p>
        </div>
      )}
    </div>
  );
};
