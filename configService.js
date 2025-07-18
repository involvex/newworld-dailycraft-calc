const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class ConfigService {
  constructor() {
    this.configDir = path.join(app.getPath('userData'), 'New World Crafting Calculator');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      version: '1.0.3',
      settings: {
        viewMode: 'net',
        summaryMode: 'net',
        showAdvanced: false,
        bonuses: {
          Smelting: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Leatherworking: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Weaving: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Woodworking: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Stonecutting: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Engineering: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Armoring: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Weaponsmithing: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Jewelcrafting: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Arcana: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Cooking: { skillLevel: 250, gearBonus: 10, fortActive: true },
          Furnishing: { skillLevel: 250, gearBonus: 10, fortActive: true }
        }
      },
      hotkeys: {
        toggleCalculator: 'CommandOrControl+Alt+I',
        triggerOCR: 'CommandOrControl+Alt+O',
        openSettings: 'CommandOrControl+,',
        exitApp: 'CommandOrControl+Q',
        toggleTreeExpansion: 'CommandOrControl+O',
        viewSummary: 'CommandOrControl+Alt+M',
        toggleViewMode: 'CommandOrControl+M'
      },
      customPresets: [],
      inventory: {},
      selectedPreset: '',
      collapsedNodes: []
    };
    this.ensureConfigDirectory();
  }

  ensureConfigDirectory() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
        console.log(`Created config directory: ${this.configDir}`);
      }
    } catch (error) {
      console.error('Error creating config directory:', error);
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const configData = fs.readFileSync(this.configFile, 'utf8');
        const config = JSON.parse(configData);
        // Merge with default config to ensure all properties exist
        return this.mergeWithDefaults(config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return { ...this.defaultConfig };
  }

  saveConfig(config) {
    try {
      // Ensure config directory exists
      this.ensureConfigDirectory();
      
      // Add version and timestamp
      const configToSave = {
        ...config,
        version: '1.0.3',
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.configFile, JSON.stringify(configToSave, null, 2), 'utf8');
      console.log(`Config saved to: ${this.configFile}`);
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  mergeWithDefaults(config) {
    const merged = { ...this.defaultConfig };
    
    // Deep merge settings
    if (config.settings) {
      merged.settings = { ...merged.settings, ...config.settings };
      if (config.settings.bonuses) {
        merged.settings.bonuses = { ...merged.settings.bonuses, ...config.settings.bonuses };
      }
    }
    
    // Merge other properties with new hotkeys
    merged.hotkeys = { ...merged.hotkeys, ...config.hotkeys };
    merged.customPresets = config.customPresets || [];
    merged.inventory = config.inventory || {};
    merged.selectedPreset = config.selectedPreset || '';
    merged.collapsedNodes = config.collapsedNodes || [];
    
    return merged;
  }

  getConfigPath() {
    return this.configFile;
  }

  exportConfig(exportPath) {
    try {
      const config = this.loadConfig();
      fs.writeFileSync(exportPath, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error exporting config:', error);
      return false;
    }
  }

  importConfig(importPath) {
    try {
      const configData = fs.readFileSync(importPath, 'utf8');
      const config = JSON.parse(configData);
      return this.saveConfig(config);
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  }
}

module.exports = ConfigService;
