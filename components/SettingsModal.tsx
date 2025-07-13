import React, { useState, useEffect } from 'react';
import { AllBonuses, BonusConfiguration } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonuses: AllBonuses;
  onBonusChange: (category: string, field: keyof BonusConfiguration, value: string | boolean) => void;
  onExportData: () => void;
  onImportData: () => void;
  onDeleteAllPresets: () => void;
  onEraseAllData: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  bonuses,
  onBonusChange,
  onExportData,
  onImportData,
  onDeleteAllPresets,
  onEraseAllData,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'bonuses' | 'hotkeys' | 'data'>('bonuses');
  const [hotkeys, setHotkeys] = useState({
    toggleCalculator: 'CommandOrControl+Alt+I',
    triggerOCR: 'CommandOrControl+Alt+O',
    openSettings: 'CommandOrControl+,',
    exitApp: 'CommandOrControl+Q',
    toggleTreeExpansion: 'CommandOrControl+O',
    viewSummary: 'CommandOrControl+Alt+M',
    toggleViewMode: 'CommandOrControl+M'
  });
  const [hotkeyDescriptions] = useState({
    toggleCalculator: 'Show/Hide Calculator (Global)',
    triggerOCR: 'Trigger OCR Scan (Global)',
    openSettings: 'Open Settings (Global)',
    exitApp: 'Exit Application (Focused)',
    toggleTreeExpansion: 'Collapse/Expand Tree (Focused)',
    viewSummary: 'Scroll to Summary (Focused)',
    toggleViewMode: 'Toggle View Mode (Focused)'
  });

  // Load current hotkeys when modal opens
  useEffect(() => {
    if (isOpen && window.electronAPI?.config) {
      window.electronAPI.config.load().then((config: any) => {
        if (config.hotkeys) {
          setHotkeys(config.hotkeys);
        }
      });
    }
  }, [isOpen]);

  const handleHotkeyChange = (key: string, value: string) => {
    setHotkeys(prev => ({ ...prev, [key]: value }));
  };

  const saveHotkeys = async () => {
    if (window.electronAPI?.config) {
      try {
        const config = await window.electronAPI.config.load();
        config.hotkeys = hotkeys;
        await window.electronAPI.config.save(config);
        await window.electronAPI.config.registerHotkeys(hotkeys);
        // Show success message
      } catch (error) {
        console.error('Failed to save hotkeys:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600">
          <h2 className="text-2xl font-bold text-yellow-300">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-600">
          <button
            onClick={() => setActiveTab('bonuses')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'bonuses'
                ? 'text-yellow-300 border-b-2 border-yellow-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🎯 Yield Bonuses
          </button>
          <button
            onClick={() => setActiveTab('hotkeys')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'hotkeys'
                ? 'text-yellow-300 border-b-2 border-yellow-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ⌨️ Hotkeys
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'data'
                ? 'text-yellow-300 border-b-2 border-yellow-300'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            💾 Data Management
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'bonuses' && (
            <div className="space-y-6">
              <p className="text-gray-300">Configure your skill levels, gear bonuses, and territory fort buffs for accurate yield calculations.</p>
              
              {Object.entries(bonuses).map(([category, bonus]) => (
                <div key={category} className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Skill Level</label>
                      <input
                        type="number"
                        min="0"
                        max="250"
                        value={bonus.skillLevel}
                        onChange={(e) => onBonusChange(category, 'skillLevel', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Gear Bonus (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={Math.round(bonus.gearBonus * 100)}
                        onChange={(e) => onBonusChange(category, 'gearBonus', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center text-sm font-medium text-gray-300">
                        <input
                          type="checkbox"
                          checked={bonus.fortActive}
                          onChange={(e) => onBonusChange(category, 'fortActive', e.target.checked)}
                          className="mr-2 rounded"
                        />
                        Territory Fort Active
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'hotkeys' && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-2">ℹ️ Hotkey Types</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>Global:</strong> Work from anywhere, even when app is minimized</p>
                  <p><strong>Focused:</strong> Only work when the calculator window is active</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(hotkeys).map(([key, value]) => (
                  <div key={key} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{hotkeyDescriptions[key as keyof typeof hotkeyDescriptions]}</h4>
                        <p className="text-xs text-gray-400">
                          {key.includes('toggle') || key.includes('trigger') || key.includes('open') ? 'Global' : 'Focused Only'}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleHotkeyChange(key, e.target.value)}
                        placeholder="Ctrl+Key"
                        className="w-40 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white text-center font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="text-yellow-300 font-semibold mb-2">⚠️ Hotkey Format</h4>
                <p className="text-sm text-gray-300">
                  Use standard key combinations like: <code className="bg-gray-700 px-2 py-1 rounded">Ctrl+Shift+C</code>, <code className="bg-gray-700 px-2 py-1 rounded">Alt+F4</code>, etc.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveHotkeys}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  💾 Save Hotkeys
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <p className="text-gray-300">Manage your saved data, presets, and configuration.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={onExportData}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  📤 Export Data
                </button>
                <button
                  onClick={onImportData}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  📥 Import Data
                </button>
                <button
                  onClick={onDeleteAllPresets}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  🗑️ Delete All Presets
                </button>
                <button
                  onClick={onEraseAllData}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  ⚠️ Erase All Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-600">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
