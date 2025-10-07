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
  configState: ReturnType<typeof useConfig>;
}

export function SettingsModal({
  isOpen,
  onClose,
  onExportData,
  onImportData,
  onDeleteAllPresets,
  onEraseAllData,
  bonuses,
  onBonusChange,
  configState,
}: SettingsModalProps) {
  const { config, updateConfig, registerHotkeys, exportConfig, importConfig, getConfigPath, isElectron } = configState;
  const [hotkeys, setHotkeys] = useState(config?.hotkeys || {});
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (config) {
      setHotkeys(config.hotkeys || {});
      setApiKeyInput(config.GEMINI_API_KEY || '');
    }
  }, [config]); // Rerun whenever the config object changes

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleHotkeyChange = (key: keyof typeof hotkeys, value: string) => {
    setHotkeys(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveHotkeys = async () => {
    try {
      await updateConfig('hotkeys', hotkeys);
      if (isElectron) {
        await registerHotkeys(hotkeys);
      }
      showToast('Hotkeys updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to update hotkeys', 'error');
      console.error('Error updating hotkeys:', error);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await updateConfig('GEMINI_API_KEY', apiKeyInput);
      showToast('API Key saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save API Key', 'error');
      console.error('Error saving API key:', error);
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
          showToast('Configuration imported successfully! Reloading...', 'success');
          setTimeout(() => window.location.reload(), 1500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="flex-shrink-0 mb-4 text-2xl font-bold text-yellow-300">Settings</h2>
        
        {toast && (
          <div className={`mb-4 p-3 rounded-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {toast.message}
          </div>
        )}
        

          
        <div className="pr-2 space-y-6 overflow-y-auto">
                    {/* Global Hotkeys */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">Global Hotkeys</h3>
            {isElectron ? (
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Toggle Calculator</label>
                  <input
                    type="text"
                    value={hotkeys.toggleCalculator}
                    onChange={(e) => handleHotkeyChange('toggleCalculator', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                    placeholder="e.g., CommandOrControl+Alt+I"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Trigger OCR</label>
                  <input
                    type="text"
                    value={hotkeys.triggerOCR}
                    onChange={(e) => handleHotkeyChange('triggerOCR', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                    placeholder="e.g., CommandOrControl+Alt+O"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Open Settings</label>
                  <input
                    type="text"
                    value={hotkeys.openSettings}
                    onChange={(e) => handleHotkeyChange('openSettings', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                    placeholder="e.g., CommandOrControl+Alt+S"
                  />
                </div>
                <button onClick={handleSaveHotkeys} className="px-4 py-2 text-sm bg-green-600 rounded hover:bg-green-700">
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
            <br />
          </div>
          {/* API Key Config */}
          {isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Gemini API Key</h3>
              <p className="mb-2 text-xs text-gray-400">Required for the AI-powered OCR feature. Your key is stored encrypted on your local machine.</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-grow w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  placeholder="Enter your Gemini API Key"
                />
                <button onClick={handleSaveApiKey} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 whitespace-nowrap">
                  💾 Save Key
                </button>
              </div>
            </div>
          )}
          {!isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Gemini API Key</h3>
              <p className="mb-2 text-xs text-gray-400">Store APIKEY in browser storage.</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-grow w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  placeholder="Enter your Gemini API Key"
                />
                <button onClick={handleSaveApiKey} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 whitespace-nowrap">
                  💾 Save Key
                </button>
              </div>
            </div>
          )}
              
                        {/* Debug Settings */}
                        {isElectron && (
                          <div>
                            <h3 className="mb-2 text-lg font-semibold text-white">Debug Settings</h3>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50">
                              <input
                                type="checkbox"
                                id="debug-ocr-preview"
                                checked={config?.settings?.debugOCRPreview || false}
                                onChange={(e) => updateConfig('settings', { ...config.settings, debugOCRPreview: e.target.checked })}
                                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                              />
                              <label htmlFor="debug-ocr-preview" className="text-sm text-gray-300">Enable OCR Debug Preview</label>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">If enabled, the app will display the captured screenshot for inspection before sending it to the AI.</p>
                          </div>
                        )}
              
                        {/* Data Management */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">Data Management</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onExportData} className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500">
                💾 Export Data
              </button>
              <button onClick={onImportData} className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500">
                📁 Import Data
              </button>
              <button onClick={onDeleteAllPresets} className="px-3 py-1 text-sm bg-red-700 rounded hover:bg-red-600">
                🗑️ Delete Presets
              </button>
              <button onClick={onEraseAllData} className="px-3 py-1 text-sm bg-red-800 rounded hover:bg-red-700">
                🗑️ Erase All Data
              </button>
            </div>
          </div>

          {/* Bonus Settings */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">Bonus Settings</h3>
            {Object.entries(bonuses).map(([category, config]) => (
              <div key={category} className="p-4 mb-2 bg-gray-700 rounded">
                <h4 className="mb-2 font-bold text-white text-md">{category}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Skill Level</label>
                    <input
                      type="number"
                      aria-label={`${category} skill level`}
                      value={config.skillLevel}
                      onChange={(e) => onBonusChange(category, 'skillLevel', e.target.value)}
                      className="w-full px-2 py-1 text-white bg-gray-800 border border-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Gear Bonus (%)</label>
                    <input
                      type="number"
                      aria-label={`${category} gear bonus`}
                      value={config.gearBonus * 100}
                      onChange={(e) => onBonusChange(category, 'gearBonus', e.target.value)}
                      className="w-full px-2 py-1 text-white bg-gray-800 border border-gray-600 rounded"
                    />
                  </div>
                  <div className="flex items-center col-span-2">
                    <input
                      type="checkbox"
                      aria-label={`${category} fort active`}
                      checked={config.fortActive}
                      onChange={(e) => onBonusChange(category, 'fortActive', e.target.checked)}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label className="block ml-2 text-sm text-gray-300">Fort Bonus Active</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
                    {/* Debug Settings */}
          {isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">Debug Settings</h3>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50">
                <input
                  type="checkbox"
                  id="debug-ocr-preview"
                  checked={config?.settings?.debugOCRPreview || false}
                  onChange={(e) => updateConfig('settings', { ...config.settings, debugOCRPreview: e.target.checked })}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="debug-ocr-preview" className="text-sm text-gray-300">Enable OCR Debug Preview</label>
              </div>
              <p className="mt-1 text-xs text-gray-400">If enabled, the app will display the captured screenshot for inspection before sending it to the AI.</p>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="pt-4 mt-4 text-center border-t border-gray-600/30">
          <p className="mb-2 text-xs text-gray-400">💝 Enjoying the calculator? Support development on</p>
          <a 
            href="https://paypal.me/involvex" 
            className="text-xs text-blue-400 underline transition-all hover:text-blue-300 decoration-dotted hover:decoration-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            PayPal 💰 
          </a>
          
          <a 
            href="https://buymeacoffee.com/involvex" 
            className="text-xs text-blue-400 underline transition-all hover:text-blue-300 decoration-dotted hover:decoration-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buymeacoffee ☕ 
          </a>
          
          <a 
            href="https://github.com/sponsors/involvex" 
            className="text-xs text-blue-400 underline transition-all hover:text-blue-300 decoration-dotted hover:decoration-solid"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github Sponsors 💰
          </a>
        </div>

        <div className="flex flex-shrink-0 gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 font-bold text-white bg-yellow-600 rounded hover:bg-yellow-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
