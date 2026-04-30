# Territory Standing Optimizer — Comprehensive Implementation Plan

**Issue**: Calculate the optimal way to spend resources on items to craft to maximize Territory Standing with all boosters active.

**Reference**: https://nwmp.gaming.tools/ (market price API), https://nwdb.info/ (recipe data)

**User Conditions**:

- End-of-game New World (sunset year)
- Gathering yields increased
- Territory standing gain increased
- All premium shop items free (cosmetic/QoL, indirect only)

---

## Core Problem Statement

Given:

- Player's material inventory (counts of Azoth, Corrupted Fragments/Shards/Crystals/Lodestones, Stone Bricks, Lodestone Bricks, Obsidian Voidstones, Runestones, Timber, Lumber, Wyrdwood Planks, Ironwood Planks)
- Territory bonuses active (Standing Gain card count, global event multipliers)
- Optional gold budget for buying missing materials from Trading Post
- Optional time constraint (play session length)

Objective:

- Determine which Territory Supplies recipe to craft and how many times to **maximize total standing gained** under resource constraints.

---

## Game Mechanics Background

### Territory Supplies Recipes (from nwdb.info)

| Tier | Recipe Name                 | Stonecutting Req | Standing | Ingredients                                                              |
| ---- | --------------------------- | ---------------- | -------- | ------------------------------------------------------------------------ |
| T1   | Basic Territory Supplies    | Lvl 25           | 560      | 200 Azoth, 20 Corrupted Fragment, 40 Stone Brick, 20 Timber              |
| T2   | Territory Supplies          | Lvl 50           | 1,000    | 200 Azoth, 10 Corrupted Shard, 20 Lodestone Brick, 20 Lumber             |
| T3   | Quality Territory Supplies  | Lvl 75           | 2,436    | 200 Azoth, 3 Corrupted Crystal, 6 Obsidian Voidstone, 20 Wyrdwood Planks |
| T4   | Superior Territory Supplies | Lvl 100          | 5,280    | 200 Azoth, 2 Corrupted Lodestone, 2 Runestone, 20 Ironwood Planks        |

**Notes**:

- All recipes consume **200 Azoth** (constant)
- Standing scales superlinearly (T4 gives 2.17× T3, not linear)
- Higher tiers require rarer materials (Corrupted Lodestone is legendary, from T5+ breaches or crafting 2 Crystals)
- **No physical item returned** — purely standing XP grant

### Material Upgrade Chains (one-way only)

**Corrupted chain** (T1→T4 upgrade exists via crafting):

- Corrupted Fragment (T1 breach) → 3× Corrupted Shard (T2)
- Corrupted Shard ×3 → Corrupted Crystal (T3)
- Corrupted Crystal ×2 → Corrupted Lodestone (T4)

**Building stone chain** (direct gather or upgrade via stonecutting):

- Stone Brick → Lodestone Brick → Obsidian Voidstone → Runestone

**Wood chain**:

- Timber → Lumber → Wyrdwood Planks → Ironwood Planks

**Important**: **Downgrading is NOT possible** in New World crafting. Once you upgrade a material, you cannot get the lower-tier back.

### Territory Standing Multipliers

Base standing gained × (1 + Σ bonuses):

- **Standing Gain card**: +5% per stack (stacks multiplicatively; diminishing returns apply after ~8–10 picks)
- **Global event "Standing Weekend"**: commonly +100% to +300%
- **Territory-specific buffs**: sometimes township buffs include +standing% (rare)
- **Premium shop free**: no direct effect (cosmetic only)

User states: "all things in premium shop are free" — this means the **cost savings** from free housing, storage, etc. could be re-allocated to material purchasing. Indirect economic benefit.

---

## Optimization Model

### Decision Variables

- `x1, x2, x3, x4` = number of times to craft T1–T4 (non-negative integers)

### Objective

Maximize total effective standing:

```
max Σ_{i=1..4} ( xi × baseStanding[i] × (1 + standingMultiplier) )
```

where `standingMultiplier` is decimal sum of all % bonuses (e.g., 1.0 = +100%).

Since multiplier is constant across all choices, equivalent to:

```
max Σ xi × baseStanding[i]
```

### Constraints (per material)

Let:

- `M_k` = player's inventory of material k
- `u_{i,k}` = quantity of material k consumed per craft of recipe i
- `shortage_k = max(0, Σ (xi × u_{i,k}) - M_k )` = amount that must be obtained (farm/buy)

**Material availability constraints** (if not buying):

```
Σ xi × u_{i,k} ≤ M_k   for all materials k
```

**If buying allowed** (with gold):

