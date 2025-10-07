const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ENCRYPTION_KEY, IV } = require('./configEncryption'); // Import persistent key and IV

class ConfigService {
  constructor() {
    this.configDir = path.join(app.getPath('userData'), 'New World Crafting Calculator');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      version: '1.1.0',
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
        openSettings: 'CommandOrControl+,'
      },
      customPresets: [],
      inventory: {},
      selectedPreset: '',
      collapsedNodes: [],
      encryptedGeminiApiKey: '', // Store encrypted key here
      prices: {
        config: {
          enabled: false,
          priceType: 'sell',
          selectedServer: '',
          autoUpdate: false,
          updateInterval: 24,
        },
        data: {},
      },
    };
    this.ensureConfigDirectory();
  }

  ensureConfigDirectory() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating config directory:', error);
    }
  }

  encrypt(text) {
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return IV.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const configData = fs.readFileSync(this.configFile, 'utf8');
        const config = JSON.parse(configData);
        
        // Decrypt API key if present
        if (config.encryptedGeminiApiKey) {
          try {
            config.GEMINI_API_KEY = this.decrypt(config.encryptedGeminiApiKey);
          } catch (decryptError) {
            console.error('Error decrypting Gemini API Key:', decryptError);
            config.GEMINI_API_KEY = ''; // Clear invalid key
          }
        }
        return this.mergeWithDefaults(config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return { ...this.defaultConfig };
  }

  saveConfig(config) {
    try {
      this.ensureConfigDirectory();
      
      const configToSave = { ...config };

      // Encrypt API key before saving
      if (configToSave.GEMINI_API_KEY) {
        configToSave.encryptedGeminiApiKey = this.encrypt(configToSave.GEMINI_API_KEY);
        delete configToSave.GEMINI_API_KEY; // Remove plain text key
      } else {
        configToSave.encryptedGeminiApiKey = '';
      }

      // Add version and timestamp
      configToSave.version = this.defaultConfig.version; // Use default version
      configToSave.lastSaved = new Date().toISOString();
      
      fs.writeFileSync(this.configFile, JSON.stringify(configToSave, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  mergeWithDefaults(config) {
    const merged = { ...this.defaultConfig };

    if (config.settings) {
      merged.settings = { ...merged.settings, ...config.settings };
      if (config.settings.bonuses) {
        merged.settings.bonuses = { ...merged.settings.bonuses, ...config.settings.bonuses };
      }
    }

    merged.hotkeys = { ...merged.hotkeys, ...config.hotkeys };
    merged.customPresets = config.customPresets || [];
    merged.inventory = config.inventory || {};
    merged.selectedPreset = config.selectedPreset || '';
    merged.collapsedNodes = config.collapsedNodes || [];
    merged.GEMINI_API_KEY = config.GEMINI_API_KEY || ''; // Ensure decrypted key is merged

    // Handle prices configuration - merge with defaults
    if (config.prices) {
      merged.prices = {
        config: { ...merged.prices.config, ...config.prices.config },
        data: config.prices.data || {}
      };
    }

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
