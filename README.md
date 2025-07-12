<p align="center">
  <img src="logo.png" alt="Involvex Logo" />
</p>
<h1 align="center" style="font-family: 'UnifrakturCook', cursive; color: #e2b857; text-shadow: 2px 2px 8px #000, 0 0 8px #e2b85799; letter-spacing: 2px;">
  New World Crafting Calculator
</h1>
<p align="center"><b>A comprehensive crafting calculator for Amazon's New World MMO with automatic inventory detection via OCR.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-brightgreen" alt="Version 1.1.0" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Web-blue" alt="Platform Support" />
  <img src="https://img.shields.io/badge/tech-React%20%7C%20TypeScript%20%7C%20Electron-orange" alt="Technology Stack" />
</p>


## ✨ Features

- **Crafting Tree Visualization** – Interactive tree showing all required materials with expand/collapse controls
- **Yield Bonus Calculations** – Factor in skill levels, gear bonuses, and fort buffs for accurate yields
- **Advanced Inventory Management** – Track your current materials with smart import/export
- **OCR Inventory Detection** – Screenshot your in-game inventory/storage for automatic import
- **Customizable Global Hotkeys** – Set personalized keyboard shortcuts for quick access
- **AppData Configuration System** – Persistent settings with backup/restore functionality
- **Preset Management** – Save and load crafting configurations for quick access
- **Buy Order Generation** – Calculate exactly what you need to purchase
- **XP Calculations** – See total tradeskill XP and standing gains from crafting
- **Multi-Item Crafting** – Plan complex crafting sessions with multiple items
- **Real-time Material Tracking** – Net vs Gross material calculations
- **Context Menu Actions** – Right-click nodes for expand/collapse/remove options
- **Toast Notifications** – Clear feedback for all user actions
- **Cross-Platform Support** – Available as desktop app (Electron) and web version

---

## � Installation Options

### 🖥️ **Desktop Application (Recommended)**
- Download the latest `.exe` from [Releases](https://github.com/involvex/newworld-dailycraft-calc/releases)
- **Features:** Full configuration system, customizable hotkeys, AppData persistence
- **Platform:** Windows x64 (portable executable)

### 🌐 **Web Version**
- Access online: [https://involvex.github.io/newworld-dailycraft-calc/](https://involvex.github.io/newworld-dailycraft-calc/)
- **Features:** Core functionality with localStorage persistence
- **Platform:** Any modern web browser

### 📊 **Feature Comparison**

| Feature | Desktop App | Web Version |
|---------|-------------|-------------|
| Crafting Tree & Calculations | ✅ | ✅ |
| OCR Inventory Detection | ✅ | ✅ |
| Preset Management | ✅ | ✅ |
| Customizable Hotkeys | ✅ | ❌ |
| AppData Configuration | ✅ | ❌ |
| Config Import/Export | ✅ | ❌ |
| Background Operation | ✅ | ❌ |
| Auto-Updates | ✅ | ✅ |

## �🚀 Run Locally

<details>
<summary><b>Show Setup Instructions</b></summary>

**Prerequisites:** Node.js

```bash
npm install
npm run dev
# Open http://localhost:3000
```

</details>

---

## 🕹️ Usage

### Quick Start
1. **Select Item & Quantity** – Choose what you want to craft and set the desired quantity
2. **Configure Settings** – Set your skill levels, gear bonuses, and fort status for each tradeskill
3. **Import Inventory** – Use OCR screenshot capture or manual entry to import your materials
4. **View Results** – Explore the crafting tree and review material requirements

### Advanced Features

#### 🔧 **Configuration System** (Desktop App)
- **Customizable Hotkeys** – Personalize keyboard shortcuts for calculator toggle, OCR capture, and settings
- **Settings Persistence** – All configurations saved to AppData folder and survive app updates
- **Import/Export Config** – Backup and restore your complete settings and preferences
- **Cross-Session Sync** – Your settings are automatically restored when you restart the app

#### 📋 **Preset Management**
- **Save Crafting Plans** – Create presets for frequently crafted item combinations
- **Quick Load** – Instantly restore complex multi-item crafting scenarios
- **Preset Categories** – Organize presets by crafting type or purpose

#### 🖼️ **OCR Features**
- **Smart Screenshot OCR** – Automatically detect and parse New World inventory screens
- **Manual Text Entry** – Import inventory data from external sources or manual typing
- **Format Flexibility** – Supports various text formats and handles OCR recognition errors
- **Real-time Preview** – Review and edit OCR results before applying to inventory

#### 🌳 **Interactive Crafting Tree**
- **Expand/Collapse Controls** – Navigate complex crafting trees with ease
- **Context Menu Actions** – Right-click nodes for quick expand/collapse/remove operations
- **Visual Material Flow** – Clear visualization of ingredient relationships and quantities

---

## 🛠️ Technologies

- **Frontend:** React 19.1.0 + TypeScript 5.8.3
- **Styling:** Tailwind CSS 4.1.11
- **Build Tool:** Vite 7.0.4
- **Desktop App:** Electron 37.2.1
- **OCR Engine:** Tesseract.js 6.0.1
- **Configuration:** AppData storage with JSON persistence
- **Game Data:** Static TypeScript definitions for New World items/recipes

---

## 🏅 Credits

- <b>Author:</b> Involvex
- <b>Based on:</b> [nw-buddy.de](https://nw-buddy.de/)
- <b>Images from:</b> [nwdb.info](https://nwdb.info/)

---
## 📝 Development Status

### ✅ **Completed Features**
- ✅ AppData configuration system with persistent storage
- ✅ Customizable global hotkeys for desktop app
- ✅ Advanced preset management with import/export
- ✅ Toast notifications and user feedback system
- ✅ Interactive crafting tree with context menus
- ✅ OCR inventory detection with smart parsing
- ✅ Multi-item crafting support
- ✅ Comprehensive settings modal with all configurations

### 🚧 **Planned Improvements**
- � Enhanced OCR accuracy and better text recognition algorithms
- 📱 Mobile-responsive design optimization
- 🌐 Internationalization and multi-language support
- 📊 Advanced crafting cost analysis with price tracking
- 🎨 Additional themes and UI customization options
- 🔒 Cloud sync for settings and presets across devices
- 📈 Crafting efficiency analytics and recommendations 

