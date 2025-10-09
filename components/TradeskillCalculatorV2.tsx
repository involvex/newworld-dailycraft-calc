import React, { useState, useMemo, useCallback } from "react";
import { Recipe, Item, AllBonuses } from "../types";
import {
  calculateCraftingDetails,
  CraftingCalculation,
  calculateXPToLevel,
  findCheapestAlternative,
  calculateProfit,
  recommendRecipes
} from "../services/tradeskillService";

interface TradeskillCalculatorV2Props {
  recipes: Record<string, Recipe[]>;
  items: Record<string, Item>;
  bonuses: AllBonuses;
  priceData: Record<string, { price: number }>;
  favoriteRecipes: Set<string>;
  onToggleFavorite: (recipeId: string) => void;
  inventory: Record<string, number>;
}

type ViewMode =
  | "recipes"
  | "bulk"
  | "compare"
  | "leveling"
  | "goals"
  | "shopping"
  | "profit"
  | "recommendations";

interface CraftingGoal {
  id: string;
  category: string;
  targetLevel: number;
  currentLevel: number;
  notes: string;
}

export const TradeskillCalculatorV2: React.FC<TradeskillCalculatorV2Props> = ({
  recipes,
  items,
  bonuses,
  priceData,
  favoriteRecipes,
  onToggleFavorite,
  inventory
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("recipes");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [craftingGoals, setCraftingGoals] = useState<CraftingGoal[]>(() => {
    const saved = localStorage.getItem("craftingGoals");
    return saved ? JSON.parse(saved) : [];
  });
  const [showOptimizedCosts, setShowOptimizedCosts] = useState(false);

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

  // Filtered and searched calculations
  const filteredCalculations = useMemo(() => {
    let filtered = tradeskillCalculations;

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(calc => {
        const recipe = Object.values(recipes)
          .flat()
          .find(r => r.recipeId === calc.recipeId);
        return recipe?.category === categoryFilter;
      });
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(calc =>
        calc.itemName.toLowerCase().includes(term)
      );
    }

    // Sort: favorites first, then by name
    return filtered.sort((a, b) => {
      const aFav = favoriteRecipes.has(a.recipeId);
      const bFav = favoriteRecipes.has(b.recipeId);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [
    tradeskillCalculations,
    categoryFilter,
    searchTerm,
    favoriteRecipes,
    recipes
  ]);

  // Recommendations
  const recommendations = useMemo(() => {
    return recommendRecipes(
      filteredCalculations,
      bonuses,
      inventory,
      items,
      recipes
    );
  }, [filteredCalculations, bonuses, inventory, items, recipes]);

  // Shopping list from favorites
  const shoppingList = useMemo(() => {
    const list: Record<
      string,
      { itemName: string; quantity: number; cost: number }
    > = {};

    filteredCalculations.forEach(calc => {
      if (favoriteRecipes.has(calc.recipeId)) {
        calc.requiredMaterials.forEach(mat => {
          const existing = list[mat.itemId] || {
            itemName: mat.itemName,
            quantity: 0,
            cost: 0
          };
          const price = priceData[mat.itemId]?.price || 0;
          list[mat.itemId] = {
            itemName: mat.itemName,
            quantity: existing.quantity + mat.quantity,
            cost: existing.cost + mat.quantity * price
          };
        });
      }
    });

    return Object.entries(list).map(([itemId, data]) => ({
      itemId,
      ...data
    }));
  }, [filteredCalculations, favoriteRecipes, priceData]);

  // Save goals to localStorage
  const saveGoals = useCallback((goals: CraftingGoal[]) => {
    setCraftingGoals(goals);
    localStorage.setItem("craftingGoals", JSON.stringify(goals));
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      "Item Name",
      "Category",
      "Min GS",
      "Max GS",
      "Tradeskill XP",
      "Standing XP",
      "Cost",
      "Profit",
      "Materials"
    ];

    const rows = filteredCalculations.map(calc => {
      const recipe = Object.values(recipes)
        .flat()
        .find(r => r.recipeId === calc.recipeId);
      const profit = calculateProfit(calc, priceData, recipe?.itemId || "");
      const materials = calc.requiredMaterials
        .map(m => `${m.quantity}x ${m.itemName}`)
        .join("; ");

      return [
        calc.itemName,
        recipe?.category || "",
        calc.minGearScore,
        calc.maxGearScore,
        calc.tradeskillXP,
        calc.standingXP,
        calc.cost.toFixed(2),
        profit.toFixed(2),
        materials
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradeskill-calculations-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredCalculations, recipes, priceData]);

  // Toggle comparison selection
  const toggleCompare = useCallback((recipeId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId);
      } else if (prev.length < 3) {
        return [...prev, recipeId];
      }
      return prev;
    });
  }, []);

  const favoriteCount = Array.from(favoriteRecipes).filter(recipeId =>
    filteredCalculations.some(calc => calc.recipeId === recipeId)
  ).length;

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { mode: "recipes", label: "📜 Recipes", icon: "📜" },
          { mode: "bulk", label: "🔢 Bulk Calculator", icon: "🔢" },
          { mode: "compare", label: "⚖️ Compare", icon: "⚖️" },
          { mode: "leveling", label: "📈 Leveling Guide", icon: "📈" },
          { mode: "goals", label: "🎯 Goals", icon: "🎯" },
          { mode: "shopping", label: "🛒 Shopping List", icon: "🛒" },
          { mode: "profit", label: "💰 Profit", icon: "💰" },
          { mode: "recommendations", label: "🌟 Recommended", icon: "🌟" }
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as ViewMode)}
            className="px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-lg hover:scale-105"
            style={{
              background:
                viewMode === mode
                  ? "var(--accent-primary)"
                  : "var(--bg-tertiary)",
              color:
                viewMode === mode ? "var(--bg-primary)" : "var(--text-primary)",
              border:
                viewMode === mode
                  ? "2px solid var(--border-accent)"
                  : "1px solid var(--border-color)"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      {(viewMode === "recipes" ||
        viewMode === "bulk" ||
        viewMode === "compare" ||
        viewMode === "profit") && (
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Search recipes by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 text-sm transition-all rounded-lg"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)"
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute text-sm transition-all duration-200 transform -translate-y-1/2 right-3 top-1/2 hover:scale-125"
                style={{ color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 text-sm transition-all rounded-lg"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)"
            }}
          >
            <option value="all">All Categories</option>
            {tradeskillCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {viewMode === "recipes" && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowOptimizedCosts(!showOptimizedCosts)}
                className="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:scale-105"
                style={{
                  background: showOptimizedCosts
                    ? "var(--accent-primary)"
                    : "var(--bg-tertiary)",
                  color: showOptimizedCosts
                    ? "var(--bg-primary)"
                    : "var(--text-primary)",
                  border: "1px solid var(--border-color)"
                }}
              >
                {showOptimizedCosts ? "💡 Optimized" : "💡 Optimize"}
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:scale-105"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)"
                }}
              >
                📥 Export CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      {viewMode === "recipes" && (
        <div className="flex flex-wrap gap-4">
          {favoriteCount > 0 && (
            <div
              className="px-4 py-2 rounded-lg"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-accent)"
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                ⭐ {favoriteCount} favorite{favoriteCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div
            className="px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)"
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>
              📜 {filteredCalculations.length} recipe
              {filteredCalculations.length !== 1 ? "s" : ""} found
            </span>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === "recipes" && (
        <RecipesView
          calculations={filteredCalculations}
          favoriteRecipes={favoriteRecipes}
          onToggleFavorite={onToggleFavorite}
          showOptimized={showOptimizedCosts}
          priceData={priceData}
          items={items}
          recipes={recipes}
        />
      )}

      {viewMode === "bulk" && (
        <BulkCalculatorView
          calculations={filteredCalculations}
          bulkQuantity={bulkQuantity}
          setBulkQuantity={setBulkQuantity}
          priceData={priceData}
        />
      )}

      {viewMode === "compare" && (
        <CompareView
          calculations={filteredCalculations}
          selectedForCompare={selectedForCompare}
          toggleCompare={toggleCompare}
          recipes={recipes}
        />
      )}

      {viewMode === "leveling" && (
        <LevelingGuideView
          bonuses={bonuses}
          calculations={filteredCalculations}
        />
      )}

      {viewMode === "goals" && (
        <GoalsView
          goals={craftingGoals}
          saveGoals={saveGoals}
          bonuses={bonuses}
          categories={tradeskillCategories}
        />
      )}

      {viewMode === "shopping" && (
        <ShoppingListView shoppingList={shoppingList} inventory={inventory} />
      )}

      {viewMode === "profit" && (
        <ProfitView
          calculations={filteredCalculations}
          priceData={priceData}
          recipes={recipes}
        />
      )}

      {viewMode === "recommendations" && (
        <RecommendationsView
          recommendations={recommendations}
          favoriteRecipes={favoriteRecipes}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
};

// Sub-components for each view mode
const RecipesView: React.FC<{
  calculations: CraftingCalculation[];
  favoriteRecipes: Set<string>;
  onToggleFavorite: (recipeId: string) => void;
  showOptimized: boolean;
  priceData: Record<string, { price: number }>;
  items: Record<string, Item>;
  recipes: Record<string, Recipe[]>;
}> = ({
  calculations,
  favoriteRecipes,
  onToggleFavorite,
  showOptimized,
  priceData,
  items,
  recipes
}) => {
  if (calculations.length === 0) {
    return (
      <div
        className="p-8 text-center rounded-lg"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>
          No recipes match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {calculations.slice(0, 100).map(calc => {
        const recipe = Object.values(recipes)
          .flat()
          .find(r => r.recipeId === calc.recipeId);
        const optimizedCost = showOptimized
          ? findCheapestAlternative(calc, priceData, items)
          : null;

        return (
          <div
            key={calc.recipeId}
            className="p-4 transition-all duration-200 rounded-lg hover:scale-105"
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

            {/* Category Badge */}
            {recipe && (
              <div className="mb-2">
                <span
                  className="px-2 py-1 text-xs font-medium rounded"
                  style={{
                    background: "var(--bg-primary)",
                    color: "var(--accent-primary)",
                    border: "1px solid var(--border-accent)"
                  }}
                >
                  {recipe.category}
                </span>
              </div>
            )}

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
                {showOptimized && optimizedCost && optimizedCost < calc.cost ? (
                  <>
                    <span
                      className="text-sm line-through"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {calc.cost.toFixed(2)}
                    </span>
                    <span
                      className="ml-2 text-sm font-bold"
                      style={{ color: "#22c55e" }}
                    >
                      {optimizedCost.toFixed(2)} 💰 (
                      {((1 - optimizedCost / calc.cost) * 100).toFixed(0)}%
                      saved!)
                    </span>
                  </>
                ) : (
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {calc.cost.toFixed(2)} 💰
                  </span>
                )}
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
        );
      })}
    </div>
  );
};

const BulkCalculatorView: React.FC<{
  calculations: CraftingCalculation[];
  bulkQuantity: number;
  setBulkQuantity: (qty: number) => void;
  priceData: Record<string, { price: number }>;
}> = ({ calculations, bulkQuantity, setBulkQuantity, priceData }) => {
  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-lg"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)"
        }}
      >
        <label
          className="block mb-2 text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Quantity to Craft:
        </label>
        <input
          type="number"
          min="1"
          max="10000"
          value={bulkQuantity}
          onChange={e =>
            setBulkQuantity(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="w-full px-4 py-2 text-lg font-bold text-center transition-all rounded-lg"
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            border: "2px solid var(--border-accent)"
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {calculations.slice(0, 50).map(calc => {
          const totalCost = calc.cost * bulkQuantity;
          const totalXP = calc.tradeskillXP * bulkQuantity;
          const totalStanding = calc.standingXP * bulkQuantity;

          const consolidatedMaterials: Record<
            string,
            { name: string; quantity: number }
          > = {};
          calc.requiredMaterials.forEach(mat => {
            if (consolidatedMaterials[mat.itemId]) {
              consolidatedMaterials[mat.itemId].quantity +=
                mat.quantity * bulkQuantity;
            } else {
              consolidatedMaterials[mat.itemId] = {
                name: mat.itemName,
                quantity: mat.quantity * bulkQuantity
              };
            }
          });

          return (
            <div
              key={calc.recipeId}
              className="p-4 rounded-lg"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-color)"
              }}
            >
              <h4
                className="mb-3 text-lg font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {calc.itemName} (x{bulkQuantity})
              </h4>

              <div className="mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Total Cost:{" "}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {totalCost.toFixed(2)} 💰
                </span>
              </div>

              <div className="mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Total XP:{" "}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {totalXP} 🛠️ / {totalStanding} 🏛️
                </span>
              </div>

              <div>
                <div
                  className="mb-1 text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Materials Needed:
                </div>
                <div className="space-y-1">
                  {Object.values(consolidatedMaterials).map((mat, idx) => (
                    <div
                      key={idx}
                      className="text-xs"
                      style={{ color: "var(--text-primary)" }}
                    >
                      • {mat.quantity}x {mat.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CompareView: React.FC<{
  calculations: CraftingCalculation[];
  selectedForCompare: string[];
  toggleCompare: (recipeId: string) => void;
  recipes: Record<string, Recipe[]>;
}> = ({ calculations, selectedForCompare, toggleCompare, recipes }) => {
  const selectedCalcs = calculations.filter(calc =>
    selectedForCompare.includes(calc.recipeId)
  );

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-lg"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)"
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Select up to 3 recipes to compare side-by-side. Click on recipes below
          to add them to comparison.
        </p>
      </div>

      {selectedCalcs.length === 0 ? (
        <div
          className="p-8 text-center rounded-lg"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <p style={{ color: "var(--text-secondary)" }}>
            Select recipes from the list below to compare
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {selectedCalcs.map(calc => {
            const recipe = Object.values(recipes)
              .flat()
              .find(r => r.recipeId === calc.recipeId);

            return (
              <div
                key={calc.recipeId}
                className="p-4 rounded-lg"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "2px solid var(--accent-primary)"
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4
                    className="text-lg font-bold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {calc.itemName}
                  </h4>
                  <button
                    onClick={() => toggleCompare(calc.recipeId)}
                    className="text-sm font-bold transition-all duration-200 hover:scale-125"
                  >
                    ✕
                  </button>
                </div>

                {recipe && (
                  <div className="mb-2">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded"
                      style={{
                        background: "var(--bg-primary)",
                        color: "var(--accent-primary)"
                      }}
                    >
                      {recipe.category}
                    </span>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>GS: </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {calc.minGearScore} - {calc.maxGearScore}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>XP: </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {calc.tradeskillXP} 🛠️
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>
                      Cost:{" "}
                    </span>
                    <span style={{ color: "var(--accent-primary)" }}>
                      {calc.cost.toFixed(2)} 💰
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>
                      Cost/XP:{" "}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {(calc.cost / (calc.tradeskillXP || 1)).toFixed(2)} 💰/XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <h4
          className="mb-3 text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Available Recipes (Click to Add):
        </h4>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {calculations.slice(0, 50).map(calc => (
            <button
              key={calc.recipeId}
              onClick={() => toggleCompare(calc.recipeId)}
              disabled={
                selectedForCompare.length >= 3 &&
                !selectedForCompare.includes(calc.recipeId)
              }
              className="p-2 text-sm font-medium text-left transition-all duration-200 rounded-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedForCompare.includes(calc.recipeId)
                  ? "var(--accent-primary)"
                  : "var(--bg-tertiary)",
                color: selectedForCompare.includes(calc.recipeId)
                  ? "var(--bg-primary)"
                  : "var(--text-primary)",
                border: "1px solid var(--border-color)"
              }}
            >
              {calc.itemName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const LevelingGuideView: React.FC<{
  bonuses: AllBonuses;
  calculations: CraftingCalculation[];
}> = ({ bonuses, calculations }) => {
  const [selectedCategory, setSelectedCategory] = useState("Weaponsmithing");
  const [targetLevel, setTargetLevel] = useState(250);

  const currentLevel = bonuses[selectedCategory]?.skillLevel || 0;
  const xpNeeded = calculateXPToLevel(currentLevel, targetLevel);

  // Find most efficient recipes for leveling
  const efficientRecipes = calculations
    .filter(calc => {
      const recipe = Object.values(calc).find(
        (v: any) => v?.category === selectedCategory
      );
      return recipe;
    })
    .sort((a, b) => {
      const costPerXPA = a.cost / (a.tradeskillXP || 1);
      const costPerXPB = b.cost / (b.tradeskillXP || 1);
      return costPerXPA - costPerXPB;
    })
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-lg"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)"
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)"
              }}
            >
              {Object.keys(bonuses).map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Current Level:
            </label>
            <input
              type="number"
              value={currentLevel}
              disabled
              className="w-full px-3 py-2 font-bold text-center rounded-lg"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)"
              }}
            />
          </div>

          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Target Level:
            </label>
            <input
              type="number"
              min={currentLevel}
              max="250"
              value={targetLevel}
              onChange={e =>
                setTargetLevel(Math.min(250, parseInt(e.target.value) || 0))
              }
              className="w-full px-3 py-2 font-bold text-center rounded-lg"
              style={{
                background: "var(--bg-primary)",
                color: "var(--accent-primary)",
                border: "2px solid var(--border-accent)"
              }}
            />
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-lg"
        style={{
          background: "var(--bg-tertiary)",
          border: "2px solid var(--border-accent)"
        }}
      >
        <h3
          className="mb-3 text-xl font-bold"
          style={{ color: "var(--accent-primary)" }}
        >
          XP Required: {xpNeeded.toLocaleString()} XP
        </h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          From level {currentLevel} to {targetLevel}
        </p>
      </div>

      <div>
        <h4
          className="mb-3 text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Most Efficient Recipes (Best Cost/XP):
        </h4>
        <div className="space-y-2">
          {efficientRecipes.map((calc, idx) => {
            const costPerXP = calc.cost / (calc.tradeskillXP || 1);
            const craftsNeeded = Math.ceil(xpNeeded / calc.tradeskillXP);
            const totalCost = calc.cost * craftsNeeded;

            return (
              <div
                key={calc.recipeId}
                className="p-4 rounded-lg"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)"
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5
                      className="font-bold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      #{idx + 1} {calc.itemName}
                    </h5>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {calc.tradeskillXP} XP per craft • {costPerXP.toFixed(2)}{" "}
                      💰/XP
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {craftsNeeded.toLocaleString()} crafts
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {totalCost.toFixed(2)} 💰 total
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const GoalsView: React.FC<{
  goals: CraftingGoal[];
  saveGoals: (goals: CraftingGoal[]) => void;
  bonuses: AllBonuses;
  categories: string[];
}> = ({ goals, saveGoals, bonuses, categories }) => {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    category: "Weaponsmithing",
    targetLevel: 250,
    notes: ""
  });

  const addGoal = () => {
    const goal: CraftingGoal = {
      id: Date.now().toString(),
      category: newGoal.category,
      targetLevel: newGoal.targetLevel,
      currentLevel: bonuses[newGoal.category]?.skillLevel || 0,
      notes: newGoal.notes
    };
    saveGoals([...goals, goal]);
    setShowAddGoal(false);
    setNewGoal({ category: "Weaponsmithing", targetLevel: 250, notes: "" });
  };

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAddGoal(!showAddGoal)}
        className="px-4 py-2 font-medium transition-all duration-200 rounded-lg hover:scale-105"
        style={{
          background: "var(--accent-primary)",
          color: "var(--bg-primary)"
        }}
      >
        {showAddGoal ? "Cancel" : "+ Add New Goal"}
      </button>

      {showAddGoal && (
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--bg-tertiary)",
            border: "2px solid var(--border-accent)"
          }}
        >
          <h4
            className="mb-3 text-lg font-bold"
            style={{ color: "var(--accent-primary)" }}
          >
            Create New Goal
          </h4>
          <div className="space-y-3">
            <div>
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Category:
              </label>
              <select
                value={newGoal.category}
                onChange={e =>
                  setNewGoal({ ...newGoal, category: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)"
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Target Level:
              </label>
              <input
                type="number"
                min="1"
                max="250"
                value={newGoal.targetLevel}
                onChange={e =>
                  setNewGoal({
                    ...newGoal,
                    targetLevel: parseInt(e.target.value) || 1
                  })
                }
                className="w-full px-3 py-2 rounded-lg"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)"
                }}
              />
            </div>
            <div>
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Notes (optional):
              </label>
              <textarea
                value={newGoal.notes}
                onChange={e =>
                  setNewGoal({ ...newGoal, notes: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 rounded-lg"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)"
                }}
                placeholder="e.g., Need for crafting legendary weapons"
              />
            </div>
            <button
              onClick={addGoal}
              className="w-full py-2 font-medium transition-all duration-200 rounded-lg hover:scale-105"
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-primary)"
              }}
            >
              Create Goal
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div
          className="p-8 text-center rounded-lg"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <p style={{ color: "var(--text-secondary)" }}>
            No crafting goals yet. Click &quot;Add New Goal&quot; to get
            started!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const currentLevel = bonuses[goal.category]?.skillLevel || 0;
            const progress = Math.min(
              100,
              (currentLevel / goal.targetLevel) * 100
            );
            const xpNeeded = calculateXPToLevel(currentLevel, goal.targetLevel);

            return (
              <div
                key={goal.id}
                className="p-4 rounded-lg"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-color)"
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5
                      className="text-lg font-bold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {goal.category} → Level {goal.targetLevel}
                    </h5>
                    {goal.notes && (
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {goal.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-sm font-bold transition-all duration-200 hover:scale-125"
                    style={{ color: "var(--danger)" }}
                  >
                    🗑️
                  </button>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between mb-1 text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Level {currentLevel} / {goal.targetLevel}
                    </span>
                    <span style={{ color: "var(--accent-primary)" }}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    className="w-full h-3 overflow-hidden rounded-full"
                    style={{ background: "var(--bg-primary)" }}
                  >
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${progress}%`,
                        background: "var(--accent-primary)"
                      }}
                    />
                  </div>
                </div>

                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  XP Needed: {xpNeeded.toLocaleString()} XP
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ShoppingListView: React.FC<{
  shoppingList: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    cost: number;
  }>;
  inventory: Record<string, number>;
}> = ({ shoppingList, inventory }) => {
  const totalCost = shoppingList.reduce((sum, item) => sum + item.cost, 0);

  const exportShoppingList = () => {
    const csv = [
      ["Material", "Needed", "In Inventory", "To Buy", "Cost"],
      ...shoppingList.map(item => {
        const inInventory = inventory[item.itemId] || 0;
        const toBuy = Math.max(0, item.quantity - inInventory);
        return [
          item.itemName,
          item.quantity,
          inInventory,
          toBuy,
          item.cost.toFixed(2)
        ];
      })
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopping-list-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (shoppingList.length === 0) {
    return (
      <div
        className="p-8 text-center rounded-lg"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>
          No favorite recipes selected. Mark recipes as favorites (⭐) to
          generate a shopping list!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--bg-tertiary)",
            border: "2px solid var(--border-accent)"
          }}
        >
          <h4
            className="text-xl font-bold"
            style={{ color: "var(--accent-primary)" }}
          >
            Total Cost: {totalCost.toFixed(2)} 💰
          </h4>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            For all favorite recipes
          </p>
        </div>
        <button
          onClick={exportShoppingList}
          className="px-4 py-2 font-medium transition-all duration-200 rounded-lg hover:scale-105"
          style={{
            background: "var(--accent-primary)",
            color: "var(--bg-primary)"
          }}
        >
          📥 Export to CSV
        </button>
      </div>

      <div
        className="overflow-hidden rounded-lg"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--bg-tertiary)" }}>
              <th
                className="px-4 py-2 text-left"
                style={{ color: "var(--text-primary)" }}
              >
                Material
              </th>
              <th
                className="px-4 py-2 text-center"
                style={{ color: "var(--text-primary)" }}
              >
                Needed
              </th>
              <th
                className="px-4 py-2 text-center"
                style={{ color: "var(--text-primary)" }}
              >
                In Inventory
              </th>
              <th
                className="px-4 py-2 text-center"
                style={{ color: "var(--text-primary)" }}
              >
                To Buy
              </th>
              <th
                className="px-4 py-2 text-right"
                style={{ color: "var(--text-primary)" }}
              >
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {shoppingList.map((item, idx) => {
              const inInventory = inventory[item.itemId] || 0;
              const toBuy = Math.max(0, item.quantity - inInventory);
              const needMore = toBuy > 0;

              return (
                <tr
                  key={item.itemId}
                  style={{
                    background:
                      idx % 2 === 0
                        ? "var(--bg-primary)"
                        : "var(--bg-secondary)"
                  }}
                >
                  <td
                    className="px-4 py-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.itemName}
                  </td>
                  <td
                    className="px-4 py-2 text-center font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    className="px-4 py-2 text-center"
                    style={{
                      color: needMore ? "var(--danger)" : "#22c55e"
                    }}
                  >
                    {inInventory}
                  </td>
                  <td
                    className="px-4 py-2 text-center font-bold"
                    style={{
                      color: needMore ? "var(--accent-primary)" : "#22c55e"
                    }}
                  >
                    {toBuy} {needMore ? "❗" : "✓"}
                  </td>
                  <td
                    className="px-4 py-2 text-right font-medium"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {item.cost.toFixed(2)} 💰
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProfitView: React.FC<{
  calculations: CraftingCalculation[];
  priceData: Record<string, { price: number }>;
  recipes: Record<string, Recipe[]>;
}> = ({ calculations, priceData, recipes }) => {
  const profitCalculations = useMemo(() => {
    return calculations
      .map(calc => {
        const recipe = Object.values(recipes)
          .flat()
          .find(r => r.recipeId === calc.recipeId);
        const profit = calculateProfit(calc, priceData, recipe?.itemId || "");
        const profitMargin =
          calc.cost > 0 ? ((profit - calc.cost) / calc.cost) * 100 : 0;

        return {
          ...calc,
          profit,
          profitMargin,
          sellPrice: profit + calc.cost
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [calculations, priceData, recipes]);

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-lg"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)"
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Sorted by highest profit margin. Green = profitable, Red = loss.
        </p>
      </div>

      <div className="space-y-2">
        {profitCalculations.slice(0, 50).map((calc, idx) => {
          const isProfitable = calc.profit > calc.cost;

          return (
            <div
              key={calc.recipeId}
              className="p-4 rounded-lg"
              style={{
                background: "var(--bg-tertiary)",
                border: `2px solid ${isProfitable ? "#22c55e" : "var(--danger)"}`
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5
                    className="text-lg font-bold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    #{idx + 1} {calc.itemName}
                  </h5>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cost: {calc.cost.toFixed(2)} 💰 → Sell:{" "}
                    {calc.sellPrice.toFixed(2)} 💰
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xl font-bold"
                    style={{
                      color: isProfitable ? "#22c55e" : "var(--danger)"
                    }}
                  >
                    {calc.profit > calc.cost ? "+" : ""}
                    {(calc.profit - calc.cost).toFixed(2)} 💰
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: isProfitable ? "#22c55e" : "var(--danger)"
                    }}
                  >
                    {calc.profitMargin > 0 ? "+" : ""}
                    {calc.profitMargin.toFixed(1)}% margin
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecommendationsView: React.FC<{
  recommendations: CraftingCalculation[];
  favoriteRecipes: Set<string>;
  onToggleFavorite: (recipeId: string) => void;
}> = ({ recommendations, favoriteRecipes, onToggleFavorite }) => {
  if (recommendations.length === 0) {
    return (
      <div
        className="p-8 text-center rounded-lg"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>
          No recommendations available based on your current skill levels and
          inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-lg"
        style={{
          background: "var(--bg-tertiary)",
          border: "2px solid var(--border-accent)"
        }}
      >
        <h4
          className="mb-2 text-lg font-bold"
          style={{ color: "var(--accent-primary)" }}
        >
          🌟 Recommended Recipes for You
        </h4>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Based on your skill levels, available inventory, and cost efficiency
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((calc, idx) => (
          <div
            key={calc.recipeId}
            className="p-4 transition-all duration-200 rounded-lg hover:scale-105"
            style={{
              background: "var(--bg-tertiary)",
              border: "2px solid var(--border-accent)"
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span
                  className="px-2 py-1 text-xs font-bold rounded"
                  style={{
                    background: "var(--accent-primary)",
                    color: "var(--bg-primary)"
                  }}
                >
                  #{idx + 1} RECOMMENDED
                </span>
                <h5
                  className="mt-2 text-lg font-bold"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {calc.itemName}
                </h5>
              </div>
              <button
                onClick={() => onToggleFavorite(calc.recipeId)}
                className="p-1 transition-all duration-200 rounded hover:scale-125"
              >
                {favoriteRecipes.has(calc.recipeId) ? "⭐" : "☆"}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span style={{ color: "var(--text-secondary)" }}>
                  Gear Score:{" "}
                </span>
                <span style={{ color: "var(--text-primary)" }}>
                  {calc.minGearScore} - {calc.maxGearScore}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>XP: </span>
                <span style={{ color: "var(--text-primary)" }}>
                  {calc.tradeskillXP} 🛠️
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Cost: </span>
                <span style={{ color: "var(--accent-primary)" }}>
                  {calc.cost.toFixed(2)} 💰
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>
                  Efficiency:{" "}
                </span>
                <span style={{ color: "#22c55e" }}>
                  {(calc.cost / (calc.tradeskillXP || 1)).toFixed(2)} 💰/XP
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