```
totalGoldCost = Σ (shortage_k × price_k) ≤ goldBudget
```

**Single-resource bottleneck**: All recipes consume exactly 200 Azoth, so:

```
Σ xi ≤ floor(M_azoth / 200)  if Azoth is only from inventory
```

### Feasibility & Optimality Structure

**Key observation**: For every material, **higher-tier recipes have better standing per unit of that material** (except for materials exclusive to higher tiers that lower tiers don't use).

Compare ratios:

- T4 standing/Azoth = 26.4, T3 = 12.18, T2 = 5.0, T1 = 2.8 — strictly decreasing
- For shared materials (none actually shared—each tier uses distinct material tiers)
- Therefore greedy "craft as many T4 as possible, then T3, then T2, then T1" is **globally optimal** given only inventory constraints and assuming all materials are equally available (no substitution).

**But**: If player has **unbalanced inventory** (e.g., many T2 mats but few T4 mats), greedy might still be optimal because for each limiting material, using it in its highest-tier recipe yields highest standing per unit of that rare material. Formal proof: Since recipes consume disjoint sets of rare materials (Corrupted Shard vs Crystal vs Lodestone), there's no substitution. Each mat type's capacity to produce standing is independent: if mat A limits T4 crafts to 5, then you should make all 5 T4 because you can't use those Lodestones elsewhere. Then use remaining Azoth (and other excess mats) for T3, etc.

**Algorithm** (inventory-only, no buying):

1. For each tier i from 4 down to 1:
   - `possible_i = min( floor(M_azoth / 200), floor(M_corrupted_i / need_corrupted_i), floor(M_build_i / need_build_i), floor(M_wood_i / need_wood_i) )`
   - `xi = possible_i`
   - Subtract consumed materials from inventory (`M_k -= xi × u_{i,k}`)
2. Return `(x1, x2, x3, x4)`

This is O(4 × 13) operations, trivial.

**With gold purchases**:

- More complex: we can buy shortage materials.
- Model as: choose `(x4, x3, x2, x1)` to maximize Σ baseStanding[i]·xi
- Subject to: goldCost(x) ≤ budget
- This is a **bounded knapsack** where each recipe type "item" has value v_i = baseStanding[i], weight = goldCost_i, and can be taken many times.
- However, goldCost_i depends on shortage after applying inventory. This makes it non-linear: the first craft might be cheap (materials on hand), second craft expensive (need to buy).
  **Solution**: Enumerate ordered by tiers (T4 first) greedily, computing marginal cost of each additional craft of that tier, stop when gold exhausted or Azoth exhausted. Since T4 gives best value/gold ratio (likely), greedy by value/gold descending works as approximation.

Implementation plan: two-phase:

- Phase A: "Inventory-limited" (no buying)
- Phase B: "Gold-augmented" (buy missing with gold)

### Phase B Greedy Algorithm:

```
remainingGold = budget
remainingAzoth = M_azoth
consumedMats = {k: 0}
chooseTierOrder = [4, 3, 2, 1]  // descending value/Azoth approx

for tier in chooseTierOrder:
  while remainingAzoth >= 200:
    // compute marginal shortage for one more craft of this tier
    shortageMaterials = []
    for each material k in recipe[tier]:
      needed = ingredients[k]
      afterConsumption = (consumedMats[k] + needed) - M_inventory[k]
      if afterConsumption > 0:
        shortageMaterials.push({k, qty: afterConsumption})
    marginalCost = Σ shortage.qty × price[k]
    totalCost = marginalCost  // cost to buy all shortages for this craft
    if totalCost > remainingGold: break
    // commit craft
    xi[tier]++
    remainingGold -= totalCost
    remainingAzoth -= 200
    for each material k: consumedMats[k] += needed
```

This is O(maxCrafts × recipeSize) which is small.

**Note**: This greedy assumes that once you decide to craft a tier, you should exhaust either Azoth or gold on that tier before moving to next. Might not be truly optimal if a mix of T3 and T4 could yield better overall standing due to different material price ratios, but likely close given huge T4 superiority.

We could also compute exact via integer linear programming (ILP) using a solver (e.g., `glpk.js` or custom branch&bound). But overkill for 4 variables.

Recommendation: Implement inventory-only greedy first (Phase 1). Then add gold-augmented greedy if user demand.

---

## User Interface Design

### New Component: `TerritoryStandingOptimizer.tsx`

Layout:

```
┌─ Territory Standing Optimizer (v1.0) ─────────────────────────────┐
│ 1️⃣ Configure Bonuses                                           │
│    [Territory ▲]  [Standing Gain ×10 (+50%)]  [Global Event +100%]│
│                                                            [⚙️]│
├───────────────────────────────────────────────────────────────────┤
│ 2️⃣ Inventory / Materials                                        │
│    ┌─────────────────────┐  ┌─────────────────────┐             │
│    │ Azoth              █ │  │ Corrupted Lodestone █ │             │
│    │  ████████████████  │  │  ████░░░░░░░░░░░░  │             │
│    └─────────────────────┘  └─────────────────────┘             │
│    ┌─────────────────────┐  ┌─────────────────────┐             │
│    │ Corrupted Crystal  █ │  │ Runestone           █ │             │
│    │  ██████░░░░░░░░░░  │  │  ██████████████░░  │             │
│    └─────────────────────┘  └─────────────────────┘             │
│  [Show all 13 materials ▼]                                       │
├───────────────────────────────────────────────────────────────────┤
│ 3️⃣ Optimization Strategy                                        │
│    ○ Use inventory only (no buying)                              │
│    ○ Allow TP purchases (budget: [500,000] gold)                 │
│                                                            [Prices]│
├───────────────────────────────────────────────────────────────────┤
│ 4️⃣ Results                                                      │
│    🏆 Optimal Crafting Plan                                      │
│    ┌────────────────────────────────────────────────────┐         │
│    │ Superior Territory Supplies × 8 (T4)               │         │
│    │  → 42,240 standing (with +50% bonus = 63,360)     │         │
│    │  Consumes: 1,600 Azoth, 16 Corrupted Lodestone,   │         │
│    │             16 Runestone, 160 Ironwood Planks     │         │
│    │  Shortage: Buy 8 Corrupted Lodestone (×2 price)   │         │
│    └────────────────────────────────────────────────────┘         │
│    ┌────────────────────────────────────────────────────┐         │
│    │ Quality Territory Supplies × 12 (T3)              │         │
│    │  → 29,232 standing                                 │         │
│    │  Consumes: 2,400 Azoth, 36 Corrupted Crystal,     │         │
│    │             72 Obsidian Voidstone, 240 Wyrdwood   │         │
│    └────────────────────────────────────────────────────┘         │
│    ┌────────────────────────────────────────────────────┐         │
│    │ TOTAL: 71,472 standing (+50% = 107,208)           │         │
│    │ Standing Levels Gained: ~214 (from current 86)   │         │
│    │ Estimated Time: 6 hours of gathering/crafting    │         │
│    └────────────────────────────────────────────────────┘         │
│  💾 Save Plan  📤 Export CSV  🎯 Set Goal                         │
└───────────────────────────────────────────────────────────────────┘
```

**Features**:

- Material inventory summary with progress bars (maybe reuse existing inventory OCR to import)
- Quick-set: "Max all materials" slider unrealistic? Better: manual input or import from OCR
- Strategy selector: inventory-only vs. gold-augmented
- Optional: "Include market prices" toggle — fetches from `config.prices.data` or nwmp API
- Results: list of crafts in descending tier order, with shortage list and gold estimate
- Actions: Save plan to presets, export CSV, create crafting goal with target standing level

**Placement**: New tab in existing TradeskillCalculatorV2 view (next to "Recipes", "Bulk", "Compare", add "Standing Optimizer" tab).

---

## Data Model Extensions

### 1. New Types (types.ts)

```typescript
interface MaterialInventory {
  azoth: number;
  corruptedFragment: number;
  corruptedShard: number;
  corruptedCrystal: number;
  corruptedLodestone: number;
  stoneBrick: number;
  lodestoneBrick: number;
  obsidianVoidstone: number;
  runestone: number;
  timber: number;
  lumber: number;
  wyrdwoodPlanks: number;
  ironwoodPlanks: number;
}

interface TerritoryOptimizerConfig {
  activeTerritoryId: string; // e.g., "brightwood"
  standingGainMultiplier: number; // decimal e.g., 1.5 for +50%
  allowMarketPurchases: boolean;
  goldBudget: number;
  strategy: "inventory_only" | "gold_augmented" | "time_limited";
}

interface OptimizerResult {
  crafts: {
    tier: 1 | 2 | 3 | 4;
    count: number;
    standingBase: number;
    standingEffective: number;
    materialsUsed: Record<string, number>;
  }[];
  totalStandingBase: number;
  totalStandingEffective: number;
  shortageGold: number;
  materialsNeededToBuy: Record<string, number>;
  azothConsumed: number;
}
```

### 2. Market Price Integration

**Leverage existing `marketService.ts`**:

- `fetchPricesByItemName(server)` already fetches trading post data
- Stored in `config.prices.data` as `{ itemName: {price, lastUpdated, server} }`
- Need mapping from material IDs (e.g., `CORRUPTED_LODESTONE`) to price entry key (item names likely "Corrupted Lodestone")

**Enhancement**: Extend price service to include raw materials. Check if current `marketService` already includes them.

Read `marketService.ts`:

---

## Implementation Roadmap

### Sprint 1 — Core Recipe Data ( foundational )

**Tasks**:

1. Add Territory Supplies recipes to `data/recipes.ts` (T1–T4)
2. Add corresponding items to `data/items.ts`
3. Update `RECIPES` export to include them
4. Verify they appear in recipe data when loading
5. Add unit test: `TerritorySuppliesRecipesExist()`

**Verification**:

- Run app, search "Territory Supplies" — recipes found in Stonecutting category
- Check recipe details show correct standing XP and ingredients

---

### Sprint 2 — Greedy Optimizer Engine (MVP algorithm)

**Files**:

- `services/territoryOptimizerService.ts` (new)

**Exports**:

```typescript
export function optimizeTerritoryStanding(
  inventory: MaterialInventory,
  multiplier: number,
  allowPurchases: false
): OptimizerResult;

export function optimizeWithGold(
  inventory: MaterialInventory,
  multiplier: number,
  goldBudget: number,
  priceData: PriceData
): OptimizerResult;
```

**Implementation**:

- Simple greedy descending tier loop
- Material consumption bookkeeping
- Result assembly

**Unit tests** (can use Jest or manual test page):

- Case A: all materials abundant → max T4 until Azoth depleted
- Case B: Lodestone scarce but others abundant → T4 limited by Lodestone, then T3
- Case C: only T1 materials available → all T1
- Case D: mixed but missing Azoth → Azoth-limited

---

### Sprint 3 — Settings & Configuration

**Modify**:

- `hooks/useConfig.ts`: Add `territoryOptimizer` sub-object
- `types.ts`: Extend Config with optimizer defaults
- `SettingsModal.tsx`: Add "Territory Optimizer" section (collapsible):
  - Active Territory dropdown (all 12 territories)
  - Standing Gain multiplier input (read-only derived from config? Or manual override)
  - Policy: "Inventory only" / "Gold budget"
  - Gold budget field (if selected)
  - Button: "Import market prices" (reuse existing price import)
  - Checkbox: "Apply global yield events" (linked to endgame bonuses)

**Storage**: Persist to `config.territoryOptimizer` in localStorage/Electron config.

---

### Sprint 4 — UI Component

**New file**: `components/TerritoryStandingOptimizer.tsx`

Structure:

- Top bar: config selector (territory/event/bonuses)
- Middle: inventory input grid (13 inputs with icons)
- Strategy selector (radio group)
- "Calculate" button
- Results panel (list of craft batches + summary)

**Reuse**:

- Item icons from existing `ITEM_MAPPINGS` or `items` state
- Tailwind styling consistent with app (dark mode vars)
- Possible integration with existing `useInventoryOCR` to auto-fill material inventory from screenshot

**Connection to OCR**: Could parse screenshot for Territory Supplies ingredients? Possibly, but out of scope for MVP. Instead, let user manually type numbers.

---

### Sprint 5 — Market Price Integration

**Option**: Allow user to import server prices, then optimizer can recommend which materials to buy if gold budget permits.

**Implementation**:

1. Extend `PriceData` interface to cover raw materials
2. `marketService.ts` already fetches by item name — ensure raw materials are in the dataset (they should be)
3. In `optimizeWithGold`, pass `priceData` map; compute `shortage × price`
4. Show "Buy: 8 Corrupted Lodestone @ 1,250g each = 10,000g" in results

**UI**: "Prices loaded: ✅ from Nysa server (2 days ago)" badge.

---

### Sprint 6 — Advanced Features

- **What-if scenarios**: "What if I craft 50 more T4?" → update remaining materials
- **Export plan to CSV**: include craft sequence, expected standing after each
- **Link to goals**: "Create Crafting Goal: Reach Standing Level 300" → auto-generate needed crafts and show projected date
- **Efficiency metrics**: display "Standing per Azoth", "Standing per gold", "Time to completion"
- **Alternative paths**: If missing rare mats, show "Farm Corrupted Lodestones instead of buying (2 hrs)" vs "Buy now (10k gold)"
- **Batch optimization across multiple territories**: Currently per-territory; could sum all 12 territories to level all simultaneously

---

## Testing Strategy

1. **Unit tests** for optimizer algorithm:
   - Known inventory + known bonuses = known optimal crafts
   - Validate across edge cases (zero inventory, only T4 mats, etc.)

2. **Integration tests**:
   - Settings save/load preserves optimizer config
   - Market price import end-to-end
   - CSV export contains correct data

3. **Manual QA**:
   - Compare optimizer output with community spreadsheets (e.g., Google Sheets territory bonus calculators)
   - Simulate 10 crafts manually to verify totals

---

## Dependencies

### External Data

| Source             | Purpose                            | Format                     | Update Freq                      |
| ------------------ | ---------------------------------- | -------------------------- | -------------------------------- |
| nwdb.info (static) | Recipe data for Territory Supplies | JSON/HTML scrape           | With game patches                |
| nwmp.gaming.tools  | Market prices for raw materials    | JSON API (server-specific) | Real-time via community scanners |
| New World Wiki     | Territory names/IDs list           | Static                     | Rare                             |

**Strategy**:

- Bundle recipe data in `data/recipes.ts` (static)
- Fetch market prices via existing `marketService` (already does this for gear); extend to raw materials if needed

---

## User Experience Flow

1. User opens calculator → goes to new "🏛️ Territory" tab
2. Sees empty inventory grid → either manually enter counts or click "Import from OCR" (future)
3. Sets **Strategy**: "Use materials only (no buying)" or "Buy missing with ≤ 100k gold"
4. If buying, clicks "Load market prices" → selects server → fetches latest TP rates
5. Clicks **"Calculate Optimal Plan"**
6. Results show:
   - "Craft 8× Superior Territory Supplies (T4)"
   - "Then craft 12× Quality Territory Supplies (T3)"
   - "Total standing gained: 71,472" (or 107,208 with +50% event)
   - "You'll need to buy: 8 Corrupted Lodestone (cost: 10,000g)"
   - "Estimated completion: 3 crafting sessions, 45 minutes each"
7. Options: "Add to Goals", "Export CSV", "Share Plan"

---

## UI Mockups (ASCII)

### Tab Layout

```
[ 🏠 Overview ]  [ ⚔️ Tradeskills ]  [ 🏛️ Territory Standing ]  [ 📊 Statistics ]
```

### Main Optimizer View

```
┌─ Territory Standing Optimizer ─────────────────────────────────────┐
│                                                                    │
│  Territory: [Brightwood ▼]  |  Current Standing: [____] / 300     │
│  Standing Gain Buff: [+65% from cards + events]  [⚙️ configure]  │
│                                                                    │
│  ┌─ Materials Inventory ──────────────────────────────────────┐   │
│  │ Group by: [All ▼]  [Corrupted ▼]  [Stone ▼]  [Wood ▼]     │   │
│  │                                                             │   │
│  │  Azoth                     ████████████░░░░ 12,500 / 20k │   │
│  │  Corrupted Fragment        ████░░░░░░░░░░░░░░ 800         │   │
│  │  Corrupted Shard           █████░░░░░░░░░░░░░ 1,200       │   │
│  │  Corrupted Crystal         ░░░░░░░░░░░░░░░░░░ 0           │   │
│  │  Corrupted Lodestone       ░░░░░░░░░░░░░░░░░░ 2           │   │
│  │  Stone Brick               ████████████░░░░ 3,400        │   │
│  │  Lodestone Brick           ████████░░░░░░░░░ 800         │   │
│  │  Obsidian Voidstone        ░░░░░░░░░░░░░░░░░░ 0          │   │
│  │  Runestone                 ░░░░░░░░░░░░░░░░░░ 0          │   │
│  │  Timber                    ███████████████░ 5,000       │   │
│  │  Lumber                    ███████████░░░░░░ 2,500       │   │
│  │  Wyrdwood Planks           ████████░░░░░░░░░ 800         │   │
│  │  Ironwood Planks           ░░░░░░░░░░░░░░░░░░ 0           │   │
│  │                                                             │   │
│  │  [Import from OCR]  [Reset to zero]                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Strategy: ○ Inventory-only  ● Buy missing with ≤ 250,000 gold    │
│             [ ] Include market prices for material costs           │
│                                                                    │
│  [Calculate Optimal Plan]                                          │
│                                                                    │
│  ── Results ─────────────────────────────────────────────────────  │
│                                                                    │
│  🏆 Best Crafting Sequence (by standing efficiency):              │
│                                                                    │
│  1. Superior Territory Supplies × 8 (requires 1,600 Azoth, 16 CL) │
│     → 42,240 standing (63,360 with +50% event)                   │
│     Shortfall: 14 Corrupted Lodestone → buy @ 1,250g each = 17.5k│
│                                                                    │
│  2. Quality Territory Supplies × 12 (requires 2,400 Azoth, 36 CC)│
│     → 29,232 standing (43,848 with +50%)                         │
│     Shortfall: 30 Corrupted Crystal → buy @ 420g each = 12.6k    │
│                                                                    │
│  3. Territory Supplies × 5 (requires 1,000 Azoth, 50 Shards)     │
│     → 5,000 standing (7,500 with +50%)                           │
│     Shortfall: none (sufficient shards on hand)                  │
│                                                                    │
│  ────────────────────────────────────────────────────────────────  │
│  SUMMARY: Total standing: 76,472 → 114,708 with +50% event        │
│           Azoth consumed: 5,000 / 12,500 (7,500 remaining)       │
│           Gold needed for shortages: 30,100g (budget: 250,000g)  │
│           Time estimate: ~4.5 hours (gather + craft)              │
│           Standing levels gained: 228 (from current 72 → 300)    │
│                                                                    │
│  [💾 Save to Goals]  [📤 Export CSV]  [🔄 Recalculate]            │
└────────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Details

### Service: `territoryOptimizerService.ts`

```typescript
export interface MaterialInventory { /* as defined above */ }
export interface OptimizerConfig { /* as defined above */ }
export interface CraftBatch { tier: number; count: number; standing: number; shortage: MaterialShortage[] }
export interface OptimizerResult { batches: CraftBatch[]; totalStanding: number; ... }

export function computeOptimalPlan(
  inventory: MaterialInventory,
  config: OptimizerConfig,
  prices?: PriceData
): OptimizerResult {
  // Core greedy algorithm
}
```

### Integration points

1. **App.tsx**: Add new state `territoryOptimizerConfig` (from useConfig)
2. **TradeskillCalculatorV2.tsx**: Add new tab `"standing"`; render component
3. **useConfig.ts**: Extend `Config` with `territoryOptimizer` and add default values
4. **hooks/useInventoryOCR.ts**: Can we detect Territory Supplies mats? Not needed initially; manual entry.

---

## Performance Considerations

- Greedy algorithm: O(1) per run (constant 4 tiers × 13 materials = 52 ops)
- Material inventory stored as plain JS object, cheap to copy
- Results memoized? Not needed, runs instantly
- UI: input grid should be debounced on change if heavy, but 13 text fields trivial

---

## Market Price API Integration Details

### Existing Infrastructure

The calculator already has `marketService.ts` with:

```typescript
export async function fetchPricesByItemName(server: string): Promise<Map<string, number>> { ... }
```

It pulls from a remote data source (likely nwmp.gaming.tools backend). Let's inspect that file to confirm coverage:

---

### Material Price Names Mapping

Need canonical item names for price lookup:

| Material            | Expected API key      |
| ------------------- | --------------------- |
| Azoth               | "Azoth"               |
| Corrupted Fragment  | "Corrupted Fragment"  |
| Corrupted Shard     | "Corrupted Shard"     |
| Corrupted Crystal   | "Corrupted Crystal"   |
| Corrupted Lodestone | "Corrupted Lodestone" |
| Stone Brick         | "Stone Brick"         |
| Lodestone Brick     | "Lodestone Brick"     |
| Obsidian Voidstone  | "Obsidian Voidstone"  |
| Runestone           | "Runestone"           |
| Timber              | "Timber"              |
| Lumber              | "Lumber"              |
| Wyrdwood Planks     | "Wyrdwood Planks"     |
| Ironwood Planks     | "Ironwood Planks"     |

If the price API does not include some raw materials, we could:

- Use community pricing data from `nw-buddy`? Unlikely
- Fall back to user manual entry
- Estimate from tier (e.g., Ironwood Planks price ~ 1.5× Wyrdwood)

**Recommendation**: Check `marketService` implementation first to see what items it returns. If it only handles crafted gear, we may need to extend it or ask user to input manual prices.

---

### Future Automatic Price Import

For desktop app only (Electron), could include background fetcher:

- Poll nwmp.gaming.tools API every 24h
- Store in `config.prices.data` keyed by item name
- Merge with existing price data

But this is beyond MVP.

---

## Winter/Endgame Context Integration

User mentioned: "last year of the game... gathering yield increased, premium shop free, territory standing gain increased".

Our optimizer already handles "standing gain increased" via multiplier slider.

For **gathering yield increased**: if materials are easier to obtain, the bottleneck shifts from material scarcity to time. Could add "time-limited" mode:

- Input: "I have 6 hours to play"
- Estimate gathering rates (from server): Emerald/ hour at optimal route
- Constrain crafts by total time = gatherTime + craftTime
- Optimize standing per hour

This is Phase 6.

**Premium shop free**: Means houses, storage, fast travel costs are zero. Indirectly frees up gold for material purchases. Our "gold budget" could be inflated accordingly: "I now have 500,000 gold extra to spend on standing." That's user input.

Thus, the optimizer's **gold-augmented mode** directly leverages the "premium shop free" condition.

---

## UI/UX Polish

### Color scheme

- Azoth: blue (#3b82f6)
- Corrupted materials: purple/violet
- Stone/Building: gray
- Wood: brown/amber
- Results: tier badges (T4=legendary orange, T3=epic purple, etc.)

### Accessibility

- Input fields with labels and keyboard navigation
- Results panel screen-reader friendly (semantic headings)
- Tooltips explaining "corrupted materials" for new players

---

## Success Criteria

**Minimum Viable Product (Sprint 1+2)**:

- [ ] All 4 Territory Supplies recipes recognized in system
- [ ] User can enter inventory counts
- [ ] Optimizer returns integer plan (x1..x4)
- [ ] Plan respects material constraints (no negative shortages)
- [ ] Results display clear breakdown

**Version 1.0 (Sprint 3+4+5)**:

- [ ] Settings UI for territory bonuses saved to config
- [ ] Multi-strategy selector (inventory-only vs gold-augmented)
- [ ] Market prices import via existing price system
- [ ] CSV export of plan
- [ ] Integration with existing Goals system (create goal from plan)

**Future (Sprint 6+)**:

- [ ] Automatic inventory OCR detection (scan storage for raw mats)
- [ ] Time-limited optimization
- [ ] Multi-territory simultaneous planning
- [ ] Community shared optimal profiles (e.g., "F2P ironman", "whale with 10M gold")
- [ ] Web version availability (currently desktop only)

---

## Potential Pitfalls & Mitigations

| Risk                                                           | Impact                     | Mitigation                                                                                          |
| -------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Price API doesn't cover raw materials                          | Gold-augmented mode broken | Fallback to manual price entry, or estimate via material tier                                       |
| Users confuse Territory Supplies with regular recipes          | Users craft wrong items    | Distinct UI badge "🏛️ Standing Recipe", separate category in search                                 |
| Material counts too large (100k) → overflow?                   | Wrong calculations         | Use `bigint`? But counts < 1M safe in JS number                                                     |
| Diminishing returns on Standing Gain card                      | Multiplier wrong           | Use linear multiplier (overestimate) or teach user to input effective multiplier from known formula |
| User has no Azoth but lots of mats                             | Can't craft anything       | Clear error "Azoth insufficient — gather 200 per craft"                                             |
| Cross-territory planning (user wants all 12 territories maxed) | One-plan-fits-all unclear  | Later phase: multi-territory planner that aggregates mats across territories                        |

---

## Open Questions (Require User Input)

1. **Material tier downgrading**: In some private servers or with new patches, is downgrading possible? Assume no for live.

2. **Territory standing XP cap**: Each territory max 300. After reaching 300, further crafts give no standing in that territory. Should optimizer stop at exactly cap? Yes — add constraint `Σ xi × standing[i] + currentStanding ≤ 300` (or allow overflow? No, once cap reached no more gain). We need `currentLevel` input per territory.

3. **Corrupted material conversion**: Can we craft Corrupted Lodestone from 2 Corrupted Crystals? Yes, confirmed. That's a **separate recipe** in the game (Stonecutting). Should optimizer include conversion recipes? This becomes a **production planning** problem: decide whether to convert lower mats up to higher tiers or use them in lower-tier standing recipes. This complexity is high. **MVP assumption**: User enters inventory of each tier separately; don't auto-convert. Later may add conversion as optional "upgrade path" step.

4. **Buying vs gathering tradeoff**: If gold-augmented, optimizer assumes unlimited material availability on TP. But some mats (Corrupted Lodestone) may have low supply/.price high. Should we also include "time to acquire" estimate? Phase 6.

5. **Event windows**: Some events double standing gain for limited time. Should we allow scheduling crafts across event windows? Overkill for now.

6. **Crafting time**: Each craft takes ~2 seconds. Bulk crafting thousands of items requires many real-world hours. Should optimizer consider AFK time constraint? Possibly as "time budget". Phase 6.

---

## Comparison with Existing Community Tools

Rumor: https://nwmp.gaming.tools/ had some optimizer? Let's verify — but regardless, our calculator already established with 2k+ GitHub stars; adding this as integrated feature is valuable.

Community spreadsheet likely exists (mentioned in NWNews guide: "basic Territory Bonus Calculator spreadsheet in Google sheets"). We can differentiate by:

- Direct OCR inventory import
- Market price live fetch
- Integrated with existing crafting goals + XP tracking
- Desktop app with hotkeys (craft while playing)

---

## Implementation Timeline (estimated)

| Week | Deliverable                                                |
| ---- | ---------------------------------------------------------- |
| 1    | Add T1–T4 Territory Supplies recipes to data items         |
| 2    | Greedy optimizer service + unit tests                      |
| 3    | Settings UI + Config schema extension                      |
| 4    | TerritoryStandingOptimizer component (basic)               |
| 5    | Price integration testing (ensure raw materials available) |
| 6    | Polish UI, add CSV export, error handling                  |
| 7    | Beta release (v2.0.3) with limited testing                 |
| 8    | Full release (v2.1.0)                                      |

Total: ~2 months for complete feature (assuming part-time). Can compress if needed.

---

## Post-MVP Enhancements

- **Farming route optimizer**: Given target materials (e.g., need 20 Corrupted Lodestones), suggest best breach farming route with expected time & yield.
- **Batch splitter**: If Azoth limited, suggest doing T4 crafts in multiple sessions as Azoth replenishes.
- **Cost–benefit analyzer**: "Should I buy this Corrupted Crystal or farm it?" based on your hourly gold income estimate.
- **Legacy export**: Include standing plan in character legacy PDF

---

## Final Recommendations

**Start with Sprint 1&2 only** — verify greedy algorithm produces intuitive results with test data. Then build UI around it.

**Do not** overcomplicate with ILP or multi-territory in v1.

**Use existing systems**: reuse PriceData, Config, Tailwind components from TradeskillCalculatorV2.

Once implemented, this will be a **killer feature** for endgame players racing to max territory before server shutdown.

---

## Appendices

### A. Territory Names (12) – for dropdown

1. Brightwood
2. Cleave's Point
3. Eden's Plains
4. Ebonscale Reach
5. Everfall
6. Great Cleave
7. Monarch's Bluffs
8. Mourningdale
9. Reekwater
10. Restless Shore
11. Weaver's Fen
12. Windsward

(Verify exact names from game.)

### B. Item ID references (from nwdb.info)

| Item                | Likely ID                                 |
| ------------------- | ----------------------------------------- |
| Azoth               | `AZOTH`                                   |
| Corrupted Fragment  | `CORRUPTED_FRAGMENT` or `BREACHDROP1`     |
| Corrupted Shard     | `CORRUPTED_SHARD` or `BREACHDROP2`        |
| Corrupted Crystal   | `CORRUPTED_CRYSTAL` or `BREACHDROP3`      |
| Corrupted Lodestone | `CORRUPTED_LODESTONE` or `BREACHDROP5`    |
| Stone Brick         | `STONE_BRICK`                             |
| Lodestone Brick     | `LODESTONE_BRICK`                         |
| Obsidian Voidstone  | `OBSIDIAN_VOIDSTONE`                      |
| Runestone           | `RUNESTONE` or `BLOCKT51`? need to verify |
| Timber              | `TIMBER`                                  |
| Lumber              | `LUMBER`                                  |
| Wyrdwood Planks     | `WYRDWOOD_PLANKS`                         |
| Ironwood Planks     | `IRONWOOD_PLANKS` or `TIMBERT52`          |

Will need to cross-check with `data/items.ts` for exact IDs.

### C. Sample Calculation

Suppose:

- Azoth: 3,000
- Corrupted Lodestone: 4
- Runestone: 10
- Ironwood: 150
- Others: abundant

Greedy:

- T4 limited by min(3000/200=15, CL/2=2, RS/2=5, Ironwood/20=7) => 2 crafts
  - Standing = 10,560 at T4
- Remaining Azoth: 3,000 - 400 = 2,600
- Remaining ironwood 110; other rare mats still abundant
- Try T3 limited by Azoth 2600/200=13, but need Corrupted Crystal (none). Can't craft T3.
- T2 limited by materials? Assume we have plenty → 2600/200=13 max, but also need Lumber etc.
  - Let's say we have Lumber 200+ -> 10 crafts limited by other mats?
- T1 limited by Azoth 2600/200=13 but we may be missing some T1 mats.

Our algorithm must correctly model availability of each specific material.

---

**Plan file updated:** `.kilo/plans/TERRITORY_STANDING_OPTIMIZER.md` (this document)
