import { useState, useEffect, useRef } from "react";
import { useConfig } from "../hooks/useConfig";
import {
  AllBonuses,
  BonusConfiguration,
  PriceConfig,
  ServerInfo
} from "../types";
import { fetchPricesByItemName } from "../services/marketService";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonuses: AllBonuses;
  onBonusChange: (
    _category: string,
    _field: keyof BonusConfiguration,
    _value: string | boolean
  ) => void;
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
  configState
}: SettingsModalProps) {
  const {
    config,
    updateConfig,
    registerHotkeys,
    exportConfig,
    importConfig,
    isElectron
  } = configState;
  const [hotkeys, setHotkeys] = useState(config?.hotkeys || {});
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [priceConfig, setPriceConfig] = useState<PriceConfig>(
    config?.prices?.config || {
      enabled: false,
      priceType: "sell",
      selectedServer: "",
      autoUpdate: false,
      updateInterval: 24
    }
  );
  const [availableServers, setAvailableServers] = useState<ServerInfo[]>([]);
  const [isImportingPrices, setIsImportingPrices] = useState(false);
  const [recordingHotkey, setRecordingHotkey] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<Set<string>>(new Set());
  const [hotkeyVersions, setHotkeyVersions] = useState<{
    [key: string]: number;
  }>({
    toggleCalculator: 0,
    triggerOCR: 0,
    openSettings: 0,
    quickNote: 0
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const currentRecordedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (config) {
      setHotkeys(config.hotkeys || {});
      setApiKeyInput(config.GEMINI_API_KEY || "");
      setPriceConfig(
        config.prices?.config || {
          enabled: false,
          priceType: "sell",
          selectedServer: "", // Default to empty string to match config defaults
          autoUpdate: false,
          updateInterval: 24
        }
      );
    }
  }, [config]); // Rerun whenever the config object changes

  // Price config is now only saved when user explicitly clicks "Save Config" button
  // This prevents flickering and infinite loops

  // Load available servers on component mount
  useEffect(() => {
    const loadServers = async () => {
      // Only attempt to load servers if we're in Electron
      if (!isElectron) {
        setAvailableServers([
          { id: "nysa", name: "Nysa" },
          { id: "other", name: "Other servers available in desktop app" }
        ]);
        return;
      }

      try {
        const { fetchServers } = await import("../services/marketService");
        const servers = await fetchServers();
        setAvailableServers(servers);
      } catch (error) {
        console.error("Failed to load servers:", error);
        // Set a default server list for when API is unavailable
        setAvailableServers([
          { id: "nysa", name: "Nysa" },
          { id: "other", name: "Other servers available in desktop app" }
        ]);
      }
    };

    // Only run if isElectron is properly defined
    if (typeof isElectron !== "undefined") {
      loadServers();
    } else {
      // Fallback for browser environment
      setAvailableServers([
        { id: "nysa", name: "Nysa" },
        { id: "other", name: "Other servers available in desktop app" }
      ]);
    }
  }, [isElectron]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Format key combination for display
  const formatKeyCombo = (keys: Set<string>): string => {
    const sortedKeys = Array.from(keys).sort((a, b) => {
      // Prioritize modifier keys
      const modifiers = ["CommandOrControl", "Alt", "Shift", "Super"];
      const aIndex = modifiers.indexOf(a);
      const bIndex = modifiers.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.join("+");
  };

  // Start recording a hotkey
  const startRecording = (hotkeyType: string) => {
    console.log("Starting recording for:", hotkeyType);
    setRecordingHotkey(hotkeyType);
    setRecordedKeys(new Set());

    // Test if event listener will work
    const testHandler = (e: KeyboardEvent) => {
      console.log("TEST HANDLER - Key pressed:", e.key);
    };

    document.addEventListener("keydown", testHandler, true);
    setTimeout(() => {
      document.removeEventListener("keydown", testHandler, true);
      console.log("Test handler removed");
    }, 100);
  };

  // Stop recording and save the hotkey
  const stopRecording = () => {
    if (recordingHotkey && recordedKeys.size > 0) {
      const formattedCombo = formatKeyCombo(recordedKeys);
      console.log(
        "Recording hotkey:",
        recordingHotkey,
        "with keys:",
        formattedCombo
      );

      // Update specific hotkey properties and increment version to force re-render
      setHotkeys(prev => {
        const updated = { ...prev };
        if (recordingHotkey === "toggleCalculator") {
          updated.toggleCalculator = formattedCombo;
        } else if (recordingHotkey === "triggerOCR") {
          updated.triggerOCR = formattedCombo;
        } else if (recordingHotkey === "openSettings") {
          updated.openSettings = formattedCombo;
        } else if (recordingHotkey === "quickNote") {
          updated.quickNote = formattedCombo;
        }
        console.log("Updated hotkeys state:", updated);
        return updated;
      });

      setHotkeyVersions(prev => {
        const updated = { ...prev };
        if (recordingHotkey === "toggleCalculator") {
          updated.toggleCalculator = prev.toggleCalculator + 1;
        } else if (recordingHotkey === "triggerOCR") {
          updated.triggerOCR = prev.triggerOCR + 1;
        } else if (recordingHotkey === "openSettings") {
          updated.openSettings = prev.openSettings + 1;
        } else if (recordingHotkey === "quickNote") {
          updated.quickNote = prev.quickNote + 1;
        }
        console.log("Updated hotkey versions:", updated);
        return updated;
      });

      // Force component re-render to ensure input fields update
      setForceUpdate(prev => prev + 1);

      showToast(`Hotkey recorded: ${formattedCombo}`, "success");
      console.log("Toast should show for:", formattedCombo);
    } else {
      console.log("No hotkey to record or no keys captured");
    }
    setRecordingHotkey(null);
    setRecordedKeys(new Set());
  };

  // Handle keydown events during recording
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(
        "Key pressed:",
        event.key,
        "Code:",
        event.code,
        "Ctrl:",
        event.ctrlKey,
        "Alt:",
        event.altKey,
        "Shift:",
        event.shiftKey,
        "Meta:",
        event.metaKey
      );

      if (!recordingHotkey) {
        console.log("No recording hotkey set, ignoring key");
        return;
      }

      console.log("Recording hotkey:", recordingHotkey, "processing key event");

      event.preventDefault();
      event.stopPropagation();

      // Handle modifier keys
      const currentModifiers = new Set<string>();
      if (event.ctrlKey) currentModifiers.add("CommandOrControl");
      if (event.altKey) currentModifiers.add("Alt");
      if (event.shiftKey) currentModifiers.add("Shift");
      if (event.metaKey) currentModifiers.add("Super");

      // Handle regular keys - simplified logic
      let keyName = event.key;

      // Basic key mapping
      if (keyName === " ") {
        keyName = "Space";
      } else if (keyName.length === 1) {
        keyName = keyName.toUpperCase();
      } else if (keyName.startsWith("F") && keyName.length <= 3) {
        keyName = keyName.toUpperCase();
      } else if (/^\d$/.test(keyName)) {
        keyName = `Digit${keyName}`;
      } else {
        // Map special keys using event.code for better compatibility
        const codeMap: { [key: string]: string } = {
          Escape: "ESCAPE",
          Enter: "RETURN",
          Tab: "TAB",
          Delete: "DELETE",
          Backspace: "BACKSPACE",
          ArrowUp: "UP",
          ArrowDown: "DOWN",
          ArrowLeft: "LEFT",
          ArrowRight: "RIGHT",
          Home: "HOME",
          End: "END",
          PageUp: "PAGEUP",
          PageDown: "PAGEDOWN"
        };
        keyName = codeMap[event.code] || event.code;
      }

      // Combine modifiers and key
      const allKeys = new Set([...currentModifiers, keyName]);
      console.log("Setting recorded keys:", Array.from(allKeys));

      // Update both ref (synchronous) and state (for React)
      currentRecordedKeysRef.current = allKeys;
      setRecordedKeys(allKeys);

      // Use longer delay and check ref for synchronous access
      setTimeout(() => {
        console.log("Auto-stopping recording after timeout");
        console.log("Current recordedKeys size:", recordedKeys.size);
        console.log("Current ref size:", currentRecordedKeysRef.current.size);

        // Use ref for immediate access to avoid race conditions
        if (recordingHotkey && currentRecordedKeysRef.current.size > 0) {
          const formattedCombo = formatKeyCombo(currentRecordedKeysRef.current);
          console.log(
            "Recording hotkey from ref:",
            recordingHotkey,
            "with keys:",
            formattedCombo
          );

          // Update specific hotkey properties and increment version to force re-render
          setHotkeys(prev => {
            const updated = { ...prev };
            if (recordingHotkey === "toggleCalculator") {
              updated.toggleCalculator = formattedCombo;
            } else if (recordingHotkey === "triggerOCR") {
              updated.triggerOCR = formattedCombo;
            } else if (recordingHotkey === "openSettings") {
              updated.openSettings = formattedCombo;
            } else if (recordingHotkey === "quickNote") {
              updated.quickNote = formattedCombo;
            }
            console.log("Updated hotkeys state:", updated);
            return updated;
          });

          setHotkeyVersions(prev => {
            const updated = { ...prev };
            if (recordingHotkey === "toggleCalculator") {
              updated.toggleCalculator = prev.toggleCalculator + 1;
            } else if (recordingHotkey === "triggerOCR") {
              updated.triggerOCR = prev.triggerOCR + 1;
            } else if (recordingHotkey === "openSettings") {
              updated.openSettings = prev.openSettings + 1;
            } else if (recordingHotkey === "quickNote") {
              updated.quickNote = prev.quickNote + 1;
            }
            console.log("Updated hotkey versions:", updated);
            return updated;
          });

          // Force component re-render to ensure input fields update
          setForceUpdate(prev => prev + 1);

          showToast(`Hotkey recorded: ${formattedCombo}`, "success");
          console.log("Toast should show for:", formattedCombo);
        } else {
          console.log("No hotkey to record or no keys captured");
        }
        setRecordingHotkey(null);
        setRecordedKeys(new Set());
        currentRecordedKeysRef.current.clear();
      }, 1500);
    };

    if (recordingHotkey) {
      console.log("Adding keydown event listener for recording");
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        console.log("Removing keydown event listener");
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [recordingHotkey]);

  const handleSaveHotkeys = async () => {
    try {
      await updateConfig("hotkeys", hotkeys);
      if (isElectron) {
        await registerHotkeys(hotkeys);
      }
      showToast("Hotkeys updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update hotkeys", "error");
      console.error("Error updating hotkeys:", error);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await updateConfig("GEMINI_API_KEY", apiKeyInput);
      showToast("API Key saved successfully!", "success");
    } catch (error) {
      showToast("Failed to save API Key", "error");
      console.error("Error saving API key:", error);
    }
  };

  const handleExportConfig = async () => {
    try {
      if (isElectron) {
        const success = await exportConfig();
        if (success) {
          showToast("Configuration exported successfully!", "success");
        } else {
          showToast("Export cancelled or failed", "error");
        }
      } else {
        showToast("Export only available in desktop app", "error");
      }
    } catch (error) {
      showToast("Failed to export configuration", "error");
    }
  };

  const handleImportConfig = async () => {
    try {
      if (isElectron) {
        const success = await importConfig();
        if (success) {
          showToast(
            "Configuration imported successfully! Reloading...",
            "success"
          );
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast("Import cancelled or failed", "error");
        }
      } else {
        showToast("Import only available in desktop app", "error");
      }
    } catch (error) {
      showToast("Failed to import configuration", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="flex-shrink-0 mb-4 text-2xl font-bold text-yellow-300">
          Settings
        </h2>

        {toast && (
          <div
            className={`mb-4 p-3 rounded-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white`}
          >
            {toast.message}
          </div>
        )}

        {/* Global Hotkeys */}
        <div className="pr-2 space-y-6 overflow-y-auto">
          {isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Global Hotkeys
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Toggle Calculator
                  </label>
                  <div className="flex gap-2">
                    <input
                      key={`toggleCalculator-${hotkeyVersions.toggleCalculator}`}
                      type="text"
                      value={hotkeys.toggleCalculator || ""}
                      className={`flex-1 px-3 py-2 text-sm text-white bg-gray-700 border rounded ${
                        recordingHotkey === "toggleCalculator"
                          ? "border-yellow-400 bg-yellow-900/20"
                          : "border-gray-600"
                      }`}
                      placeholder="e.g., CommandOrControl+Alt+I"
                      readOnly
                    />
                    <button
                      onClick={() =>
                        recordingHotkey === "toggleCalculator"
                          ? stopRecording()
                          : startRecording("toggleCalculator")
                      }
                      className={`px-3 py-2 text-sm font-semibold rounded transition-colors ${
                        recordingHotkey === "toggleCalculator"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {recordingHotkey === "toggleCalculator"
                        ? "⏹️ Stop"
                        : "🎬 Record"}
                    </button>
                  </div>
                  {recordingHotkey === "toggleCalculator" && (
                    <div className="mt-1 text-sm text-yellow-400">
                      Press your desired key combination...{" "}
                      {recordedKeys.size > 0 && (
                        <span className="px-2 py-1 ml-2 font-mono bg-gray-600 rounded">
                          {formatKeyCombo(recordedKeys)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Trigger OCR
                  </label>
                  <div className="flex gap-2">
                    <input
                      key={`triggerOCR-${hotkeyVersions.triggerOCR}`}
                      type="text"
                      value={hotkeys.triggerOCR || ""}
                      className={`flex-1 px-3 py-2 text-sm text-white bg-gray-700 border rounded ${
                        recordingHotkey === "triggerOCR"
                          ? "border-yellow-400 bg-yellow-900/20"
                          : "border-gray-600"
                      }`}
                      placeholder="e.g., CommandOrControl+Alt+O"
                      readOnly
                    />
                    <button
                      onClick={() =>
                        recordingHotkey === "triggerOCR"
                          ? stopRecording()
                          : startRecording("triggerOCR")
                      }
                      // onChange={
                      //   (e) => stopRecording.toString()  === 'triggerOCR' ?  hotkeys.triggerOCR : e.currentTarget.value}
                      className={`px-3 py-2 text-sm font-semibold rounded transition-colors ${
                        recordingHotkey === "triggerOCR"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {recordingHotkey === "triggerOCR"
                        ? "⏹️ Stop"
                        : "🎬 Record"}
                    </button>
                  </div>
                  {recordingHotkey === "triggerOCR" && (
                    <div className="mt-1 text-sm text-yellow-400">
                      Press your desired key combination...{" "}
                      {recordedKeys.size > 0 && (
                        <span className="px-2 py-1 ml-2 font-mono bg-gray-600 rounded">
                          {formatKeyCombo(recordedKeys)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Open Settings
                  </label>
                  <div className="flex gap-2">
                    <input
                      key={`openSettings-${hotkeyVersions.openSettings}`}
                      type="text"
                      value={hotkeys.openSettings || ""}
                      className={`flex-1 px-3 py-2 text-sm text-white bg-gray-700 border rounded ${
                        recordingHotkey === "openSettings"
                          ? "border-yellow-400 bg-yellow-900/20"
                          : "border-gray-600"
                      }`}
                      placeholder="e.g., CommandOrControl+Alt+S"
                      readOnly
                    />
                    <button
                      onClick={() =>
                        recordingHotkey === "openSettings"
                          ? stopRecording()
                          : startRecording("openSettings")
                      }
                      className={`px-3 py-2 text-sm font-semibold rounded transition-colors ${
                        recordingHotkey === "openSettings"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {recordingHotkey === "openSettings"
                        ? "⏹️ Stop"
                        : "🎬 Record"}
                    </button>
                  </div>
                  {recordingHotkey === "openSettings" && (
                    <div className="mt-1 text-sm text-yellow-400">
                      Press your desired key combination...{" "}
                      {recordedKeys.size > 0 && (
                        <span className="px-2 py-1 ml-2 font-mono bg-gray-600 rounded">
                          {formatKeyCombo(recordedKeys)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">
                    Quick Note
                  </label>
                  <div className="flex gap-2">
                    <input
                      key={`quickNote-${hotkeyVersions.quickNote}`}
                      type="text"
                      value={hotkeys.quickNote || ""}
                      className={`flex-1 px-3 py-2 text-sm text-white bg-gray-700 border rounded ${
                        recordingHotkey === "quickNote"
                          ? "border-yellow-400 bg-yellow-900/20"
                          : "border-gray-600"
                      }`}
                      placeholder="e.g., CommandOrControl+Alt+Q"
                      readOnly
                    />
                    <button
                      onClick={() =>
                        recordingHotkey === "quickNote"
                          ? stopRecording()
                          : startRecording("quickNote")
                      }
                      className={`px-3 py-2 text-sm font-semibold rounded transition-colors ${
                        recordingHotkey === "quickNote"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {recordingHotkey === "quickNote"
                        ? "⏹️ Stop"
                        : "🎬 Record"}
                    </button>
                  </div>
                  {recordingHotkey === "quickNote" && (
                    <div className="mt-1 text-sm text-yellow-400">
                      Press your desired key combination...{" "}
                      {recordedKeys.size > 0 && (
                        <span className="px-2 py-1 ml-2 font-mono bg-gray-600 rounded">
                          {formatKeyCombo(recordedKeys)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveHotkeys}
                  className="px-4 py-2 text-sm bg-green-600 rounded hover:bg-green-700"
                >
                  💾 Save Hotkeys
                </button>
                <div className="text-xs text-gray-400">
                  <p>Use modifiers: CommandOrControl, Alt, Shift, Super</p>
                  <p>Keys: A-Z, 0-9, F1-F12, Space, etc.</p>
                </div>
              </div>
            </div>
          )}

          {/* API Key Config */}
          {isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Gemini API Key
              </h3>
              <p className="mb-2 text-xs text-gray-400">
                Required for the AI-powered OCR feature. Your key is stored
                encrypted on your local machine.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  className="flex-grow w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  placeholder="Enter your Gemini API Key"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 whitespace-nowrap"
                >
                  💾 Save Key
                </button>
              </div>
            </div>
          )}
          {!isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Gemini API Key
              </h3>
              <p className="mb-2 text-xs text-gray-400">
                Store APIKEY in browser storage.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  className="flex-grow w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded"
                  placeholder="Enter your Gemini API Key"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700 whitespace-nowrap"
                >
                  💾 Save Key
                </button>
              </div>
            </div>
          )}

          {/* Debug Settings */}
          {isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Debug Settings
              </h3>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50">
                <input
                  type="checkbox"
                  id="debug-ocr-preview"
                  checked={config?.settings?.debugOCRPreview || false}
                  onChange={e =>
                    updateConfig("settings", {
                      ...config.settings,
                      debugOCRPreview: e.target.checked
                    })
                  }
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label
                  htmlFor="debug-ocr-preview"
                  className="text-sm text-gray-300"
                >
                  Enable OCR Debug Preview
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                If enabled, the app will display the captured screenshot for
                inspection before sending it to the AI.
              </p>
            </div>
          )}

          {/* Data Management */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Data Management
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportData}
                className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
              >
                💾 Export Data
              </button>
              <button
                onClick={onImportData}
                className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500"
              >
                📁 Import Data
              </button>
              <button
                onClick={onDeleteAllPresets}
                className="px-3 py-1 text-sm bg-red-700 rounded hover:bg-red-600"
              >
                🗑️ Delete Presets
              </button>
              <button
                onClick={onEraseAllData}
                className="px-3 py-1 text-sm bg-red-800 rounded hover:bg-red-700"
              >
                🗑️ Erase All Data
              </button>
            </div>
          </div>

          {/* Bonus Settings */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Bonus Settings
            </h3>
            {Object.entries(bonuses).map(([category, config]) => (
              <div key={category} className="p-4 mb-2 bg-gray-700 rounded">
                <h4 className="mb-2 font-bold text-white text-md">
                  {category}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Skill Level
                    </label>
                    <input
                      type="number"
                      aria-label={`${category} skill level`}
                      value={config.skillLevel}
                      onChange={e =>
                        onBonusChange(category, "skillLevel", e.target.value)
                      }
                      className="w-full px-2 py-1 text-white bg-gray-800 border border-gray-600 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Gear Bonus (%)
                    </label>
                    <input
                      type="number"
                      aria-label={`${category} gear bonus`}
                      value={config.gearBonus * 100}
                      onChange={e =>
                        onBonusChange(category, "gearBonus", e.target.value)
                      }
                      className="w-full px-2 py-1 text-white bg-gray-800 border border-gray-600 rounded"
                    />
                  </div>
                  <div className="flex items-center col-span-2">
                    <input
                      type="checkbox"
                      aria-label={`${category} fort active`}
                      checked={config.fortActive}
                      onChange={e =>
                        onBonusChange(category, "fortActive", e.target.checked)
                      }
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label className="block ml-2 text-sm text-gray-300">
                      Fort Bonus Active
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Configuration */}
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              💰 Price Configuration
            </h3>
            <div className="p-4 mb-2 bg-gray-700 rounded">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enable-prices"
                    checked={priceConfig.enabled}
                    onChange={e =>
                      setPriceConfig(prev => ({
                        ...prev,
                        enabled: e.target.checked
                      }))
                    }
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <label
                    htmlFor="enable-prices"
                    className="text-sm text-gray-300"
                  >
                    Enable Price Display
                  </label>
                </div>

                {priceConfig.enabled && (
                  <>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-300">
                        Price Type
                      </label>
                      <select
                        title="price type"
                        value={priceConfig.priceType}
                        onChange={e =>
                          setPriceConfig(prev => ({
                            ...prev,
                            priceType: e.target.value as "buy" | "sell"
                          }))
                        }
                        className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded"
                      >
                        <option value="sell">💰 Sell Price</option>
                        <option value="buy">🛒 Buy Price</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-300">
                        Server
                      </label>
                      <select
                        title="server"
                        value={priceConfig.selectedServer}
                        onChange={e =>
                          setPriceConfig(prev => ({
                            ...prev,
                            selectedServer: e.target.value
                          }))
                        }
                        className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded"
                      >
                        <option value="">Select a server...</option>
                        {availableServers.map(server => (
                          <option key={server.id} value={server.name}>
                            {server.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!priceConfig.selectedServer) {
                            showToast("Please select a server first", "error");
                            return;
                          }

                          if (!isElectron) {
                            showToast(
                              "Price import is only available in the desktop Electron app",
                              "error"
                            );
                            return;
                          }

                          setIsImportingPrices(true);
                          try {
                            const priceMap = await fetchPricesByItemName(
                              priceConfig.selectedServer
                            );
                            const priceData: Record<string, any> = {};

                            for (const [
                              itemName,
                              price
                            ] of priceMap.entries()) {
                              priceData[itemName] = {
                                itemName,
                                price,
                                lastUpdated: new Date().toISOString(),
                                server: priceConfig.selectedServer
                              };
                            }

                            await updateConfig("prices", {
                              config: priceConfig,
                              data: priceData
                            });
                            console.log(
                              `Successfully imported prices for ${priceMap.size} items!`
                            );
                            showToast(
                              `Successfully imported prices for ${priceMap.size} items!`,
                              "success"
                            );
                          } catch (error) {
                            console.error("Error importing prices:", error);
                            const errorMessage =
                              error instanceof Error
                                ? error.message
                                : "Unknown error occurred";
                            showToast(
                              `Failed to import prices: ${errorMessage}`,
                              "error"
                            );
                          } finally {
                            setIsImportingPrices(false);
                          }
                        }}
                        disabled={
                          isImportingPrices ||
                          !priceConfig.selectedServer ||
                          !isElectron
                        }
                        className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-600"
                      >
                        {isImportingPrices
                          ? "⏳ Importing..."
                          : !isElectron
                            ? "💻 Desktop Only"
                            : "📥 Import Prices"}
                      </button>

                      <button
                        onClick={async () => {
                          await updateConfig("prices", {
                            config: priceConfig,
                            data: config?.prices?.data || {}
                          });
                          showToast("Price configuration saved!", "success");
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        💾 Save Config
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="auto-update"
                          checked={priceConfig.autoUpdate}
                          onChange={e =>
                            setPriceConfig(prev => ({
                              ...prev,
                              autoUpdate: e.target.checked
                            }))
                          }
                          className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                        />
                        <label
                          htmlFor="auto-update"
                          className="text-sm text-gray-300"
                        >
                          Auto Update
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Update Interval (hours)
                        </label>
                        <input
                          placeholder="Update Interval (hours)"
                          type="number"
                          value={priceConfig.updateInterval}
                          onChange={e =>
                            setPriceConfig(prev => ({
                              ...prev,
                              updateInterval: parseInt(e.target.value) || 24
                            }))
                          }
                          className="w-full px-2 py-1 text-white bg-gray-800 border border-gray-600 rounded"
                          min="1"
                          max="168"
                        />
                      </div>
                    </div>

                    {Object.keys(config?.prices?.data || {}).length > 0 && (
                      <div className="p-2 text-xs text-gray-400 bg-gray-800 rounded">
                        📊 {Object.keys(config.prices.data).length} items with
                        price data loaded
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Debug Settings */}
          {isElectron && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Debug Settings
              </h3>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50">
                <input
                  type="checkbox"
                  id="debug-ocr-preview"
                  checked={config?.settings?.debugOCRPreview || false}
                  onChange={e =>
                    updateConfig("settings", {
                      ...config.settings,
                      debugOCRPreview: e.target.checked
                    })
                  }
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label
                  htmlFor="debug-ocr-preview"
                  className="text-sm text-gray-300"
                >
                  Enable OCR Debug Preview
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                If enabled, the app will display the captured screenshot for
                inspection before sending it to the AI.
              </p>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="pt-4 mt-4 text-center border-t border-gray-600/30">
          <p className="mb-2 text-xs text-gray-400">
            💝 Enjoying the calculator? Support development on
          </p>
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
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 font-bold text-white bg-yellow-600 rounded hover:bg-yellow-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
