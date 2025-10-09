# 🎉 New World Crafting Calculator v2.0.0 - Complete Tradeskill Management System

## 🚀 MAJOR RELEASE - Game-Changing Update!

Version 2.0.0 transforms the New World Crafting Calculator into a **complete tradeskill management platform** with 10 powerful new features, beautiful light/dark themes, and comprehensive debugging support.

---

## ✨ What's New

### ⚔️ Complete Tradeskill Management System

This release introduces **8 specialized views** accessible via a tabbed interface:

#### 1. 🔍 **Recipe Search & Filter**
- Real-time search across 100+ tradeskill recipes
- Filter by category (Weaponsmithing, Armoring, Engineering, Jewelcrafting, Furnishing, Arcana)
- Favorite recipes with ⭐ for quick access
- Category-specific browsing

#### 2. 🔢 **Bulk Crafting Calculator**
- Calculate materials for 1-10,000 crafts
- Consolidated material requirements
- Total cost and XP projections
- Perfect for mass production planning

#### 3. 💡 **Cost Optimizer**
- Automatically finds cheapest alternative materials
- Shows percentage savings (e.g., "Save 15%!")
- Supports material tier upgrades (Iron → Asmodeum)
- Real-time price comparisons

#### 4. 📈 **Skill Leveling Guide**
- Calculate exact XP from current to target level (1-250)
- Top 10 most efficient recipes by cost/XP ratio
- Total materials and gold needed for goals
- Per-category leveling paths

#### 5. ⚖️ **Recipe Comparison**
- Side-by-side comparison of up to 3 recipes
- Compare gear score, XP, cost, and efficiency
- Visual highlighting of best options
- Cost per XP analysis

#### 6. 📥 **Export to CSV**
- One-click export of all calculations
- Shopping list export with inventory tracking
- Timestamp-based file naming
- Share with company members

#### 7. 🎯 **Crafting Goals System**
- Set target levels for each tradeskill
- Visual progress bars with percentage
- XP tracking to goal
- Persistent storage with custom notes

#### 8. 🛒 **Material Shopping List**
- Auto-generated from favorite recipes
- Shows needed vs. inventory quantities
- Highlights items to buy (❗)
- Total cost calculation

#### 9. 💰 **Profit Calculator**
- Calculate profit margins for all items
- Sort by highest profit/margin
- Color-coded profitable/unprofitable
- Trading post strategy planning

#### 10. 🌟 **AI-Powered Recommendations**
- Smart recipe suggestions based on:
  - Your skill levels
  - Available inventory
  - Cost efficiency (XP per gold)
  - Gear score potential
- Top 12 recommendations with scores

---

## 🎨 UI/UX Improvements

- **Light & Dark Themes** - Beautiful adaptive interface with smooth transitions
- **Enhanced Navbar** - Thicker, sticky navigation with theme toggle
- **Glass Card Effects** - Modern frosted glass design throughout
- **Improved Buttons** - Better hierarchy and visual feedback
- **Responsive Design** - Perfect on desktop and web
- **Theme Toggle** - Switch between light/dark modes instantly

---

## 🔧 Developer Experience

### VS Code Debugging Support
**NEW: Press F5 to debug!** 7 comprehensive debug configurations:

1. **🌐 Debug Web (Chrome)** - Web app with Chrome DevTools
2. **🌐 Debug Web (Edge)** - Web app with Edge DevTools
3. **⚡ Debug Electron (Main + Renderer)** - Full stack debugging
4. **🔧 Debug Electron (Main Only)** - Main process focused
5. **🎯 Attach to Electron Renderer** - Attach to running app
6. **📦 Debug Current File** - Quick file debugging
7. **🧪 Debug Tests** - Unit test debugging

**Features:**
- Full logging enabled (`DEBUG=*`)
- Source maps configured
- Async stack traces
- Skip node_internals
- Pre-launch tasks automated
- Integrated terminal output

---

## 📊 Technical Details

### New Components
- **TradeskillCalculatorV2** (1,819 lines) - Complete system with 8 sub-views
- **VS Code Configurations** - `.vscode/launch.json` and `tasks.json`

### New Services
Enhanced `tradeskillService.ts` with 6 calculation functions:
- `calculateXPToLevel()` - Level progression math
- `findCheapestAlternative()` - Material optimization
- `calculateProfit()` - Profit calculations
- `recommendRecipes()` - AI scoring algorithm
- `checkAlternativeMaterials()` - Tier upgrade paths
- `calculateGearScore()` & `calculatePerkChances()` - Item stats

### Type Extensions
- 6 new tradeskill categories added to Recipe type
- Support for gearScore, requiredLevel, perkChances
- Favorite recipes tracking

### Performance
- **Build Size**: 617KB minified (4.6% increase)
- **Gzip Size**: 146.58KB
- Optimized with React.memo and useCallback
- Efficient filtering/sorting algorithms
- Lazy loading for large lists

---

## 📚 Documentation

