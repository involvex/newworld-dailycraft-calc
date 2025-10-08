export interface Item {
  id: string;
  name: string;
  iconId: string; // e.g. 'ingotprismatic' for correct icon fetching
  tier: number;
  type: string; // The primary type e.g., 'Legendary Resource'
  // New detailed properties
  weight: number;
  maxStack: number;
  types: string; // A descriptive string of all types
}

export interface Ingredient {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  itemId:string;
  ingredients: Ingredient[];
  baseYield: number; // How many items one craft makes
  category: 'Smelting' | 'Weaving' | 'Tanning' | 'Woodworking';
  isCooldown?: boolean; // Is this a daily cooldown recipe?
  // Fields for advanced yield calculation
  baseTier?: number;
  bonusItemChance?: number; // Base chance as a decimal, e.g., 0.02 for 2%
  bonusItemChanceIncrease?: string; // Comma-separated percentages for higher tier mats
  bonusItemChanceDecrease?: string; // Comma-separated percentages for lower tier mats
  craftAll?: boolean; // Can this recipe be crafted in bulk for yield bonus
  skipGrantItems?: boolean; // Does this recipe skip granting bonus items
  // XP data from CSV
  tradeskillXP?: number; // Base tradeskill XP gained per craft
  standingXP?: number; // Base standing XP gained per craft
}

export interface CraftingNodeData {
  id: string; // Unique ID for state management, e.g., 'ROOT>ASMODEUM'
  item: Item;
  quantity: number;
  totalQuantity: number;
  yieldBonus: number;
  children: CraftingNodeData[];
}

export interface RawMaterial {
  item: Item;
  quantity: number;
}

export interface XPSummary {
  category: string;
  tradeskillXP: number;
  standingXP: number;
  totalCrafts: number;
}

export interface CraftingSummary {
  materials: RawMaterial[];
  xpGains?: XPSummary[];
  title?: string;
}

export interface BonusConfiguration {
  skillLevel: number;
  gearBonus: number; // Stored as decimal, e.g. 0.10 for 10%
  fortActive: boolean;
}

export interface AllBonuses {
  [category: string]: BonusConfiguration;
}


export interface AnalyzedItem {
  itemName: string;
  quantity: number;
}

export interface ProcessedItem extends AnalyzedItem {
  price: number;
  totalValue: number;
  status: 'loading' | 'complete' | 'not_found';
}

export interface RawPriceData {
  item_id: string; 
  price: number;
}

export interface ServerInfo {
  id: string;
  name: string;
}

// A map where the key is the lowercase item ID and the value is the item's display name.
export type ItemDefinitionMap = Record<string, string>;


// Electron API types
declare global {
  interface Window {
    electronAPI?: {
      getDesktopSources: () => Promise<any[]>;
      runPSScript: (_scriptPath: string) => Promise<{ stdout: string; stderr: string; }>;
      readClipboardImage: () => Promise<string>;
      isDev: () => Promise<boolean>;
      onTriggerOCR: (_callback: () => void) => (() => void);
      onShowSettings: (_callback: () => void) => (() => void);
      onShowAbout: (_callback: () => void) => (() => void);
      exitApp: () => Promise<void>;
      closeApp: () => Promise<void>;
      config: {
        load: () => Promise<any>;
        save: (_config: any) => Promise<boolean>;
        getPath: () => Promise<string>;
        export: () => Promise<boolean>;
        import: () => Promise<any | false>;
        registerHotkeys: (_hotkeys: any) => Promise<boolean>;
      };
    };
  }
}

export interface Preset {
  name: string;
  items: { id: string; qty: number }[];
}

export interface GEMINI_API_KEY {
  GEMINI_API_KEY: string;
}

export interface Settings {
  viewMode: 'net' | 'gross';
  summaryMode: 'net' | 'gross';
  showAdvanced: boolean;
  debugOCRPreview: boolean;
  bonuses: AllBonuses;
}

export interface PriceData {
  itemName: string;
  price: number;
  lastUpdated: string;
  server: string;
}

export interface PriceConfig {
  enabled: boolean;
  priceType: 'buy' | 'sell';
  selectedServer: string;
  autoUpdate: boolean;
  updateInterval: number; // in hours
}

export interface Config {
  version: string;
  settings: Settings;
  hotkeys: {
    toggleCalculator: string;
    triggerOCR: string;
    openSettings: string;
  };
  customPresets: Preset[];
  inventory: Record<string, number>;
  selectedPreset: string;
  collapsedNodes: string[];
  GEMINI_API_KEY: string;
  prices: {
    config: PriceConfig;
    data: Record<string, PriceData>;
  };
  [key: string]: any;
}

// Re-export for useConfig.ts
export type ConfigData = Config;
