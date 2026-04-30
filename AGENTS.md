# AGENTS.md — Quick Context for AI Agents

## What Makes This Repo Unique (High-Signal Only)

- **Dual deployment**: Electron desktop app (.exe) + static web (GitHub Pages). Build artifacts: `dist/` (web) and `dist-electron/` (portable `.exe`).
- **Electron + React + Vite**: Dev runs Vite dev server; Electron loads from it in dev, from built files in prod.
- **Config encryption**: `configService.js` AES-256-GCM encrypts `GEMINI_API_KEY` at rest. Without valid key, OCR/AI features silently degrade.
- **Game data bundled**: All items/recipes in `data/` as TypeScript (not external API). Changes require rebuild for static export.
- **No unit tests**: Testing is manual/UI-based. CI runs lint/typecheck/build only.
- **OCR depends on Gemini**: `services/geminiService.ts` → Google GenAI. Requires `GEMINI_API_KEY` in config.
- **VS Code launch configs**: 7 debug profiles (`.vscode/launch.json`) cover web, Electron main, renderer, attach.

## High-Signal Commands & Workflows

### Local Development (Web)

```bash
npm run dev          # Vite dev server → http://localhost:3000
```

### Local Development (Electron + Web)

```bash
npm run electron:dev # Concurrent: Vite dev + Electron (auto-opens dev tools)
```

### Lint / Typecheck / Format

```bash
npm run lint         # ESLint
npm run lint:fix     # ESLint --fix
npm run format       # Prettier
npm run typecheck    # tsc --noEmit
```

### Build (Web → GitHub Pages)

```bash
npm run build:pages  # Builds to dist/, ready to copy to docs/
npm run deploy       # build:pages + copy dist/ → docs/
npm run push-pages   # deploy + commit + push docs/ to main
```

### Build (Electron Portable .exe)

```bash
npm run dist         # → dist-electron/New World Crafting Calculator vX.Y.Z.exe
```

### Full Build Pipeline (Web + Electron)

```bash
npm run build:all    # Web build → docs/ copy → portable .exe
```

### Release (Windows .exe)

```bash
# Via .github/workflows/build-and-release.yml
# workflow_dispatch with release_type: patch|minor|major
# Produces: dist-electron/New World Crafting Calculator vX.Y.Z.exe
```

## Directory Map (What Actually Matters)

```
src/                        # Thin React entry (App.tsx ~1300 lines)
components/                 # React UI (TradeskillCalculatorV2.tsx = v2 tradeskill)
services/                   # Core logic
  tradeskillService.ts      # Tradeskill calculations (v2)
  craftingService.ts        # Crafting trees
  nwCraftingCalcs.ts        # Yield bonuses
  geminiService.ts          # OCR via Gemini API
  dataService.ts            # Dynamic game data loading
  configService.js          # Encrypted config (Electron main)
  marketService.ts          # Price data
hooks/                      # React hooks
  useCraftingTree.ts        # Tree/summary calculations
  useInventoryOCR.ts        # OCR pipeline
  usePresets.ts             # Preset management
  useConfig.ts              # Config IPC wrapper
  useTreeCollapse.ts        # Tree collapse state
data/                       # items.ts, recipes.ts (bundled game data)
electron.js                 # Main process (hotkeys, tray, IPC, CSP)
preload.js                  # IPC bridge (window.electronAPI)
.vscode/launch.json         # 7 debug configs (Chrome, Edge, Electron)
package.json                # Bun scripts (prefer bun over npm)
```

## Common Actions (Copy-Paste)

```bash
# Start full dev (Electron + Web, hot reload)
npm run electron:dev

# Debug Electron main process in VS Code
# Launch config: "⚡ Debug Electron (Main + Renderer)"
#   (Requires preLaunchTask: "npm: dev" from tasks.json)

# Build portable .exe
npm run dist

# Build web for GitHub Pages
npm run push-pages

# Lint-fix + format + typecheck (pre-commit)
npm run lint:fix && npm run format && npm run typecheck

# Clean build artifacts manually (when needed)
rm -rf dist/ dist-electron/ docs/assets/ docs/index.html
```

