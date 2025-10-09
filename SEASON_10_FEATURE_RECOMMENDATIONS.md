# 🌙 New World Season 10: Nighthaven - Feature Recommendations

## Overview
Season 10 Nighthaven (launching October 13, 2025) brings massive progression changes. This document outlines recommended features for the crafting calculator to stay current and valuable to players.

---

## 🎯 Priority 1: Critical Updates (Must Have)

### 1. **Gear Score 800 Support**
**Impact**: HIGH | **Effort**: MEDIUM
- Update max gear score from 700 → 800
- Adjust all gear score calculations in tradeskill service
- Update UI sliders and input validation
- Add visual indicators for 800 GS items (legendary tier)

**Implementation**:
```typescript
// Update constants.ts
export const MAX_GEAR_SCORE = 800; // From 700
export const MIN_GEAR_SCORE = 500;

// Update tradeskillService.ts calculateGearScore()
// Add tier indicators: 780-800 (Legendary), 760-779 (Epic), etc.
```

---

### 2. **Umbral Shard Calculator**
**Impact**: HIGH | **Effort**: MEDIUM
- Track Umbral Shard costs for upgrades (500 → 800)
- Weekly upgrade limit calculator (5 for 800, 10 for 790, 15 for 780)
- Shard accumulation planner (new cap: 4,000)
- Progress tracker showing shards needed vs. available

**UI Features**:
- Input current gear score and target gear score
- Display total shards needed
- Show weekly upgrade path (e.g., "Week 1: 5 upgrades, Week 2: 5 upgrades")
- Alert when approaching upgrade limits
- Shard inventory tracker

---

### 3. **Level 70 Cap Integration**
**Impact**: MEDIUM | **Effort**: LOW
- Update character level cap to 70
- Adjust XP calculations for new levels (65-70)
- Update attribute point calculations
- Tradeskill bonuses for level 70 characters

---

## 🔥 Priority 2: New Systems (High Value)

### 4. **Set Bonus Planner** ⭐ NEW SYSTEM
**Impact**: HIGH | **Effort**: HIGH
- Database of all armor set bonuses
- Visual set builder showing active bonuses
- 2-piece, 3-piece, 4-piece, 5-piece bonus tracking
- Mix & match set optimizer (best combination of sets)
- Export set builds to share with company members

**UI Layout**:
```
┌─────────────────────────────────────┐
│ 🛡️ Set Bonus Builder               │
├─────────────────────────────────────┤
│ Helmet:    [Nighthaven Set v]       │
│ Chest:     [Nighthaven Set v]       │ → 2/5 Active ✅
│ Gloves:    [Voidbent Set v]         │   +150 CON
│ Legs:      [Empty]                  │   +5% Phys Dmg
│ Boots:     [Empty]                  │
├─────────────────────────────────────┤
│ Active Bonuses:                     │
│ ✅ Nighthaven (2/5): +150 CON      │
│ ⏸️  Nighthaven (3/5): +5% Phys     │
│ ⏸️  Voidbent (2/5): Not active     │
└─────────────────────────────────────┘
```

---

### 5. **Perk Charm Socket Planner** ⭐ NEW SYSTEM
**Impact**: HIGH | **Effort**: HIGH
- 4 socket slots per item (Offensive, Defensive, Skill x2)
- Perk charm database with all effects
- Socket optimizer based on build type (DPS, Tank, Healer, Hybrid)
- Cost calculator for socketing charms
- Best-in-slot charm recommendations

**Charm Categories**:
- **Offensive**: Crit, Penetration, Empower
- **Defensive**: Fortify, Absorption, Resistances  
- **Skill**: Cooldown reduction, Resource cost, Duration

---

### 6. **Attribute System Overhaul**
**Impact**: MEDIUM | **Effort**: MEDIUM
- New simplified attribute calculator
- Loadout manager (save/load full attribute setups)
- Attribute preset templates:
  - Tank (300 CON focus)
  - DPS (300 STR/DEX split)
  - Mage (300 INT)
  - Healer (300 FOC)
  - Hybrid builds

**Features**:
- Quick swap between saved loadouts
- Compare loadout effectiveness
- Show breakpoints (e.g., 300 STR unlocks X bonus)

---

## 💎 Priority 3: Content Features (Nice to Have)

### 7. **Catacombs Preparation Planner**
**Impact**: MEDIUM | **Effort**: MEDIUM
- Recommended gear sets for Catacombs (3-player dungeon)
- Consumables calculator for procedural runs
- Boss encounter prep checklists
- Loot table tracker

---

### 8. **Isle of Night Raid Planner**
**Impact**: MEDIUM | **Effort**: MEDIUM
- 10-player raid material calculator
- Role assignment tool (2 tanks, 2 healers, 6 DPS)
- Company raid shopping list aggregator
- Boss strategy notes integration

---

### 9. **Material Upgrade Path Visualizer**
**Impact**: LOW | **Effort**: HIGH
- Interactive flowchart showing material upgrade paths
- Visual representation of T1 → T2 → T3 → T4 → T5 progression
- Highlight what you need to craft higher tiers
- "How to get X" reverse lookup

Example:
```
Iron Ore → Steel Ingot → Starmetal Ingot → Orichalcum Ingot → Asmodeum
   ↓           ↓              ↓                  ↓                ↓
 [Have]    [Need 2x]      [Need 1x]         [Need 3x]      [TARGET]
```

---

## 🚀 Priority 4: Quality of Life (Player Requested)

### 10. **Build Import/Export** 
**Impact**: MEDIUM | **Effort**: LOW
- Export complete builds as shareable codes
- Import builds from nwdb.info links
- Build library with tags (PvP, PvE, Solo, Group)
- Community build sharing integration

---

