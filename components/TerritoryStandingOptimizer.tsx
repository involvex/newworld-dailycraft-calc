import React, { useState, useEffect, useMemo } from "react";
import {
  MaterialInventory,
  TerritoryOptimizerConfig,
  OptimizerResult
} from "../types";
import { useConfig } from "../hooks/useConfig";
import {
  optimizeTerritoryStanding,
  optimizeTerritoryStandingWithGold,
  formatMaterialName
} from "../services/territoryOptimizerService";

interface TerritoryStandingOptimizerProps {
  // Receive current inventory from parent (OCR or manual)
  initialInventory?: Partial<MaterialInventory>;
}

export const TerritoryStandingOptimizer: React.FC<
  TerritoryStandingOptimizerProps
> = ({ initialInventory = {} }) => {
  const { config, updateConfig } = useConfig();

  // Local state for optimizer config
  const [activeTerritory, setActiveTerritory] = useState(
    config.territoryOptimizer?.activeTerritoryId || "windsward"
  );
  const [standingGainMultiplier, setStandingGainMultiplier] = useState(
    config.territoryOptimizer?.standingGainMultiplier ?? 1.0
  );
  const [allowMarketPurchases, setAllowMarketPurchases] = useState(
    config.territoryOptimizer?.allowMarketPurchases ?? false
  );
  const [goldBudget, setGoldBudget] = useState(
    config.territoryOptimizer?.goldBudget ?? 0
  );
  const [strategy, setStrategy] = useState<
    "inventory_only" | "gold_augmented" | "time_limited"
  >(config.territoryOptimizer?.strategy || "inventory_only");

  // Material inventory state (editable)
  const [inventory, setInventory] = useState<MaterialInventory>({
    azoth: 0,
    corruptedFragment: 0,
    corruptedShard: 0,
    corruptedCrystal: 0,
    corruptedLodestone: 0,
    stoneBrick: 0,
    lodestoneBrick: 0,
    obsidianVoidstone: 0,
    runestone: 0,
    timber: 0,
    lumber: 0,
    wyrdwoodPlanks: 0,
    ironwoodPlanks: 0,
    ...initialInventory
  });

  // Results state
  const [result, setResult] = useState<OptimizerResult | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Sync config when changed
  useEffect(() => {
    const base = config.territoryOptimizer || {};
    updateConfig("territoryOptimizer", {
      ...base,
      activeTerritoryId: activeTerritory,
      standingGainMultiplier,
      allowMarketPurchases,
      goldBudget,
      strategy
    } as TerritoryOptimizerConfig);
  }, [
    activeTerritory,
    standingGainMultiplier,
    allowMarketPurchases,
    goldBudget,
    strategy,
    config.territoryOptimizer,
    updateConfig
  ]);

  // Material categories for grouping in UI
  const materialGroups = useMemo(
    () => ({
      Azoth: ["azoth"] as const,
      "Corrupted (T1–T4)": [
        "corruptedFragment",
        "corruptedShard",
        "corruptedCrystal",
        "corruptedLodestone"
      ] as const,
      "Stone/Build": [
        "stoneBrick",
        "lodestoneBrick",
        "obsidianVoidstone",
        "runestone"
      ] as const,
      Wood: ["timber", "lumber", "wyrdwoodPlanks", "ironwoodPlanks"] as const
    }),
    []
  );

  const handleInventoryChange = (
    key: keyof MaterialInventory,
    value: number
  ) => {
    setInventory(prev => ({
      ...prev,
      [key]: Math.max(0, value)
    }));
  };

  const calculate = () => {
    if (strategy === "inventory_only" || !allowMarketPurchases) {
      const res = optimizeTerritoryStanding(inventory, standingGainMultiplier);
      setResult(res);
    } else {
      // Use market price data if available
      const priceData = config.prices?.data || {};
      // Convert priceData (which is Record<string, PriceData>) to simple Record<string, number>
      const simplePrices: Record<string, number> = {};
      for (const [itemName, pd] of Object.entries(priceData)) {
        simplePrices[itemName] = pd.price;
      }
      // Also try by ID mapping: item IDs likely match keys? We'll rely on user having imported prices with matching names.
      const res = optimizeTerritoryStandingWithGold(
        inventory,
        standingGainMultiplier,
        goldBudget,
        simplePrices
      );
      setResult(res);
    }
    setHasCalculated(true);
  };

  const resetInventory = () => {
    setInventory({
      azoth: 0,
      corruptedFragment: 0,
      corruptedShard: 0,
      corruptedCrystal: 0,
      corruptedLodestone: 0,
      stoneBrick: 0,
      lodestoneBrick: 0,
      obsidianVoidstone: 0,
      runestone: 0,
      timber: 0,
      lumber: 0,
      wyrdwoodPlanks: 0,
      ironwoodPlanks: 0
    });
    setResult(null);
    setHasCalculated(false);
  };

  // Derive effective multiplier display
  const effectiveMultiplierPct = Math.round((standingGainMultiplier - 1) * 100);

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-yellow-400">
        🏛️ Territory Standing Optimizer
      </h2>
      <p className="text-sm text-gray-400">
        Plan your Territory Supplies crafts to maximize standing gain with
        available materials.
      </p>

      {/* 1. Bonuses & Settings */}
      <section className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">
          ⚙️ Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Territory Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Active Territory
            </label>
            <select
              value={activeTerritory}
              onChange={e => setActiveTerritory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="windsward">Windsward</option>
              <option value="everfall">Everfall</option>
              <option value="brightwood">Brightwood</option>
              <option value="weaversfen">Weaver&apos;s Fen</option>
              <option value="mourningdale">Mourningdale</option>
              <option value="restlessshore">Restless Shore</option>
              <option value="reekwater">Reekwater</option>
              <option value="ebonscalereach">Ebonscale Reach</option>
              <option value="cleavespoint">Cleave&apos;s Point</option>
              <option value="edensplains">Eden&apos;s Plains</option>
              <option value="antonia">Antonia</option>
              <option value="greatcleave">Great Cleave</option>
            </select>
          </div>

          {/* Standing Gain Multiplier */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Standing Gain Multiplier: +{effectiveMultiplierPct}%
            </label>
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={effectiveMultiplierPct}
              onChange={e => {
                const pct = parseInt(e.target.value);
                setStandingGainMultiplier(1 + pct / 100);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>+50%</span>
              <span>+100%</span>
              <span>+200%</span>
              <span>+300%</span>
            </div>
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Strategy
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === "inventory_only"}
                  onChange={() => {
                    setStrategy("inventory_only");
                    setAllowMarketPurchases(false);
                  }}
                  className="text-yellow-600"
                />
                <span className="text-sm text-gray-300">
                  Use inventory only
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="strategy"
                  checked={strategy === "gold_augmented"}
                  onChange={() => {
                    setStrategy("gold_augmented");
                    setAllowMarketPurchases(true);
                  }}
                  className="text-yellow-600"
                />
                <span className="text-sm text-gray-300">
                  Buy missing with gold
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Gold Budget (if buying) */}
        {allowMarketPurchases && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Gold Budget: {goldBudget.toLocaleString()} g
            </label>
            <input
              type="range"
              min="0"
              max="10000000"
              step="50000"
              value={goldBudget}
              onChange={e => setGoldBudget(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500">0 → 10,000,000 gold</div>
          </div>
        )}

        {/* Market Price Import Notice */}
        {allowMarketPurchases && (
          <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded text-sm">
            <p className="text-blue-300">
              ⚠️ Market prices must be imported via Settings → Price
              Configuration first.
              {Object.keys(config.prices?.data || {}).length === 0 && (
                <span className="block mt-1 text-yellow-300">
                  No price data loaded — optimizer will assume all materials are
                  available at 0 gold.
                </span>
              )}
            </p>
          </div>
        )}
      </section>

      {/* 2. Material Inventory Input */}
      <section className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">
            📦 Materials Inventory
          </h3>
          <button
            onClick={resetInventory}
            className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white"
          >
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(materialGroups).map(([groupName, keys]) => (
            <div key={groupName} className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                {groupName}
              </h4>
              {keys.map(key => {
                const itemKey = key as keyof MaterialInventory;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <label
                      htmlFor={key}
                      className="text-xs text-gray-300 w-28 truncate"
                      title={formatMaterialName(key)}
                    >
                      {formatMaterialName(key)}
                    </label>
                    <input
                      type="number"
                      id={key}
                      min="0"
                      value={inventory[itemKey]}
                      onChange={e =>
                        handleInventoryChange(
                          itemKey,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* 3. Calculate Button */}
      <div className="flex justify-center">
        <button
          onClick={calculate}
          disabled={inventory.azoth < 200 && strategy === "inventory_only"}
          className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
            inventory.azoth < 200 && strategy === "inventory_only"
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-500 text-white"
          }`}
        >
          🧮 Calculate Optimal Plan
        </button>
      </div>

      {/* 4. Results Panel */}
      {hasCalculated && result && (
        <section className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold text-green-400 mb-4">
            🏆 Optimization Results
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-gray-700/50 rounded">
              <div className="text-xs text-gray-400 uppercase">
                Base Standing
              </div>
              <div className="text-2xl font-bold text-white">
                {result.totalStandingBase.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-gray-700/50 rounded border-2 border-yellow-600">
              <div className="text-xs text-yellow-300 uppercase">
                Effective (+{effectiveMultiplierPct}%)
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {result.totalStandingEffective.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-gray-700/50 rounded">
              <div className="text-xs text-gray-400 uppercase">Azoth Used</div>
              <div className="text-2xl font-bold text-blue-400">
                {result.azothConsumed.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                ({result.azothRemaining.toLocaleString()} remaining)
              </div>
            </div>
            <div className="p-3 bg-gray-700/50 rounded">
              <div className="text-xs text-gray-400 uppercase">Gold Needed</div>
              <div className="text-2xl font-bold text-yellow-500">
                {result.shortageGold > 0
                  ? result.shortageGold.toLocaleString()
                  : 0}{" "}
                g
              </div>
            </div>
          </div>

          {/* Batches */}
          {result.batches.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white">
                Crafting Batches
              </h4>
              {result.batches.map((batch, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    batch.tier === 4
                      ? "bg-orange-900/20 border-orange-500"
                      : batch.tier === 3
                        ? "bg-purple-900/20 border-purple-500"
                        : batch.tier === 2
                          ? "bg-blue-900/20 border-blue-500"
                          : "bg-gray-900/20 border-gray-500"
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start">
                    <div>
                      <span className="text-sm font-bold uppercase text-gray-400">
                        Tier {batch.tier} —{" "}
                        {batch.tier === 4
                          ? "Superior Territory Supplies"
                          : batch.tier === 3
                            ? "Quality Territory Supplies"
                            : batch.tier === 2
                              ? "Territory Supplies"
                              : "Basic Territory Supplies"}
                      </span>
                      <div className="text-lg font-bold text-white mt-1">
                        ×{batch.count.toLocaleString()} →{" "}
                        <span className="text-green-400">
                          {batch.standingEffective.toLocaleString()} standing
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      {batch.standingBase} each × {batch.count} ={" "}
                      {batch.standingBase * batch.count} (×
                      {standingGainMultiplier.toFixed(2)})
                    </div>
                  </div>

                  {/* Materials used for this batch */}
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {Object.entries(batch.materialsUsed).map(([matId, qty]) => (
                      <div
                        key={matId}
                        className="flex justify-between text-gray-300"
                      >
                        <span>{formatMaterialName(matId)}</span>
                        <span className="font-mono">
                          {qty.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* If this batch required purchases */}
                  {Object.entries(result.materialsNeededToBuy).some(
                    ([matId]) => batch.materialsUsed[matId]
                  ) && (
                    <div className="mt-2 text-xs text-yellow-400">
                      Some materials purchased from Trading Post
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              No crafts possible with current inventory. Try lowering tier
              requirements or enable market purchases.
            </p>
          )}

          {/* Standing Gains Breakdown */}
          <div className="mt-6 p-4 bg-gray-700/30 rounded">
            <h4 className="text-md font-semibold text-white mb-2">
              📊 Summary
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Raw standing generated:</span>
                <span className="text-white font-mono">
                  {result.totalStandingBase.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Multiplier applied:</span>
                <span className="text-yellow-400">
                  ×{standingGainMultiplier.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-2">
                <span className="text-white">Total effective standing:</span>
                <span className="text-green-400">
                  {result.totalStandingEffective.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                // Export to CSV
                const rows = [
                  ["Territory Standing Plan", activeTerritory.toUpperCase()],
                  [],
                  [
                    "Batch",
                    "Tier",
                    "Count",
                    "Standing Each",
                    "Total Standing",
                    "Materials"
                  ],
                  ...result.batches.map((b, i) => [
                    `Batch ${i + 1}`,
                    b.tier,
                    b.count,
                    b.standingBase,
                    b.standingEffective,
                    Object.entries(b.materialsUsed)
                      .map(([id, q]) => `${formatMaterialName(id)}: ${q}`)
                      .join("; ")
                  ])
                ];
                const csv = rows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `territory-standings-plan-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
            >
              📤 Export CSV
            </button>

            <button
              onClick={() => {
                // Save current inventory as preset (future)
                alert("Preset saving not implemented yet.");
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded"
            >
              💾 Save Plan
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
