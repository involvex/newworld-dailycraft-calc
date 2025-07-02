# New World Crafting Calculator

A comprehensive crafting calculator for Amazon's New World MMO with automatic inventory detection via OCR.

## Features

- **Crafting Tree Visualization** - Interactive tree showing all required materials
- **Yield Bonus Calculations** - Factor in skill levels, gear bonuses, and fort buffs
- **Inventory Management** - Track your current materials
- **Auto OCR Detection** - Screenshot your inventory/storage for automatic import
- **Buy Order Generation** - Calculate exactly what you need to purchase
- **XP Calculations** - See total tradeskill XP from crafting
- **Prismatic Materials** - Combined shopping lists for all prismatic items

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Select Item & Quantity** - Choose what you want to craft
2. **Set Bonuses** - Configure your skill levels and gear bonuses
3. **Import Inventory** - Use Auto OCR or manual import
4. **View Results** - See crafting tree and buy order

### OCR Features

- **Auto OCR** - Take screenshot of New World inventory/storage
- **Import OCR** - Manually paste OCR text
- Supports various text formats and OCR misreadings

## Technologies

- React + TypeScript
- Tailwind CSS
- Tesseract.js (OCR)
- New World game data