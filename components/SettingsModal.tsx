import { useState, useEffect } from 'react';
import { useConfig } from '../hooks/useConfig';
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
  const { config, updateConfig, registerHotkeys, exportConfig, importConfig, getConfigPath, isElectron } = useConfig();
  const [hotkeys, setHotkeys] = useState(config?.hotkeys || {
    toggleCalculator: 'CommandOrControl+Alt+I',
    triggerOCR: 'CommandOrControl+Alt+O',
    openSettings: 'CommandOrControl+Alt+S',
  });
  const [configPath, setConfigPath] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (config?.hotkeys) {
      setHotkeys(config.hotkeys);
    }
  }, [config]);

  useEffect(() => {
    if (isElectron && isOpen) {
      getConfigPath().then(path => {
        if (path) setConfigPath(path);
      });
    }
  }, [isOpen, isElectron, getConfigPath]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleHotkeyChange = (key: keyof typeof hotkeys, value: string) => {
    setHotkeys(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveHotkeys = async () => {
    try {
      if (isElectron) {
        await registerHotkeys(hotkeys);
      }
      await updateConfig('hotkeys', hotkeys);
      showToast('Hotkeys updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update hotkeys', 'error');
      console.error('Error updating hotkeys:', error);
    }
  };

  const handleExportConfig = async () => {
    try {
      if (isElectron) {
        const success = await exportConfig();
        if (success) {
          showToast('Configuration exported successfully!', 'success');
        } else {
          showToast('Export cancelled or failed', 'error');
        }
      } else {
        showToast('Export only available in desktop app', 'error');
      }
    } catch (error) {
      showToast('Failed to export configuration', 'error');
      console.error('Error exporting config:', error);
    }
  };

  const handleImportConfig = async () => {
    try {
      if (isElectron) {
        const success = await importConfig();
        if (success) {
          showToast('Configuration imported successfully!', 'success');
          // Reload page to apply imported settings
          window.location.reload();
        } else {
          showToast('Import cancelled or failed', 'error');
        }
      } else {
        showToast('Import only available in desktop app', 'error');
      }
    } catch (error) {
      showToast('Failed to import configuration', 'error');
      console.error('Error importing config:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex-shrink-0">Settings</h2>
        
        {toast && (
          <div className={`mb-4 p-3 rounded-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {toast.message}
          </div>
        )}

        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Configuration Management */}
          {isElectron && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Configuration Management</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={handleExportConfig} className="px-3 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700">
                  💾 Export Config
                </button>
                <button onClick={handleImportConfig} className="px-3 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700">
                  📁 Import Config
                </button>
              </div>
              {configPath && (
                <p className="text-xs text-gray-400">Config location: {configPath}</p>
              )}
            </div>
          )}

          {/* Global Hotkeys */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Global Hotkeys</h3>
            {isElectron ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Toggle Calculator</label>
                  <input
                    type="text"
                    value={hotkeys.toggleCalculator}
                    onChange={(e) => handleHotkeyChange('toggleCalculator', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g., CommandOrControl+Alt+I"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Trigger OCR</label>
                  <input
                    type="text"
                    value={hotkeys.triggerOCR}
                    onChange={(e) => handleHotkeyChange('triggerOCR', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g., CommandOrControl+Alt+O"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Open Settings</label>
                  <input
                    type="text"
                    value={hotkeys.openSettings}
                    onChange={(e) => handleHotkeyChange('openSettings', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    placeholder="e.g., CommandOrControl+Alt+S"
                  />
                </div>
                <button onClick={handleSaveHotkeys} className="px-4 py-2 bg-green-600 rounded text-sm hover:bg-green-700">
                  💾 Save Hotkeys
                </button>
                <div className="text-xs text-gray-400">
                  <p>Use modifiers: CommandOrControl, Alt, Shift, Super</p>
                  <p>Keys: A-Z, 0-9, F1-F12, Space, etc.</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                <p>Hotkeys only available in desktop app</p>
              </div>
            )}
          </div>

          {/* Data Management */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Data Management</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onExportData} className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500">
                💾 Export Data
              </button>
              <button onClick={onImportData} className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500">
                📁 Import Data
              </button>
              <button onClick={onDeleteAllPresets} className="px-3 py-1 bg-red-700 rounded text-sm hover:bg-red-600">
                🗑️ Delete Presets
              </button>
              <button onClick={onEraseAllData} className="px-3 py-1 bg-red-800 rounded text-sm hover:bg-red-700">
                🗑️ Erase All Data
              </button>
            </div>
          </div>

          {/* Bonus Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Bonus Settings</h3>
            {Object.entries(bonuses).map(([category, config]) => (
              <div key={category} className="p-4 bg-gray-700 rounded mb-2">
                <h4 className="font-bold text-md text-white mb-2">{category}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Skill Level</label>
                    <input
                      type="number"
                      aria-label={`${category} skill level`}
                      value={config.skillLevel}
                      onChange={(e) => onBonusChange(category, 'skillLevel', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Gear Bonus (%)</label>
                    <input
                      type="number"
                      aria-label={`${category} gear bonus`}
                      value={config.gearBonus * 100}
                      onChange={(e) => onBonusChange(category, 'gearBonus', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <input
                      type="checkbox"
                      aria-label={`${category} fort active`}
                      checked={config.fortActive}
                      onChange={(e) => onBonusChange(category, 'fortActive', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <label className="ml-2 block text-sm text-gray-300">Fort Bonus Active</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-4 pt-4 border-t border-gray-600/30 text-center">
          <p className="text-xs text-gray-400 mb-2">💝 Enjoying the calculator?</p>
          <a 
            href="https://paypal.me/involvex" 
            className="text-xs text-blue-400 hover:text-blue-300 underline decoration-dotted hover:decoration-solid transition-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support development ☕
          </a>
        </div>

        <div className="flex gap-2 mt-6 flex-shrink-0">
          <button onClick={onClose} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
