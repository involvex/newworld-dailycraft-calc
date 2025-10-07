const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- Encryption Settings ---
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'hex'); // 32-byte key
const IV_LENGTH = 16; // For AES, this is always 16

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
        debugOCRPreview: false,
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
      GEMINI_API_KEY: '' // Default empty value
    };
    this.ensureConfigDirectory();
  }

  encrypt(text) {
    if (!text) return '';
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      return ''; // Return empty string on failure
    }
  }

  decrypt(text) {
    if (!text) return '';
    try {
      const parts = text.split(':');
      if (parts.length !== 3) throw new Error('Invalid encrypted format');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];
      const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return ''; // Return empty string on failure, preventing app crash
    }
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
        // Decrypt API key if it exists
        if (config.GEMINI_API_KEY) {
          config.GEMINI_API_KEY = this.decrypt(config.GEMINI_API_KEY);
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
        configToSave.GEMINI_API_KEY = this.encrypt(configToSave.GEMINI_API_KEY);
      }

      configToSave.version = '1.0.4'; // Version bump
      configToSave.lastSaved = new Date().toISOString();
      
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
    
    // Merge other properties
    merged.hotkeys = { ...merged.hotkeys, ...config.hotkeys };
    merged.customPresets = config.customPresets || [];
    merged.inventory = config.inventory || {};
    merged.selectedPreset = config.selectedPreset || '';
    merged.collapsedNodes = config.collapsedNodes || [];
    // Crucially, preserve the loaded API key if it exists
    if (config.hasOwnProperty('GEMINI_API_KEY')) {
      merged.GEMINI_API_KEY = config.GEMINI_API_KEY;
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
