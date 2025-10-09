# Data Update Guide

This guide explains how the New World Crafting Calculator loads item and recipe data, and how to update it.

## Data Source

The application now dynamically loads data from the **nw-buddy GitHub repository**:
https://github.com/giniedp/nw-buddy-data

## How Data Loading Works

### 1. Dynamic Data (Primary Source)

The app automatically fetches the latest data from nw-buddy's repository on startup:

- **Items**: Loaded from `javelindata_itemdefinitions_master_crafting.json` and `javelindata_gatherables.json`
- **Recipes**: Loaded from multiple trade skill files:
  - `javelindata_tradeskillsmelting.json` (Smelting recipes)
  - `javelindata_tradeskillweaving.json` (Weaving recipes)
  - `javelindata_tradeskillleatherworking.json` (Tanning/Leatherworking recipes)
  - `javelindata_tradeskillwoodworking.json` (Woodworking recipes)
  - `javelindata_tradeskillstonecutting.json` (Stonecutting recipes)

### 2. Static Data (Fallback & Override)

Static data in `data/items.ts` and `data/recipes.ts` serves two purposes:

- **Fallback**: If dynamic loading fails (no internet, API down), use static data
- **Override**: Static recipes override dynamic ones for quality control and corrections

## Updating Data

### Automatic Updates (Recommended)

Simply reload the application! The app fetches fresh data from nw-buddy on every startup.

### Manual Updates

If you need to update the static fallback data:

1. **Edit `services/dataService.ts`**:
   - Change `NW_BUDDY_BASE_URL` to use a specific commit hash for stability:

   ```typescript
   const NW_BUDDY_BASE_URL =
     "https://raw.githubusercontent.com/giniedp/nw-buddy-data/COMMIT_HASH/live/datatables";
   ```

2. **Update Static Items** (`data/items.ts`):
   - Add or modify items following the existing format
   - These will override dynamic data

3. **Update Static Recipes** (`data/recipes.ts`):
   - Add or modify recipes following the existing format
   - These will override dynamic data for better control

## Changing Data Strategy

### Use Latest Data (Current Setup)

```typescript
const NW_BUDDY_BASE_URL =
  "https://raw.githubusercontent.com/giniedp/nw-buddy-data/main/live/datatables";
```

✅ Always up-to-date  
❌ May break if nw-buddy updates their format

### Use Stable Data (Recommended for Production)

```typescript
const NW_BUDDY_BASE_URL =
  "https://raw.githubusercontent.com/giniedp/nw-buddy-data/COMMIT_HASH/live/datatables";
```

✅ Stable and predictable  
✅ Won't break unexpectedly  
❌ Requires manual updates to get new data

## Data Priority

The merging strategy is:

1. Dynamic data is loaded from nw-buddy
2. Static items override dynamic items (for corrections)
3. Static recipes override dynamic recipes (for quality control)

This ensures:

- Latest data is available automatically
- Manually corrected data takes priority
- Application works offline with fallback data

## Monitoring Data Loading

Check the browser console for data loading information:

```
🔄 Loading data from nw-buddy repository...
✅ Data loaded successfully: {
  totalItems: X,
  dynamicItems: Y,
  staticItems: Z,
  totalRecipes: A,
  ...
}
```

If loading fails, you'll see:

```
❌ Error loading dynamic data, using static fallback: [error details]
```

## Future Improvements

Potential enhancements:

- [ ] Add data caching with IndexedDB
- [ ] Add manual refresh button in Settings
- [ ] Add data version display in UI
- [ ] Add ability to switch between data sources
- [ ] Export data snapshots for offline use
