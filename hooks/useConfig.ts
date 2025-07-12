import { useState, useEffect } from 'react';

interface ConfigData {
  bonuses: {
    cooking: number;
    arcana: number;
    armoring: number;
    engineering: number;
    furnishing: number;
    jewelcrafting: number;
    leatherworking: number;
    weaponsmithing: number;
    woodworking: number;
    stonecutting: number;
    weaving: number;
    smelting: number;
  };
  hotkeys: {
    toggleCalculator: string;
    triggerOCR: string;
    openSettings: string;
  };
  presets: Array<{
    id: string;
    name: string;
    selectedItems: Record<string, number>;
    bonuses: Record<string, number>;
    selectedIngredients: Record<string, string>;
  }>;
  inventory: Record<string, number>;
  ui: {
    theme: string;
    showTooltips: boolean;
    autoCollapse: boolean;
  };
}

export function useConfig() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in Electron environment
  const isElectron = () => {
    return typeof window !== 'undefined' && window.electronAPI;
  };

  // Load configuration
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isElectron() && window.electronAPI?.config) {
        const loadedConfig = await window.electronAPI.config.load();
        setConfig(loadedConfig);
      } else {
        // Fallback to localStorage for web version
        const savedData = localStorage.getItem('nw-crafting-config');
        if (savedData) {
          setConfig(JSON.parse(savedData));
        } else {
          // Set default config
          const defaultConfig: ConfigData = {
            bonuses: {
              cooking: 0,
              arcana: 0,
              armoring: 0,
              engineering: 0,
              furnishing: 0,
              jewelcrafting: 0,
              leatherworking: 0,
              weaponsmithing: 0,
              woodworking: 0,
              stonecutting: 0,
              weaving: 0,
              smelting: 0,
            },
            hotkeys: {
              toggleCalculator: 'CommandOrControl+Alt+I',
              triggerOCR: 'CommandOrControl+Alt+O',
              openSettings: 'CommandOrControl+Alt+S',
            },
            presets: [],
            inventory: {},
            ui: {
              theme: 'dark',
              showTooltips: true,
              autoCollapse: false,
            },
          };
          setConfig(defaultConfig);
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Save configuration
  const saveConfig = async (newConfig: ConfigData) => {
    try {
      setError(null);

      if (isElectron() && window.electronAPI?.config) {
        const success = await window.electronAPI.config.save(newConfig);
        if (success) {
          setConfig(newConfig);
        } else {
          throw new Error('Failed to save configuration to file');
        }
      } else {
        // Fallback to localStorage for web version
        localStorage.setItem('nw-crafting-config', JSON.stringify(newConfig));
        setConfig(newConfig);
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
      throw err;
    }
  };

  // Update specific config section
  const updateConfig = async (section: keyof ConfigData, data: any) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      [section]: { ...config[section], ...data }
    };

    await saveConfig(updatedConfig);
  };

  // Register hotkeys in Electron
  const registerHotkeys = async (hotkeys: ConfigData['hotkeys']) => {
    if (isElectron() && window.electronAPI?.config) {
      try {
        const success = await window.electronAPI.config.registerHotkeys(hotkeys);
        if (!success) {
          throw new Error('Failed to register hotkeys');
        }
      } catch (err) {
        console.error('Error registering hotkeys:', err);
        setError(err instanceof Error ? err.message : 'Failed to register hotkeys');
        throw err;
      }
    }
  };

  // Export configuration
  const exportConfig = async () => {
    if (isElectron() && window.electronAPI?.config) {
      try {
        const success = await window.electronAPI.config.export();
        return success;
      } catch (err) {
        console.error('Error exporting config:', err);
        setError(err instanceof Error ? err.message : 'Failed to export configuration');
        return false;
      }
    }
    return false;
  };

  // Import configuration
  const importConfig = async () => {
    if (isElectron() && window.electronAPI?.config) {
      try {
        const importedConfig = await window.electronAPI.config.import();
        if (importedConfig) {
          setConfig(importedConfig);
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error importing config:', err);
        setError(err instanceof Error ? err.message : 'Failed to import configuration');
        return false;
      }
    }
    return false;
  };

  // Get config file path
  const getConfigPath = async () => {
    if (isElectron() && window.electronAPI?.config) {
      try {
        return await window.electronAPI.config.getPath();
      } catch (err) {
        console.error('Error getting config path:', err);
        return null;
      }
    }
    return null;
  };

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

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
    getConfigPath,
    isElectron: isElectron(),
  };
}
