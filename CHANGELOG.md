# Changelog

All notable changes to the New World Crafting Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-09

### 🎉 MAJOR RELEASE - Complete Tradeskill Management System

This is a massive update that transforms the calculator into a complete tradeskill management platform with 10 game-changing features!

### ✨ Added - New Features

#### Tradeskill Calculator System

- **Recipe Search & Filter** - Real-time search and category filtering across 100+ recipes
- **Bulk Crafting Calculator** - Calculate materials for 1-10,000 crafts with consolidated requirements
- **Cost Optimizer** - Automatically find cheapest alternative materials with savings percentage
- **Skill Leveling Guide** - XP calculations and most efficient recipes by cost/XP ratio
- **Recipe Comparison** - Side-by-side comparison of up to 3 recipes with metrics
- **Export to CSV** - Export calculations and shopping lists with timestamp-based naming
- **Crafting Goals System** - Set target levels with visual progress bars and XP tracking
- **Material Shopping List** - Auto-generated from favorites with inventory comparison
- **Profit Calculator** - Calculate profit margins with color-coded profitability
- **AI Recipe Recommendations** - Smart suggestions based on skill, inventory, and efficiency

#### UI/UX Improvements

- Added light and dark theme support with smooth transitions
- Enhanced navbar with theme toggle and better navigation
- Applied glass-card effect to all section cards
- Improved button styling with hover effects
- Made navbar sticky with better responsive design
- Added 8-tab interface in Tradeskill Calculator

#### Technical Additions

- Created `TradeskillCalculatorV2` component (1,800+ lines)
- Added `services/tradeskillService.ts` with 6 calculation functions:
  - `calculateXPToLevel()` - Level progression calculations
  - `findCheapestAlternative()` - Material cost optimization
  - `calculateProfit()` - Profit margin calculations
  - `recommendRecipes()` - AI scoring algorithm
  - `checkAlternativeMaterials()` - Tier upgrade paths
  - Enhanced gear score and perk chance calculations
- Added VS Code debugging configurations (`.vscode/launch.json` and `.vscode/tasks.json`)
- Created 7 debug profiles for different debugging scenarios
- Added comprehensive build tasks

### 🔧 Changed

#### Type System Updates

- Extended `Recipe` type to support 6 new tradeskill categories:
  - Weaponsmithing
  - Armoring
  - Engineering
  - Jewelcrafting
  - Furnishing
  - Arcana
- Added recipe fields: `gearScore`, `requiredLevel`, `perkChances`, `isFavorite`

#### Configuration Updates

- Extended `DEFAULT_BONUSES` to include all 11 tradeskill categories
- Added favorite recipes persistence to localStorage
- Made `showPrices` state persistent across app restarts

#### Data Management

- Dynamic data loading from nw-buddy GitHub repository (from v1.9.0)
- Merged static and dynamic data with quality control fallbacks

### 🎨 Styling

- Updated `index.css` with CSS variables for theming
- Added theme-specific color palettes for light and dark modes
- Enhanced glass-card effects with backdrop filters
- Improved scrollbar styling for better UX
- Added shimmer animations

### 📊 Build & Performance

- Build size: 617KB minified (from 590KB - 4.6% increase)
- Gzip size: 146.58KB (from 141.57KB)
- Optimized with React.memo and useCallback
- Efficient filtering and sorting algorithms
- Lazy loading for large recipe lists

### 📝 Documentation

- Completely updated README.md with v2.0 features
- Added comprehensive usage examples
- Updated feature matrix
- Added development setup instructions
- Created CHANGELOG.md
- Updated version badges and links

### ⚠️ Breaking Changes

None - Fully backward compatible. Old `TradeskillCalculator` component still included.

---

## [1.9.0] - 2025-01-09

### ✨ Added

#### Initial Tradeskill Features

- Basic tradeskill calculator with gear score calculations
- Tradeskill XP and standing XP display
- Perk chance calculations (Legendary to Common)
- Material cost calculations with market price integration
- Favorite recipes functionality
- Direct NWDB.info links for all craftable items

#### UI Improvements

- Implemented light and dark theme support
- Enhanced navbar with theme toggle
- Improved section card styling
- Better button hierarchy and visual feedback

#### Technical

- Created initial `TradeskillCalculator` component
- Added `services/tradeskillService.ts`
- Extended Recipe type for tradeskill categories
- Updated DEFAULT_BONUSES configuration

### 🔧 Changed

- Made `showPrices` state persistent
- Applied theme-aware styling throughout app
- Improved glass-card effects

---

## [1.8.1] - Previous Release

### Features

- Crafting tree visualization with expand/collapse
- OCR inventory detection
- Preset management
- Multi-item support
- Yield bonus calculations
- Configuration persistence
- Global hotkeys (Desktop)
- System tray integration (Desktop)

---

## Development Notes

### Versioning Strategy

- **Major version (X.0.0)**: Breaking changes or major feature additions
- **Minor version (0.X.0)**: New features, no breaking changes
- **Patch version (0.0.X)**: Bug fixes and minor improvements

### Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full build and test cycle:
   ```bash
   npm run format
   npm run lint
   npm run build
   npm run build-all  # If Electron app is not running
   ```
4. Commit with semantic commit message
5. Create git tag: `git tag vX.Y.Z`
6. Push with tags: `git push origin main --tags`

### Links

- [GitHub Releases](https://github.com/involvex/newworld-dailycraft-calc/releases)
- [Live Demo](https://involvex.github.io/newworld-dailycraft-calc/)
- [Documentation](docs/documentation.html)
- [Issues](https://github.com/involvex/newworld-dailycraft-calc/issues)
