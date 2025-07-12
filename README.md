# New World Crafting Calculator

![Project Logo](logo.png)

**A comprehensive crafting calculator for Amazon's New World MMO with automatic inventory detection via OCR**

[![Version](https://img.shields.io/github/package-json/v/involvex/newworld-dailycraft-calc?label=version&style=for-the-badge)](https://github.com/involvex/newworld-dailycraft-calc/blob/main/package.json)
[![Downloads](https://img.shields.io/github/downloads/involvex/newworld-dailycraft-calc/total?style=for-the-badge&color=brightgreen)](https://github.com/involvex/newworld-dailycraft-calc/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Web-blue?style=for-the-badge)](#installation)
[![License](https://img.shields.io/github/license/involvex/newworld-dailycraft-calc?style=for-the-badge)](LICENSE)

[🚀 **Try Live Demo**](https://involvex.github.io/newworld-dailycraft-calc/) • [📥 **Download Desktop App**](https://github.com/involvex/newworld-dailycraft-calc/releases/latest) • [📖 **Documentation**](docs/documentation.html) • [🐛 **Report Issues**](https://github.com/involvex/newworld-dailycraft-calc/issues)

</div>

---

## 🎯 Overview

The **New World Crafting Calculator** is a sophisticated tool designed to streamline your crafting experience in Amazon's New World MMO. Whether you're planning complex gear upgrades or optimizing resource gathering, this calculator provides everything you need with advanced features like OCR inventory scanning, customizable hotkeys, and persistent configuration management.

### 🎮 **Perfect for:**
- **Endgame Crafters** planning expensive gear upgrades
- **Company Leaders** organizing crafting sessions
- **Casual Players** optimizing resource usage
- **Traders** calculating material costs and profits

---

## ✨ Core Features

<details>
<summary><b>🌳 Advanced Crafting System</b></summary>

- **Interactive Tree Visualization** – Navigate complex crafting hierarchies with expandable nodes
- **Yield Bonus Integration** – Factor in skill levels, gear bonuses, and territory buffs
- **Multi-Item Planning** – Plan entire gear sets or multiple items simultaneously
- **Real-time Calculations** – Instant updates as you modify quantities or bonuses
- **Context Actions** – Right-click nodes for quick expand/collapse/remove operations

</details>

<details>
<summary><b>📸 Intelligent OCR Technology</b></summary>

- **Auto-Screenshot Capture** – Scan your in-game inventory with a single hotkey
- **Smart Text Recognition** – Advanced parsing handles OCR errors and variations
- **Multiple Input Methods** – Screenshot capture, manual text entry, or clipboard import
- **Real-time Preview** – Review and edit OCR results before applying changes
- **Cross-Storage Support** – Works with inventory, storage sheds, and company storage

</details>

<details>
<summary><b>⚡ Desktop Power Features</b></summary>

- **Global Hotkeys** – Customizable keyboard shortcuts work from anywhere
- **System Tray Integration** – Quick access without cluttering your taskbar
- **AppData Persistence** – Settings survive updates and system changes
- **Configuration Backup** – Import/export complete settings for sharing or backup
- **Background Operation** – Runs silently until you need it

</details>

<details>
<summary><b>🎛️ Smart Configuration</b></summary>

- **Preset Management** – Save complex crafting scenarios for instant recall
- **Skill Profiles** – Multiple character configurations with different skill levels
- **Bonus Tracking** – Gear, food, and territory buff management
- **Material Substitution** – Handle gemstone dust and other interchangeable materials
- **Toast Notifications** – Clear feedback for all actions and updates

</details>

---

## 📥 Installation

### 🖥️ **Desktop Application** *(Recommended)*

**Latest Release:** [Download v1.1.1](https://github.com/involvex/newworld-dailycraft-calc/releases/latest)

```bash
# No installation required - portable executable
1. Download "New World Crafting Calculator 1.1.1.exe"
2. Run the executable
3. Configure hotkeys in Settings (default: Ctrl+Shift+C to toggle)
```

**System Requirements:**
- Windows 10/11 (x64)
- 100MB free disk space
- Screen capture permissions for OCR

### 🌐 **Web Application**

**Live Demo:** [https://involvex.github.io/newworld-dailycraft-calc/](https://involvex.github.io/newworld-dailycraft-calc/)

```bash
# Works in any modern browser
✅ Chrome/Edge (recommended)
✅ Firefox  
✅ Safari
```

### 📊 **Feature Matrix**

| Feature | Desktop App | Web Version |
|---------|:-----------:|:-----------:|
| **Core Functionality** |
| Crafting Tree & Calculations | ✅ | ✅ |
| Yield Bonus Calculations | ✅ | ✅ |
| Multi-Item Support | ✅ | ✅ |
| **Advanced Features** |
| OCR Inventory Detection | ✅ | ✅ |
| Preset Management | ✅ | ✅ |
| Configuration Persistence | ✅ | ⚠️ *localStorage* |
| **Desktop Exclusive** |
| Global Hotkeys | ✅ | ❌ |
| System Tray Integration | ✅ | ❌ |
| Background Operation | ✅ | ❌ |
| Config Import/Export | ✅ | ❌ |
| Auto-Updates | ✅ | ✅ |

---

## 🚀 Quick Start

### For Desktop Users

1. **Download & Launch** – Get the latest `.exe` from releases
2. **Set Hotkeys** – Configure your preferred shortcuts in Settings
3. **First OCR** – Press `Ctrl+Shift+S` to capture your inventory
4. **Start Crafting** – Select an item and see the magic happen!

### For Web Users

1. **Open Browser** – Visit the [live demo](https://involvex.github.io/newworld-dailycraft-calc/)
2. **Allow Permissions** – Enable screen capture for OCR functionality  
3. **Import Inventory** – Use the OCR button or manual text entry
4. **Calculate Away** – All features work in-browser!

---

## 🛠️ Technology Stack

<div align="center">

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend** | React + TypeScript | 19.1.0 + 5.8.3 |
| **Styling** | Tailwind CSS | 4.1.11 |
| **Build System** | Vite | 7.0.4 |
| **Desktop Runtime** | Electron | 37.2.1 |
| **OCR Engine** | Tesseract.js | 6.0.1 |
| **Configuration** | JSON + FileSystem | Native |

</div>

**Security Features:**
- Context isolation enabled
- No remote code execution
- Local-only data processing
- Secure permission handling

---

## 💡 Usage Examples

### 📋 **Planning a Void Gauntlet**

```
1. Select "Void Gauntlet" from item list
2. Set quantity to 1, desired gear score
3. Configure your Arcana skill level and bonuses
4. OCR scan your arcane repository storage
5. View crafting tree and buy order for missing materials
```

### 🏰 **Company Crafting Session**

```
1. Create preset for "Daily Crafting Goals"
2. Add multiple items (tools, consumables, gear)
3. Export configuration to share with company members
4. Import individual inventory scans
5. Generate consolidated material shopping list
```

### ⚡ **Speed Crafting Workflow**

```
1. Set global hotkey for instant OCR (Ctrl+Shift+S)
2. Keep calculator in system tray
3. Quick-scan inventory between crafting sessions
4. Use presets for common crafting goals
5. Track XP gains and material efficiency
```

---

## 🔧 Development

<details>
<summary><b>Local Development Setup</b></summary>

```bash
# Clone repository
git clone https://github.com/involvex/newworld-dailycraft-calc.git
cd newworld-dailycraft-calc

# Install dependencies
npm install

# Development commands
npm run dev          # Start web dev server
npm run electron-dev # Start Electron in dev mode
npm run build        # Build web version
npm run dist         # Build Electron app
npm run build-all    # Build everything
```

**Project Structure:**
```
├── src/             # React components and styles
├── data/            # Game data (items, recipes)
├── services/        # Configuration and utility services
├── hooks/           # Custom React hooks
├── components/      # Reusable UI components
├── electron.js      # Electron main process
├── preload.js       # Secure context bridge
└── docs/            # Documentation and GitHub Pages
```

</details>

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- 🐛 **Report Bugs** – [Open an issue](https://github.com/involvex/newworld-dailycraft-calc/issues)
- 💡 **Suggest Features** – Share your ideas for improvements
- 🔧 **Submit PRs** – Code improvements and bug fixes
- 📖 **Improve Docs** – Help make the documentation better
- 🌟 **Star the Repo** – Show your support!

---

## 💝 Support Development

If this tool has saved you time and made your New World experience better, consider supporting its development:

<div align="center">

[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=for-the-badge&logo=paypal)](https://paypal.me/involvex)

**Your support helps:**
- ⚡ Faster development cycles
- 🔧 Better OCR accuracy
- 📱 Mobile optimization
- 🌐 Server hosting costs

*Every contribution makes a difference!* 🙏

</div>

---

## � Support & Community

- **🐛 Bug Reports:** [GitHub Issues](https://github.com/involvex/newworld-dailycraft-calc/issues)
- **💬 Discussions:** [GitHub Discussions](https://github.com/involvex/newworld-dailycraft-calc/discussions)
- **📖 Documentation:** [Full Docs](docs/documentation.html)
- **🔒 Security:** [Security Policy](SECURITY.md)

---

## 🏆 Credits & Acknowledgments

<div align="center">

**Created with ❤️ by [Involvex](https://github.com/involvex)**

**Special Thanks:**
- [nw-buddy.de](https://nw-buddy.de/) – Inspiration and game data reference
- [nwdb.info](https://nwdb.info/) – Item images and additional data
- New World community – Feedback and feature suggestions

</div>

---

<div align="center">

**[⭐ Star this repository](https://github.com/involvex/newworld-dailycraft-calc/stargazers)** if it helped you craft better!

[![Made with React](https://img.shields.io/badge/Made%20with-React-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![Powered by Electron](https://img.shields.io/badge/Powered%20by-Electron-47848f?style=flat-square&logo=electron)](https://electronjs.org/)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

*New World Crafting Calculator v1.1.1 • Licensed under MIT • Made for the New World community*

</div> 