- ✅ Comprehensive README.md update
- ✅ New CHANGELOG.md with release history
- ✅ Updated feature matrix
- ✅ New usage examples and workflows
- ✅ Development setup instructions
- ✅ Debugging guide

---

## 🎮 Perfect For

- **Endgame Crafters** - Profit analysis and optimal crafting
- **Company Leaders** - Mass production and shopping lists
- **Power Levelers** - Efficient XP/cost ratio guides
- **Traders** - Profit margin calculations
- **Goal-Oriented Players** - Progress tracking
- **Casual Players** - Smart recommendations

---

## 🔄 Migration & Compatibility

**✅ Fully Backward Compatible** - No breaking changes!
- All existing features work exactly as before
- Old TradeskillCalculator component still available
- Settings and data preserved
- Presets and configurations maintained

---

## 🚀 Quick Start

### Desktop Users
1. Download `New World Crafting Calculator 2.0.0.exe`
2. Run and configure hotkeys
3. Navigate to **⚔️ Tradeskills** tab
4. Set your goals and start crafting!

### Web Users
1. Visit [https://involvex.github.io/newworld-dailycraft-calc/](https://involvex.github.io/newworld-dailycraft-calc/)
2. All v2.0 features work in-browser!
3. Export calculations to CSV

### Developers
1. Clone the repository
2. Run `npm install`
3. Press **F5** in VS Code to debug
4. Choose from 7 debug configurations

---

## 💡 Example Workflows

### Power Level Weaponsmithing
```
1. Open Skill Leveling Guide
2. Set current (150) → target (250)
3. View top 10 efficient recipes
4. Create crafting goal
5. Generate shopping list
6. Track progress with visual bar
```

### Profit Trading Strategy
```
1. Navigate to Profit Calculator
2. Sort by highest margin
3. Check material costs with optimizer
4. Export profitable recipes to CSV
5. Mark favorites for quick access
```

### Company Crafting Session
```
1. Set goals for all members
2. Use bulk calculator for consumables
3. Generate shopping list from favorites
4. Export to CSV and share
5. Track progress with XP goals
```

---

## 🐛 Bug Fixes

- Fixed summary list not updating with tree collapse state (from v1.9.0)
- Fixed TypeScript configuration for proper JSX recognition
- Resolved Prettier formatting issues
- Fixed Electron close button styling

---

## 📈 Statistics

- **Lines Added**: ~2,200+
- **New Components**: 9 (8 sub-views + main)
- **New Functions**: 6 calculation helpers
- **Debug Configurations**: 7 profiles
- **Build Tasks**: 7 automated tasks
- **Supported Tradeskills**: 11 (5 refining + 6 crafting)
- **Recipe Views**: 8 specialized tabs
- **Export Formats**: CSV with customization

---

## 🙏 Credits

Special thanks to:
- [nw-buddy.de](https://nw-buddy.de/) for game data reference
- [nwdb.info](https://nwdb.info/) for item data and images
- New World community for feedback and suggestions
- All contributors and users who make this project possible

---

## 📥 Downloads

**Desktop Application (Windows 10/11)**
- [Download v2.0.0 Portable .exe](https://github.com/involvex/newworld-dailycraft-calc/releases/download/v2.0.0/New-World-Crafting-Calculator-2.0.0.exe)
- No installation required
- Full feature access with global hotkeys
- 100MB disk space

**Web Application**
- [Launch Web App](https://involvex.github.io/newworld-dailycraft-calc/)
- Works in any modern browser
- All features except global hotkeys
- No download needed

---

## 🔗 Links

- 📖 [Full Documentation](https://github.com/involvex/newworld-dailycraft-calc#readme)
- 📝 [Changelog](https://github.com/involvex/newworld-dailycraft-calc/blob/main/CHANGELOG.md)
- 🐛 [Report Issues](https://github.com/involvex/newworld-dailycraft-calc/issues)
- 💬 [Discussions](https://github.com/involvex/newworld-dailycraft-calc/discussions)
- ⭐ [Star the Repo](https://github.com/involvex/newworld-dailycraft-calc)

---

## 💝 Support Development

If this tool has saved you time and gold, consider supporting:

[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=for-the-badge&logo=paypal)](https://paypal.me/involvex)

[☕ Buy me a coffee](https://buymeacoffee.com/involvex) • [💖 GitHub Sponsor](https://github.com/sponsors/involvex)

---

## 🎯 What's Next?

We're already working on v2.1 with:
- Recipe filtering by required skill level
- Crafting queue management
- Multi-character tracking
- Historical price trends
- Guild-wide shopping lists

**Stay tuned!** ⚡

---

<div align="center">

**Made with ❤️ for the New World Community**

[![Made with React](https://img.shields.io/badge/Made%20with-React-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![Powered by Electron](https://img.shields.io/badge/Powered%20by-Electron-47848f?style=flat-square&logo=electron)](https://electronjs.org/)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

_Licensed under MIT • v2.0.0 • January 2025_

</div>

