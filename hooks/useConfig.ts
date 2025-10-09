import { useState, useEffect } from "react";
import { ConfigData, PriceConfig, PriceData, AllBonuses } from "../types";

// Type for config stored in browser (without API key for security)
export interface StoredConfigData {
  hotkeys: {
    toggleCalculator: string;
    triggerOCR: string;
    openSettings: string;
  };
  // Add other config properties as needed
  [key: string]: any; // Allow other properties
}

const defaultConfig: ConfigData = {
  version: "1.7.0",
  GEMINI_API_KEY: "",
  hotkeys: {
    toggleCalculator: "CommandOrControl+Alt+I",
    triggerOCR: "CommandOrControl+Alt+O",
    openSettings: "CommandOrControl+Alt+S",
    quickNote: "CommandOrControl+Alt+Q"
  },
  settings: {
    viewMode: "net",
    summaryMode: "net",
    showAdvanced: false,
    debugOCRPreview: false,
    bonuses: {
      Smelting: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
      Weaving: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
      Tanning: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
      Woodworking: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
      Stonecutting: { skillLevel: 250, gearBonus: 0.1, fortActive: true }
    }
  },
  customPresets: [],
  inventory: {},
  selectedPreset: "",
  collapsedNodes: [],
  quickNotes: [],
  prices: {
    config: {
      enabled: false,
      priceType: "sell",
      selectedServer: "",
      autoUpdate: false,
      updateInterval: 24
    },
    data: {}
  }
};

export function useConfig() {
  const [config, setConfig] = useState<ConfigData>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isElectron = () => typeof window !== "undefined" && window.electronAPI;

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isElectron() && window.electronAPI?.config) {
        const loadedConfig = await window.electronAPI.config.load();
        setConfig(loadedConfig);
      } else {
        const savedData = localStorage.getItem("nw-crafting-config");
        const apiKey = localStorage.getItem("nw-crafting-gemini-api-key");
        if (savedData) {
          const parsedConfig = JSON.parse(savedData);
          // Add API key from separate storage if available
          if (apiKey) {
            parsedConfig.GEMINI_API_KEY = apiKey;
          }
          setConfig(parsedConfig);
        } else if (apiKey) {
          // If no main config but API key exists, create minimal config
          setConfig({ ...defaultConfig, GEMINI_API_KEY: apiKey });
        }
      }
    } catch (err) {
      console.error("Error loading config:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load configuration"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: ConfigData) => {
    try {
      setError(null);
      if (isElectron() && window.electronAPI?.config) {
        const success = await window.electronAPI.config.save(newConfig);
        if (!success) {
          throw new Error("Failed to save configuration to file");
        }
      } else {
        // Browser storage - save API key separately for security
        const { GEMINI_API_KEY, ...configToStore } = newConfig;
        if (GEMINI_API_KEY) {
          localStorage.setItem("nw-crafting-gemini-api-key", GEMINI_API_KEY);
        }
        localStorage.setItem(
          "nw-crafting-config",
          JSON.stringify(configToStore, null, 2)
        );
      }
    } catch (err) {
      console.error("Error saving config:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save configuration"
      );
      throw err;
    }
  };

  // Simplified update function for top-level keys
  const updateConfig = (key: keyof ConfigData, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const registerHotkeys = async (hotkeys: ConfigData["hotkeys"]) => {
    if (isElectron() && window.electronAPI?.config) {
      try {
        await window.electronAPI.config.registerHotkeys(hotkeys);
      } catch (err) {
        console.error("Error registering hotkeys:", err);
        setError(
          err instanceof Error ? err.message : "Failed to register hotkeys"
        );
      }
    }
  };

  const exportConfig = async () => {
    return isElectron() && window.electronAPI?.config
      ? window.electronAPI.config.export()
      : Promise.resolve(false);
  };

  const importConfig = async () => {
    if (isElectron() && window.electronAPI?.config) {
      const importedConfig = await window.electronAPI.config.import();
      if (importedConfig) {
        setConfig(importedConfig);
        return true;
      }
    }
    return false;
  };

  return {
    config,
    isLoading,
    error,
    loadConfig,
    saveConfig,
    updateConfig,
    registerHotkeys,
    exportConfig,
    importConfig,
    isElectron: isElectron()
  };
}