### 11. **Real-Time Market Price Integration**
**Impact**: HIGH | **Effort**: HIGH
- API integration with live trading post data
- Automatic price updates (if API available)
- Historical price trends (7-day, 30-day)
- Best server to buy/sell recommendations

---

### 12. **Mobile Companion View**
**Impact**: MEDIUM | **Effort**: HIGH
- Responsive mobile-optimized layout
- Quick lookup mode (search item → see requirements)
- Shopping list mobile app
- Push notifications for price alerts

---

### 13. **Crafting Session Tracker**
**Impact**: LOW | **Effort**: MEDIUM
- Track crafting sessions (start/stop timer)
- Log crafted items and XP gained
- Cost per session analysis
- Achievement tracker (milestones, records)

---

### 14. **Material Farming Routes**
**Impact**: LOW | **Effort**: HIGH
- Interactive map showing best farming locations
- Time-optimized routes for specific materials
- Node respawn timers
- Alternative farming suggestions

---

## 🔬 Priority 5: Advanced Features (Power Users)

### 15. **Build Optimizer Algorithm**
**Impact**: HIGH | **Effort**: VERY HIGH
- AI-powered build recommendations
- Multi-objective optimization:
  - Maximize DPS within budget
  - Maximize survivability within weight limit
  - Balance offense/defense for PvP
- Constraint solver for complex requirements

---

### 16. **Trading Post Arbitrage Calculator**
**Impact**: MEDIUM | **Effort**: MEDIUM
- Find profitable buy/craft/sell opportunities
- Server comparison (if multi-server data available)
- Timing recommendations (weekday vs. weekend prices)
- Risk assessment (market volatility)

---

### 17. **Company Crafting Coordinator**
**Impact**: MEDIUM | **Effort**: HIGH
- Multi-player shopping list merger
- Role assignment (who crafts what)
- Resource pooling calculator
- Progress dashboard for company projects

---

### 18. **Historical Build Archive**
**Impact**: LOW | **Effort**: MEDIUM
- Save builds from previous seasons
- "Remember when..." feature showing old meta builds
- Season-over-season comparison
- Legacy item database

---

## 📊 Implementation Roadmap

### Phase 1 (v2.1.0) - Critical Updates ⏰ 2 weeks
- Gear Score 800 support
- Umbral Shard calculator
- Level 70 integration
- Set Bonus database (basic)

### Phase 2 (v2.2.0) - New Systems ⏰ 4 weeks
- Set Bonus Planner (full UI)
- Perk Charm Socket Planner
- Attribute System overhaul
- Build Import/Export

### Phase 3 (v2.3.0) - Content & QoL ⏰ 3 weeks
- Catacombs/Raid planners
- Material Upgrade Visualizer
- Crafting Session Tracker
- Mobile optimization

### Phase 4 (v3.0.0) - Advanced ⏰ 6+ weeks
- Build Optimizer Algorithm
- Real-time Market Integration
- Company Coordinator
- Trading Post Arbitrage

---

## 🎯 Top 5 Recommendations (Quick Win + High Impact)

1. **Umbral Shard Calculator** - Immediate value, directly tied to S10 progression
2. **Set Bonus Planner** - Unique feature, no good alternatives exist
3. **Perk Charm Socket Planner** - New system, players will need this ASAP
4. **Build Import/Export** - Easy to implement, huge QoL improvement
5. **Gear Score 800 Update** - Table stakes, must have for S10

---

## 💡 Unique Differentiators (Stand Out Features)

These features would make your calculator THE go-to tool:

1. **Set Bonus Mix & Match Optimizer** - No other tool does this well
2. **Weekly Umbral Progression Planner** - Unique to S10's new system
3. **4-Socket Charm Build Tester** - Interactive, visual, comprehensive
4. **Company Raid Material Aggregator** - Social/multiplayer angle
5. **AI Build Recommender** - Cutting edge, attracts attention

---

## 📝 Notes

- **Data Sources**: Monitor nw-buddy.de for S10 data updates (sets, charms, GS changes)
- **Testing**: Request PTR (Public Test Realm) access to validate calculations before Oct 13
- **Community**: Reddit r/newworldgame and official forums for feedback
- **Competition**: Check nwdb.info, gaming.tools for feature gaps

---

## 🚦 Feature Scoring Matrix

| Feature | Impact | Effort | Priority | Users Want It |
|---------|--------|--------|----------|---------------|
| Gear Score 800 | 🔥🔥🔥 | ⚙️⚙️ | P1 | ⭐⭐⭐⭐⭐ |
| Umbral Calculator | 🔥🔥🔥 | ⚙️⚙️ | P1 | ⭐⭐⭐⭐⭐ |
| Set Bonus Planner | 🔥🔥🔥 | ⚙️⚙️⚙️ | P2 | ⭐⭐⭐⭐⭐ |
| Perk Charm Sockets | 🔥🔥🔥 | ⚙️⚙️⚙️ | P2 | ⭐⭐⭐⭐⭐ |
| Build Import/Export | 🔥🔥 | ⚙️ | P4 | ⭐⭐⭐⭐ |
| Market Integration | 🔥🔥🔥 | ⚙️⚙️⚙️⚙️ | P4 | ⭐⭐⭐⭐⭐ |
| Mobile App | 🔥🔥 | ⚙️⚙️⚙️⚙️ | P4 | ⭐⭐⭐ |
| Build Optimizer | 🔥🔥🔥 | ⚙️⚙️⚙️⚙️⚙️ | P5 | ⭐⭐⭐⭐ |

Legend: 🔥 = Impact | ⚙️ = Effort | ⭐ = Demand

---

**Created:** October 9, 2025  
**For:** New World Crafting Calculator v2.0.0  
**Season:** Nighthaven (S10) Launch Preparation