## Configuration Gotchas

- **Encrypted GEMINI_API_KEY**: `configService.js` encrypts before save, decrypts on load. Manual edits require valid encryption or empty string.
- **Config location (Electron)**: `%APPDATA%/New World Crafting Calculator/config.json` (userData subdir on Windows)
- **No API key = no OCR**: Without `GEMINI_API_KEY` in config, OCR/AI features won't work (silent failure).
- **Default hotkeys**: `Ctrl/Cmd+Alt+I` (toggle), `Ctrl/Cmd+Alt+O` (OCR), `Ctrl/Cmd+,` (settings) — defined in `configService.js` defaults.

## CI/CD (.github/workflows)

- **lint.yml**: ESLint on push/PR (no build)
- **build-and-release.yml**: Web + Electron build + test (no test script) + release on workflow_dispatch
- **gemini-\*.yml**: AI triage/review automation
- No unit test framework. Validation is manual via UI.

## Framework & Toolchain Quirks

- **Bun**: `bun.lock` present. Prefer `bun` over `npm` for installs/scripts.
- **Vite + React 19 + TypeScript 5**: Strict mode (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
- **Tailwind 4 + Prettier + ESLint** (TypeScript + React plugins).
- **Electron 38**: Permissive CSP (allows inline/eval) for local file loading.
- **Tesseract.js 6 + @google/genai**: OCR client + Gemini backend.
- **No test framework**: `npm test` not defined. Testing via UI.
- **simple-server.js**: Minimal static server (manual testing only, not in builds).

## Key Integration Points

### OCR Pipeline

- `App.tsx` → `useInventoryOCR` hook → `services/geminiService.ts` (analyzeInventoryImage) → Gemini API
- Requires `GEMINI_API_KEY` in config
- Tesseract.js used for preprocessing; Gemini for text analysis

### Crafting Calculations

- `services/craftingService.ts` + `services/nwCraftingCalcs.ts`
- Core APIs: `calculateCraftingTree`, `aggregateRawMaterials`, `getCraftingYieldBonus`
- Consumed via `useCraftingTree` hook in `App.tsx`

### Data Loading

- `services/dataService.ts` → `loadDynamicData()` → sets items/recipes state in `App.tsx`
- All lookups use `ITEMS` and `RECIPES` maps (from dynamic load)

### Config Management

- `configService.js` (main process) ↔ `preload.js` IPC bridge ↔ `window.electronAPI` (renderer)
- `useConfig` hook wraps IPC calls for React state
- Encrypted fields: `GEMINI_API_KEY`

### Debugging

- `.vscode/launch.json`: Chrome/Edge/Electron configs
- PreLaunchTask `npm: dev` (background) always required
- `npm: dev` = Vite dev server (background task in tasks.json)

## Preserved from .clinerules/copilot-instructions.md

- Multi-item and single-item crafting flows both supported (`multiItems` state in App.tsx)
- Persistent state keys: `theme`, `collapsedNodes`, `selectedItemId`, `quantity`, `multiItems`, `summaryMode`, `viewMode`, `bonuses`, `inventory`, `selectedPreset`, `showPrices`, `favoriteRecipes`
- Add items/recipes: update `data/items.ts`, `data/recipes.ts`
- Change crafting logic: `services/craftingService.ts` or `services/nwCraftingCalcs.ts`
- Custom presets in `hooks/usePresets.ts`

## TL;DR Quickstart

```bash
# 1. Start dev (Electron + Web, hot reload)
npm run electron:dev

# 2. Debug via VS Code (launch.json configs)
#    Chrome/Edge for web, Electron configs for desktop

# 3. Build portable .exe
npm run dist

# 4. Deploy web to GitHub Pages
npm run push-pages

# 5. Pre-commit check
npm run lint:fix && npm run format && npm run typecheck
```

---

**Note**: This file intentionally omits generic software advice. All content is repo-specific and verified against the current codebase (v2.0.2).
