# Copilot Instructions for New World Crafting Calculator

## Project Overview
- **Purpose:** Interactive crafting calculator for Amazon's New World MMO, with advanced features like crafting tree visualization, yield bonus calculations, inventory management, and OCR-based inventory import.
- **Tech Stack:** React + TypeScript (SPA), Tailwind CSS, Tesseract.js (OCR), Electron (for desktop), custom game data in TypeScript.

## Architecture & Data Flow
- **UI Components:**
  - Main entry: `App.tsx` (core state, data flow, modals, and UI logic)
  - Tree rendering: `components/CraftingNode.tsx`
  - Summary display: `components/SummaryList.tsx`
- **Services:**
  - Crafting logic: `services/craftingService.ts` (core tree/summary calculations)
  - Yield bonus math: `services/nwCraftingCalcs.ts`
- **Data:**
  - Items: `data/items.ts`
  - Recipes: `data/recipes.ts`
- **Types:** All shared types in `types.ts`.

## Key Patterns & Conventions
- **Crafting Calculation:**
  - Use `calculateCraftingTree` and `aggregateRawMaterials` for all material/summary calculations.
  - Yield bonuses are handled via `getCraftingYieldBonus` and passed as `bonuses` objects.
  - Multi-item and single-item flows are both supported (see `multiItems` state in `App.tsx`).
- **Inventory Import:**
  - OCR logic is in `App.tsx` (uses Tesseract.js, with preprocessing and postprocessing for accuracy).
  - Manual and OCR-based inventory entry both supported; see `parseInventoryOCR` and related UI state.
- **UI State:**
  - All persistent state (selected items, bonuses, inventory, etc.) is stored in `localStorage` for session persistence.
  - Modal dialogs are controlled by boolean state in `App.tsx` (e.g., `showSettings`, `showManualEntry`).
- **Data Model:**
  - Items and recipes are referenced by string IDs throughout; always use the `ITEMS` and `RECIPES` maps for lookups.
  - Ingredient substitutions (e.g., for `GEMSTONE_DUST`) are handled via `selectedIngredients` state and passed to calculation functions.

## Developer Workflows
- **Run Locally:**
  - `npm install` then `npm run dev` (Vite dev server, open http://localhost:3000)
- **Build Electron App:**
  - Use `build-all.js` or `build-portable.js` for desktop builds (see scripts for details).
- **No formal test suite** (as of July 2025); manual testing via UI is standard.

## Integration Points
- **OCR:** Tesseract.js is loaded in-browser; Electron integration uses `window.electronAPI` for desktop capture.
- **Game Data:** All item/recipe data is local TypeScript, not fetched from an API.
- **No backend/server required** for core functionality; `simple-server.js` is for static file serving only.

## Examples
- To add a new item or recipe: update `data/items.ts` and/or `data/recipes.ts`.
- To change crafting logic: edit `services/craftingService.ts` (tree, summary, or bonus logic).
- To add a new UI feature: start in `App.tsx` and factor reusable UI into `components/`.

---
For questions about unclear patterns or missing documentation, ask for clarification or check the README.

When done editing increase the version number in `package.json`.