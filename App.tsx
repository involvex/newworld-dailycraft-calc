import React, { useState, useMemo, useCallback, useEffect, useRef, useDeferredValue } from 'react';
import { APP_VERSION } from './src/version';
import { ITEMS } from './data/items';
import { RECIPES } from './data/recipes';
import CraftingNode from './components/CraftingNode';
import SummaryList from './components/SummaryList';
import XPSummaryList from './components/XPSummaryList';
import ContextMenu from './components/ContextMenu';
import { SettingsModal } from './components/SettingsModal';
import { Item, AllBonuses, BonusConfiguration } from './types';
import useCraftingTree from './hooks/useCraftingTree';
import useInventoryOCR from './hooks/useInventoryOCR';
import usePresets from './hooks/usePresets';
import { useConfig } from './hooks/useConfig';
import useTreeCollapse from './hooks/useTreeCollapse';

// Types
type SummaryMode = 'net' | 'xp';
type ViewMode = 'net' | 'gross';
type Inventory = Record<string, number>;

// Constants
const DEFAULT_BONUSES = {
  Smelting: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  Weaving: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  Tanning: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  Woodworking: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  Stonecutting: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
};

const getInitial = <T,>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};

const App: React.FC = () => {
  // Centralized config management
  const configState = useConfig();
  const { loadConfig } = configState;

  useEffect(() => {
    loadConfig();
  }, []); // Empty dependency array ensures this runs only once on mount

  // App state
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => getInitial('collapsedNodes', new Set()));
  const [selectedItemId, setSelectedItemId] = useState<string>(() => getInitial('selectedItemId', ''));
  const [quantity, setQuantity] = useState<number>(() => getInitial('quantity', 10));
  const [multiItems, setMultiItems] = useState<any[]>(() => getInitial('multiItems', []));
  const [summaryMode, setSummaryMode] = useState<SummaryMode>(() => getInitial('summaryMode', 'net'));
  const [viewMode, setViewMode] = useState<ViewMode>(() => getInitial('viewMode', 'net'));
  const [bonuses, setBonuses] = useState<AllBonuses>(() => getInitial('bonuses', DEFAULT_BONUSES));
  const [inventory, setInventory] = useState<Inventory>(() => getInitial('inventory', {}));
  const [selectedPreset, setSelectedPreset] = useState<string>(() => getInitial('selectedPreset', '')); // Moved selectedPreset state here

  // UI state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAdvanced, _setShowAdvanced] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Performance optimization: defer search term to avoid excessive filtering during typing
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Modal states
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [showOCREdit, setShowOCREdit] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showCreatePreset, setShowCreatePreset] = useState<boolean>(false);
  const [showDeletePreset, setShowDeletePreset] = useState<boolean>(false);
  const [showDeleteAllPresets, setShowDeleteAllPresets] = useState<boolean>(false);
  const [showEraseAllData, setShowEraseAllData] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // Toast notification helper
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Data states
  const [manualEntryText, setManualEntryText] = useState<string>('');
  const [ocrEditText, setOCREditText] = useState<string>('');
  const [isProcessingOCR, setIsProcessingOCR] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>('');
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, string>>({
    GEMSTONE_DUST: 'PRISTINE_AMBER'
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [removedNodes, setRemovedNodes] = useState<Set<string>>(new Set());
  const [showPrices, setShowPrices] = useState<boolean>(() => getInitial('showPrices', false));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Price state management
  const priceConfig = configState.config?.prices?.config;
  const priceData = configState.config?.prices?.data || {};

  // --- Tree expand/collapse logic ---
  const {
    handleCollapseAll,
    handleExpandAll,
    handleToggleNode,
    handleCollapseToNode,
    handleExpandToNode,
    restoreCollapsedNodes: treeRestoreCollapsedNodes, // Renamed to avoid conflict
  } = useTreeCollapse({
    collapsedNodes,
    setCollapsedNodes,
  });

  // --- Preset logic (now uses restoreCollapsedNodes) ---
  const {
    PRESETS,
    customPresets,
    setCustomPresets,
    handlePresetSelect,
    handlePresetCreate,
    handlePresetDelete,
  } = usePresets({
    multiItems,
    selectedItemId,
    quantity,
    collapsedNodes,
    setMultiItems,
    setSelectedItemId,
    setQuantity,
    restoreCollapsedNodes: treeRestoreCollapsedNodes,
    selectedPreset, // Pass selectedPreset from App.tsx
    setSelectedPreset, // Pass setSelectedPreset from App.tsx
  });

  // --- Refactored hooks ---
  const {
    craftingData,
    summaryData,
  } = useCraftingTree({
    selectedItemId,
    quantity,
    multiItems,
    bonuses,
    selectedIngredients,
    viewMode,
    summaryMode,
    collapsedNodes,
    inventory,
    removedNodes,
    selectedPreset,
  });

  // Define allCraftableItems directly in App.tsx
  const allCraftableItems: Item[] = useMemo(() =>
    Object.values(ITEMS).filter(item => RECIPES[item.id])
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  // Memoized filtered list for search - now uses deferred search term for better performance
  const filteredCraftableItems = useMemo(() => {
    return allCraftableItems.filter((item: Item) =>
      item.name.toLowerCase().includes(deferredSearchTerm.toLowerCase())
    );
  }, [allCraftableItems, deferredSearchTerm]);

  const {
    captureAndProcessScreenshot,
    parseManualInventory,
    processClipboardImage,
  } = useInventoryOCR({
    setOCREditText,
    setShowOCREdit,
    setIsProcessingOCR,
    geminiApiKey: configState.config?.GEMINI_API_KEY, // Pass API key as prop
    debugOCRPreview: configState.config?.settings?.debugOCRPreview, // Pass debug setting as prop
  });

  const getIconUrl = useCallback((itemId: string) => {
    if (itemId === 'MULTI') {
      return 'https://nwdb.info/images/db/icons/filters/itemtypes/all.png';
    }
    if (itemId === 'GEMSTONE_DUST') {
      return 'https://cdn.nwdb.info/db/images/live/v55/icons/items/consumable/gemstonedustt5.png';
    }
    const iconId = ITEMS[itemId]?.iconId || itemId.toLowerCase().replace(/_/g, '');
    return `https://cdn.nwdb.info/db/images/live/v55/icons/items/resource/${iconId}.png`;
  }, []);

  const handleBonusChange = (category: string, field: keyof BonusConfiguration, value: string | boolean) => {
    setBonuses(prev => {
      const newCategoryBonus = { ...prev[category] };
      let processedValue: number | boolean;
      if (typeof value === 'boolean') {
        processedValue = value;
      } else {
        const numValue = field === 'gearBonus' ? parseFloat(value) / 100 : parseInt(value, 10);
        processedValue = isNaN(numValue) ? 0 : numValue;
      }
      (newCategoryBonus[field] as any) = processedValue;
      const updated = { ...prev, [category]: newCategoryBonus };
      localStorage.setItem('bonuses', JSON.stringify(updated));
      return updated;
    });
  };

  // Add localStorage setters for mode changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', JSON.stringify(mode));
  };

  const handleSummaryModeChange = (mode: SummaryMode) => {
    setSummaryMode(mode);
    localStorage.setItem('summaryMode', JSON.stringify(mode));
  };

  const handleInventoryChange = (itemId: string, quantity: number) => {
    setInventory(prev => {
      const updated = { ...prev };
      if (quantity <= 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = quantity;
      }
      localStorage.setItem('inventory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleContextMenu = (node: any, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  };

  const handleRemoveNode = (nodeId: string) => {
    setRemovedNodes(prev => new Set(prev).add(nodeId));
    setContextMenu(null);
  };


  const handleExportData = () => {
    const dataToExport = {
      customPresets,
      inventory,
      bonuses,
      collapsedNodes: Array.from(collapsedNodes),
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'new-world-crafting-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.customPresets) setCustomPresets(data.customPresets);
            if (data.inventory) setInventory(data.inventory);
            if (data.bonuses) setBonuses(data.bonuses);
            if (data.collapsedNodes) setCollapsedNodes(new Set(data.collapsedNodes));
            showToastMessage('Data imported successfully!');
          } catch (error) {
            showToastMessage('Failed to import data. The file may be corrupted.' + error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearInventory = () => {
    setInventory({});
    localStorage.removeItem('inventory');
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadImage = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToastMessage('Please select a valid image file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToastMessage('Image file is too large. Please select an image smaller than 10MB.');
      return;
    }

    try {
      setIsProcessingOCR(true);
      showToastMessage('Processing uploaded image...');

      // Create object URL for the uploaded file
      const imageUrl = URL.createObjectURL(file);

      // Process the image using the existing OCR logic
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get 2D context for canvas');

          ctx.drawImage(img, 0, 0);

          if (configState.config?.settings?.debugOCRPreview) {
            const debugImg = document.getElementById('ocr-debug-image') as HTMLImageElement;
            if (debugImg) {
              debugImg.src = canvas.toDataURL('image/png');
            } else {
              const newDebugImg = document.createElement('img');
              newDebugImg.id = 'ocr-debug-image';
              newDebugImg.src = canvas.toDataURL('image/png');
              newDebugImg.style.position = 'fixed';
              newDebugImg.style.top = '10px';
              newDebugImg.style.left = '10px';
              newDebugImg.style.zIndex = '9999';
              newDebugImg.style.border = '5px solid red';
              newDebugImg.style.width = '50%';
              document.body.appendChild(newDebugImg);
            }
            setShowOCREdit(true);
            setOCREditText('Debug preview is active. Close this modal to continue analysis.');

            // Wait for the modal to be closed by checking if the modal is still open
            await new Promise<void>((resolve) => {
              const checkModalClosed = () => {
                // Check if the modal is still showing by looking for modal-specific elements
                const modal = document.querySelector('.fixed.inset-0.z-50'); // Modal overlay
                if (!modal || modal.classList.contains('hidden') || window.getComputedStyle(modal).display === 'none') {
                  resolve();
                } else {
                  setTimeout(checkModalClosed, 500);
                }
              };
              checkModalClosed();
            });
          }

          const base64Image = canvas.toDataURL('image/png').split(',')[1];

          if (!configState.config?.GEMINI_API_KEY) {
            throw new Error("Gemini API Key is not configured. Please go to Settings and enter your API Key.");
          }

          const { analyzeInventoryImage } = await import('./services/geminiService');
          const analyzedItems = await analyzeInventoryImage(base64Image, configState.config.GEMINI_API_KEY);

          const foundItems: Record<string, number> = {};
          for (const item of analyzedItems) {
            const matchedId = findBestItemMatch(item.itemName);
            if (matchedId) {
              foundItems[matchedId] = (foundItems[matchedId] || 0) + item.quantity;
            }
          }

          const totalFound = Object.keys(foundItems).length;
          let suggestions: string;
          if (totalFound > 0) {
            suggestions = `🎯 Found ${totalFound} items!\n\n` + Object.entries(foundItems).map(([id, qty]) => {
              const item = ITEMS[id];
              return `${item ? item.name : id}: ${qty.toLocaleString()}`;
            }).join('\n') + '\n\n💡 Review and edit if needed.';
          } else {
            suggestions = '📝 No items detected automatically.';
          }

          setOCREditText(suggestions);
          setShowOCREdit(true);
          showToastMessage('Image processed successfully!');
        } catch (error) {
          console.error('Error processing uploaded image:', error);
          const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
          setOCREditText(errorMsg);
          setShowOCREdit(true);
          showToastMessage('Failed to process image: ' + errorMsg);
        } finally {
          setIsProcessingOCR(false);
          // Clean up object URL
          URL.revokeObjectURL(imageUrl);
        }
      };

      img.onerror = () => {
        setIsProcessingOCR(false);
        URL.revokeObjectURL(imageUrl);
        showToastMessage('Failed to load image file.');
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('Error handling file upload:', error);
      setIsProcessingOCR(false);
      showToastMessage('Failed to process uploaded file.');
    }

    // Reset the input
    event.target.value = '';
  }, [configState.config, showToastMessage, setIsProcessingOCR, setOCREditText, setShowOCREdit]);

  // Helper function for item matching (extracted from useInventoryOCR)
  const findBestItemMatch = (itemNameRaw: string): string | null => {
    const { ITEM_MAPPINGS } = require('./constants');
    let matchedItemId: string | null = null;
    let bestMatchScore = 0;
    const lowerItemName = itemNameRaw.toLowerCase().trim();

    const exactMapping = (ITEM_MAPPINGS as Record<string, string>)[lowerItemName];
    if (exactMapping) {
      return exactMapping;
    }

    for (const item of Object.values(ITEMS)) {
      const itemNameLower = item.name.toLowerCase();
      const score = calculateMatchScore(lowerItemName, itemNameLower);
      if (score > bestMatchScore && score > 0.85) {
        matchedItemId = item.id;
        bestMatchScore = score;
      }
    }
    return matchedItemId;
  };

  const calculateMatchScore = (text1: string, text2: string): number => {
    if (text1 === text2) return 1.0;
    if (text1.includes(text2) || text2.includes(text1)) return 0.9;
    const distance = getLevenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    return 1 - (distance / maxLength);
  };

  const getLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Scroll tracking for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Electron event listeners for hotkeys and menu actions
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Set up OCR hotkey listener
      const handleTriggerOCR = () => {
        if (!isProcessingOCR) {
          captureAndProcessScreenshot();
        }
      };

      // Set up settings hotkey listener
      const handleShowSettings = () => {
        setShowSettings(true);
      };

      // Set up about menu listener
      const handleShowAbout = () => {
        setShowAbout(true);
      };

      // Register the listeners and get cleanup functions
      const cleanupOCR = window.electronAPI.onTriggerOCR(handleTriggerOCR);
      const cleanupSettings = window.electronAPI.onShowSettings(handleShowSettings);
      const cleanupAbout = window.electronAPI.onShowAbout(handleShowAbout);

      console.log('Electron event listeners registered');

      // Return cleanup function
      return () => {
        if (typeof cleanupOCR === 'function') cleanupOCR();
        if (typeof cleanupSettings === 'function') cleanupSettings();
        if (typeof cleanupAbout === 'function') cleanupAbout();
        console.log('Electron event listeners cleaned up');
      };
    }
  }, [captureAndProcessScreenshot, isProcessingOCR]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close app function for Electron
  const handleCloseApp = useCallback(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.closeApp();
    } else {
      // Fallback for web version - just close the window
      window.close();
    }
  }, []);

  return (
    <React.Fragment>
      <div className="min-h-screen font-sans text-gray-300 bg-gray-900 app-gradient-bg">
        {/* Navigation Bar - Very first element, sticky at top */}
        <div className="sticky top-0 z-50 p-3 mb-3 border bg-gray-800/30 rounded-xl border-gray-600/30 backdrop-blur-sm navbar">
          {/* Close button for Electron app */}
          {typeof window !== 'undefined' && window.electronAPI && (
            <button
              onClick={handleCloseApp}
              className="absolute p-2 text-gray-400 transition-colors rounded-lg top-3 right-3 hover:text-white hover:bg-gray-700/50"
              title="Close Application"
              aria-label="Close Application"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <img src="logo.png" alt="New World Crafting Calculator" className="w-auto h-12 mx-auto logo" />
          <p className="mr-2 text-sm font-bold text-blue-400" style={{ marginBottom: '-25px', marginLeft: '4%' }}>New World Crafting Calculator</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* <span className="mr-2 text-sm font-medium text-gray-300">Jump to:</span> */}
            <button
              onClick={() => document.getElementById('presets-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1 text-xs text-yellow-300 transition-all duration-200 border rounded-md bg-yellow-600/20 hover:bg-yellow-600/40 border-yellow-500/30"
            >
              📋 Presets
            </button>
            <button
              onClick={() => document.getElementById('selection-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1 text-xs text-yellow-300 transition-all duration-200 border rounded-md bg-yellow-600/20 hover:bg-yellow-600/40 border-yellow-500/30"
            >
              🎯 Item Selection
            </button>
            <button
              onClick={() => document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1 text-xs text-blue-300 transition-all duration-200 border rounded-md bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/30"
            >
              🎒 Inventory
            </button>
            <button
              onClick={() => document.getElementById('crafting-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1 text-xs text-green-300 transition-all duration-200 border rounded-md bg-green-600/20 hover:bg-green-600/40 border-green-500/30"
            >
              🌳 Crafting Tree
            </button>
            <button
              onClick={() => document.getElementById('summary-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1 text-xs text-purple-300 transition-all duration-200 border rounded-md bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/30"
            >
              📊 Summary
            </button>
            <button 
                  onClick={() => setShowSettings(true)} 
                  className="px-3 py-1 text-xs text-purple-300 transition-all duration-200 border rounded-md bg-purple-400/20 hover:bg-purple-600/40 border-purple-500/30"
                >
                  ⚙️ Settings
                </button>
          </div>
        </div>

        <div className="container max-w-6xl p-4 mx-auto sm:p-6 lg:p-8">

          {/* Quick Controls Bar */}
          {/* <div className="p-4 mb-6 border bg-gray-800/50 rounded-xl border-yellow-900/30 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50">
                <span className="text-sm font-medium text-gray-300">View:</span>
                <button
                  onClick={() => handleViewModeChange(viewMode === 'net' ? 'gross' : 'net')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === 'net' 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'bg-blue-600 text-white shadow-lg'
                  }`}
                  title={`Switch to ${viewMode === 'net' ? 'Gross' : 'Net'} mode`}
                >
                  {viewMode === 'net' ? '📊 Net Mode' : '📈 Gross Mode'}
                </button>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50">
                <span className="text-sm font-medium text-gray-300">Summary:</span>
                <button
                  onClick={() => handleSummaryModeChange(summaryMode === 'net' ? 'xp' : 'net')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    summaryMode === 'net' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-orange-600 text-white shadow-lg'
                  }`}
                  title={`Switch to ${summaryMode === 'net' ? 'XP' : 'Materials'} summary`}
                >
                  {summaryMode === 'net' ? '📦 Materials' : '⭐ XP Mode'}
                </button>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  showAdvanced 
                    ? 'bg-yellow-600 text-white shadow-lg' 
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
                title="Toggle advanced options"
              >
                {showAdvanced ? '🔧 Hide Advanced' : '⚙️ Advanced Options'}
              </button>
            </div>
          </div> */}
          {/* Presets Section */}
          <div id="presets-section" className="p-4 mb-6 border shadow-lg bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl border-yellow-900/40">
            <h3 className="flex items-center mb-3 text-lg font-semibold text-yellow-300">
              <span className="mr-2">📋</span>
              Crafting Presets
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <select
                title="Select a preset"
                value={selectedPreset}
                onChange={(e) => {
                  handlePresetSelect(e.target.value);
                }}
                className="flex-1 px-3 py-2 text-sm text-yellow-100 transition-all bg-gray-700 border rounded-lg min-w-64 border-yellow-900/40 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">🎯 Select a preset...</option>
                {PRESETS.map((preset: any) => {
                  const displayName = preset.items.length === 1
                    ? `${preset.name} (${preset.items[0].qty})`
                    : `${preset.name} (${preset.items.length} items)`;
                  return <option key={preset.name} value={preset.name}>{displayName}</option>;
                })}
                {customPresets.length > 0 && <option disabled>--- Custom Presets ---</option>}
                {customPresets.map((preset: any) => {
                  const displayName = preset.items.length === 1
                    ? `${preset.name} (${preset.items[0].qty})`
                    : `${preset.name} (${preset.items.length} items)`;
                  return <option key={preset.name} value={preset.name}>{displayName}</option>;
                })}
              </select>
              <button
                onClick={() => setShowCreatePreset(true)}
                className="flex-shrink-0 px-3 py-2 text-sm text-white transition-all duration-200 bg-green-600 border border-green-500 rounded-lg hover:bg-green-700 hover:shadow-lg"
                title="Create Preset"
              >
                ➕ Create
              </button>
              <button
                onClick={() => {
                  if (selectedPreset) {
                    setShowDeletePreset(true);
                  } else {
                    showToastMessage('Please select a preset to delete.');
                  }
                }}
                className="flex-shrink-0 px-3 py-2 text-sm text-white transition-all duration-200 bg-red-600 border border-red-500 rounded-lg hover:bg-red-700 hover:shadow-lg"
                title="Delete Preset"
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div id="selection-section" className="mb-6">
            <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Left Side: Item Selection */}
              <div className="p-6 border shadow-lg lg:col-span-3 bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border-yellow-900/40">
                <h3 className="flex items-center mb-4 text-lg font-semibold text-yellow-300">
                  <span className="mr-2">🎯</span>
                  Item Selection
                </h3>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="🔍 Search for items to craft..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pr-10 text-white transition-all bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute text-gray-400 transition-colors transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-200"
                      title="Clear search"
                    >
                      ❌
                    </button>
                  )}
                </div>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    setMultiItems([]); // Clear multi-items when a single item is selected
                  }}
                  className="w-full px-4 py-3 text-white transition-all bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  aria-label="Select item"
                >
                  <option value="">📦 Select an item to craft...</option>
                  {filteredCraftableItems.map((item: Item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>

                {multiItems.length > 0 && (
                  <div className="p-4 mt-4 border rounded-lg bg-gray-700/50 border-yellow-900/30">
                    <h4 className="flex items-center mb-2 font-semibold text-yellow-400 text-md">
                      <span className="mr-2">📋</span>
                      Selected Items ({multiItems.length})
                    </h4>
                    <ul className="space-y-2 overflow-y-auto max-h-48">
                      {multiItems.map(item => (
                        <li key={item.id} className="flex items-center p-2 text-sm text-gray-300 rounded bg-gray-600/50">
                          <span className="mr-2">📦</span>
                          {item.qty}x {ITEMS[item.id]?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Side: Quantity and Controls */}
              <div className="p-6 border shadow-lg bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl border-yellow-900/40">
                <h3 className="flex items-center mb-4 text-lg font-semibold text-yellow-300">
                  <span className="mr-2">📊</span>
                  Controls
                </h3>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-3 text-lg font-bold text-center text-white transition-all bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    aria-label="Quantity"
                    min="1"
                    max="10000"
                  />
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowSettings(true)} 
                    className="w-full px-4 py-3 text-sm font-medium transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg"
                  >
                    ⚙️ Settings
                  </button>
                  <button 
                    onClick={() => setShowAbout(true)} 
                    className="w-full px-4 py-3 text-sm font-medium transition-all duration-200 bg-gray-600 rounded-lg hover:bg-gray-700 hover:shadow-lg"
                  >
                    ℹ️ About
                  </button>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50">
                <span className="text-sm font-medium text-gray-300">View:</span>
                <button
                  onClick={() => handleViewModeChange(viewMode === 'net' ? 'gross' : 'net')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === 'net' 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'bg-blue-600 text-white shadow-lg'
                  }`}
                  title={`Switch to ${viewMode === 'net' ? 'Gross' : 'Net'} mode`}
                >
                  {viewMode === 'net' ? '📊 Net Mode' : '📈 Gross Mode'}
                </button>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50">
                <span className="text-sm font-medium text-gray-300">Summary:</span>
                <button
                  onClick={() => handleSummaryModeChange(summaryMode === 'net' ? 'xp' : 'net')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    summaryMode === 'net' 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-orange-600 text-white shadow-lg'
                  }`}
                  title={`Switch to ${summaryMode === 'net' ? 'XP' : 'Materials'} summary`}
                >
                  {summaryMode === 'net' ? '📦 Materials' : '⭐ XP Mode'}
                </button>
              </div>
              <button
                      onClick={() => {
                        setShowPrices(!showPrices);
                        localStorage.setItem('showPrices', JSON.stringify(!showPrices));
                      }}
                      className={`px-3 py-2 text-xs font-medium text-white transition-all duration-200 rounded-lg hover:shadow-lg ${
                        showPrices
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-900 hover:bg-green-700'
                      }`}
                      style={{ width: '100%' }}
                      title={`${showPrices ? 'Hide' : 'Show'} item prices`}
                    >
                      💰 {showPrices ? 'Hide Prices' : 'Display Prices'}
                    </button>
                </div>
              </div>
            </div>

            {showAdvanced && (
              <div className="p-6 mt-6 border shadow-lg bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl border-yellow-900/40">
                <h3 className="flex items-center mb-4 text-lg font-semibold text-yellow-400">
                  <span className="mr-2">🔧</span>
                  Advanced Configuration
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-gray-700/50">
                    <label className="flex items-center block mb-2 text-sm font-medium text-gray-300">
                      <span className="mr-2">👁️</span>
                      View Mode
                    </label>
                    <select 
                      value={viewMode} 
                      onChange={(e) => handleViewModeChange(e.target.value as ViewMode)} 
                      className="w-full px-3 py-2 text-white transition-all bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500" 
                      aria-label="View mode"
                    >
                      <option value="net">📊 Net (Consider Inventory)</option>
                      <option value="gross">📈 Gross (Total Required)</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-700/50">
                    <label className="flex items-center block mb-2 text-sm font-medium text-gray-300">
                      <span className="mr-2">📋</span>
                      Summary Mode
                    </label>
                    <select 
                      value={summaryMode} 
                      onChange={(e) => handleSummaryModeChange(e.target.value as SummaryMode)} 
                      className="w-full px-3 py-2 text-white transition-all bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500" 
                      aria-label="Summary mode"
                    >
                      <option value="net">📦 Material Summary</option>
                      <option value="xp">⭐ Experience Summary</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Tools */}
          <div id="inventory-section" className="p-6 mb-6 border shadow-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border-blue-500/30">
            <h3 className="flex items-center mb-4 text-lg font-semibold text-blue-300">
              <span className="mr-2">🎒</span>
              Inventory Management
            </h3>
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
              <button 
                onClick={captureAndProcessScreenshot} 
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                  isProcessingOCR 
                    ? 'bg-yellow-600 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                }`}
                disabled={isProcessingOCR}
              >
                {isProcessingOCR ? (
                  <>
                    <span className="mr-2 animate-spin">🔄</span>
                    Scanning...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📸</span>
                    Scan Inventory (OCR)
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowManualEntry(true)} 
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-purple-600 rounded-lg hover:bg-purple-700 hover:shadow-lg"
              >
                <span className="mr-2">✏️</span>
                Manual Entry
              </button>

            </div>
            <div className='grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2'>
                          <button 
                onClick={processClipboardImage} 
                style={{  marginBottom: '10px' }}
                className="flex items-center justify-center px-12 py-3 text-sm font-medium text-white transition-all duration-200 bg-purple-600 rounded-lg hover:bg-purple-700 hover:shadow-lg"
              >                <span className="mr-2">📸</span>
                Use Image from Clipboard
              </button>
              {/* Manual File Selection and Upload */}
              <div className='flex content-center mb-3 text-center text-white transition-all duration-200 bg-purple-800 rounded-lg hover:bg-purple-700 hover:shadow-lg'>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  title="Upload Image"
                  className='hidden'
                  onChange={handleUploadImage}
                />
                <button
                  onClick={handleFileButtonClick}
                  className='w-full px-4 py-3 text-sm font-medium text-white transition-all duration-200 bg-purple-800 rounded-lg hover:bg-purple-700 hover:shadow-lg'
                >
                  <span className="mr-2">📁</span>
                  Upload Image
                </button>
              </div>
              </div>
            <p className="mb-4 text-xs text-center text-gray-400">
              Use OCR to automatically detect your inventory from screenshots, or enter items manually
            </p>

            {/* Current Inventory */}
            <div className="p-4 border rounded-lg bg-gray-800/50 border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="flex items-center font-semibold text-blue-300 text-md">
                  <span className="mr-2">📦</span>
                  Current Inventory ({Object.keys(inventory).length} items)
                </h4>
                <button 
                  onClick={handleClearInventory} 
                  className="px-3 py-1 text-xs text-white transition-all duration-200 bg-red-600 rounded hover:bg-red-700"
                  title="Clear all inventory"
                >
                  🗑️ Clear All
                </button>
              </div>
              {Object.keys(inventory).length === 0 ? (
                <p className="py-4 text-sm text-center text-gray-400">
                  No items in inventory. Use OCR scan or manual entry to add items.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 max-h-48">
                  {Object.entries(inventory).sort(([, qtyA], [, qtyB]) => qtyB - qtyA).map(([itemId, qty]) => (
                    <div key={itemId} className="flex items-center justify-between p-2 text-sm rounded bg-gray-700/50">
                      <span className="mr-2 text-gray-300 truncate" title={ITEMS[itemId]?.name || itemId}>
                        {ITEMS[itemId]?.name || itemId}: {qty.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleInventoryChange(itemId, 0)}
                        className="flex-shrink-0 ml-1 text-xs text-red-400 hover:text-red-300"
                        title="Remove item from inventory"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {craftingData && (
            <div id="crafting-section" className="mb-6">
              <div className="p-6 border shadow-lg bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center text-xl font-bold text-green-300">
                    <span className="mr-2">🌳</span>
                    Crafting Tree
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowPrices(!showPrices);
                        localStorage.setItem('showPrices', JSON.stringify(!showPrices));
                      }}
                      className={`px-3 py-2 text-xs font-medium text-white transition-all duration-200 rounded-lg hover:shadow-lg ${
                        showPrices
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-900 hover:bg-green-700'
                      }`}
                      title={`${showPrices ? 'Hide' : 'Show'} item prices`}
                    >
                      💰 {showPrices ? 'Hide Prices' : 'Display Prices'}
                    </button>
                    <button
                      onClick={() => handleExpandAll(craftingData)}
                      className="px-3 py-2 text-xs font-medium text-white transition-all duration-200 bg-green-600 rounded-lg hover:bg-green-700 hover:shadow-lg"
                    >
                      📖 Expand All
                    </button>
                    <button
                      onClick={() => handleCollapseAll(craftingData)}
                      className="px-3 py-2 text-xs font-medium text-white transition-all duration-200 bg-orange-600 rounded-lg hover:bg-orange-700 hover:shadow-lg"
                    >
                      📕 Collapse All
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-800/50">
                  <CraftingNode
                    node={craftingData}
                    collapsedNodes={collapsedNodes}
                    onToggle={handleToggleNode}
                    getIconUrl={getIconUrl}
                    onNodeContextMenu={handleContextMenu}
                    showPrices={showPrices && priceConfig?.enabled}
                    priceConfig={priceConfig}
                    priceData={priceData}
                  />
                </div>
              </div>
            </div>
          )}

          {summaryData && (summaryData.materials || summaryData.xpGains) && (
            <div id="summary-section" className="mb-6">
              <div className="p-6 border shadow-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border-purple-500/30">
                <h2 className="flex items-center mb-4 text-xl font-bold text-purple-300">
                  <span className="mr-2">📊</span>
                  {summaryData.title || "Summary"}
                </h2>
                {summaryMode === 'xp' && summaryData.xpGains ? (
                  <XPSummaryList xpGains={summaryData.xpGains} />
                ) : summaryData.materials ? (
                  <SummaryList
                  materials={summaryData.materials}
                  inventory={inventory}
                  onInventoryChange={handleInventoryChange}
                  getIconUrl={getIconUrl}
                  title={summaryData.title || "Raw Materials"}
                  showInventory={summaryMode === 'net'}
                  selectedIngredients={selectedIngredients}
                  onIngredientChange={(itemId: string, ingredient: string) => {
                    setSelectedIngredients(prev => ({ ...prev, [itemId]: ingredient }));
                  }}
                  showPrices={showPrices}
                  priceConfig={priceConfig}
                  priceData={priceData}
                  />
                ) : (
                  <div className="py-8 text-center text-gray-400">
                  <p>No data available for this view.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            bonuses={bonuses}
            onBonusChange={handleBonusChange}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onDeleteAllPresets={() => setShowDeleteAllPresets(true)}
            onEraseAllData={() => setShowEraseAllData(true)}
            configState={configState}
          />
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              onExpand={() => {
                if (craftingData) {
                  handleExpandToNode(craftingData, contextMenu.nodeId);
                }
                setContextMenu(null);
              }}
              onCollapse={() => {
                if (craftingData) {
                  handleCollapseToNode(craftingData, contextMenu.nodeId);
                }
                setContextMenu(null);
              }}
              onRemove={() => handleRemoveNode(contextMenu.nodeId)}
            />
          )}

          {showAbout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-yellow-300">About</h2>
                <p className="text-gray-300">This New World Crafting Calculator is an open-source project designed to help players plan their crafting efficiently.</p>
                <p className="mt-2 text-gray-300">Version: {APP_VERSION}</p>
                <button onClick={() => setShowAbout(false)} className="w-full px-4 py-2 mt-6 font-bold text-white bg-yellow-600 rounded hover:bg-yellow-700">Close</button>
              </div>
            </div>
          )}

          {/* Manual Entry Modal */}
          {showManualEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="mb-4 text-2xl font-bold text-yellow-300">📝 Manual Inventory Entry</h2>
                <div className="flex-1 overflow-y-auto">
                  <p className="mb-4 text-gray-300">
                    Enter your inventory items using the format: <code className="px-1 bg-gray-700 rounded">Item Name: Quantity</code>
                  </p>
                  <div className="p-3 mb-4 text-sm text-gray-300 bg-gray-700 rounded">
                    <strong>Examples:</strong><br />
                    Iron Ore: 1800<br />
                    Orichalcum Ore: 635<br />
                    Starmetal Ore: 86<br />
                    Steel Ingot: 72<br />
                    Thick Hide: 450
                  </div>
                  <textarea
                    value={manualEntryText}
                    onChange={(e) => setManualEntryText(e.target.value)}
                    placeholder="Enter your items here... (one per line)"
                    className="w-full h-64 p-3 font-mono text-sm text-white bg-gray-700 border border-gray-600 rounded resize-none"
                  />
                </div>
                <div className="flex flex-shrink-0 gap-2 mt-4">
                  <button
                    onClick={() => {
                      // Parse manual entry
                      const parsed = parseManualInventory(manualEntryText);
                      if (Object.keys(parsed).length > 0) {
                        setInventory(prev => {
                          const updated = { ...prev, ...parsed };
                          localStorage.setItem('inventory', JSON.stringify(updated));
                          return updated;
                        });
                        setShowManualEntry(false);
                        setManualEntryText('');
                      } else {
                        showToastMessage('No valid items found. Please check your format: "Item Name: Quantity"');
                      }
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    ✅ Apply to Inventory
                  </button>
                  <button
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualEntryText('');
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OCR Edit Modal */}
          {showOCREdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="mb-4 text-2xl font-bold text-yellow-300">🔍 OCR Results</h2>
                <div className="flex-1 overflow-y-auto">
                  <p className="mb-4 text-gray-300">
                    Review and edit the detected items. Format: <code className="px-1 bg-gray-700 rounded">Item Name: Quantity</code>
                  </p>
                  <textarea
                    value={ocrEditText}
                    onChange={(e) => setOCREditText(e.target.value)}
                    className="w-full h-64 p-3 font-mono text-sm text-white bg-gray-700 border border-gray-600 rounded resize-none"
                    placeholder="OCR results will appear here..."
                  />
                </div>
                <div className="flex flex-shrink-0 gap-2 mt-4">
                  <button
                    onClick={() => {
                      // Parse OCR text
                      const parsed = parseManualInventory(ocrEditText);
                      if (Object.keys(parsed).length > 0) {
                        setInventory(prev => {
                          const updated = { ...prev, ...parsed };
                          localStorage.setItem('inventory', JSON.stringify(updated));
                          return updated;
                        });
                        setShowOCREdit(false);
                        setOCREditText('');
                      } else {
                        showToastMessage('No valid items found. Please check your format: "Item Name: Quantity"');
                      }
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    ✅ Apply to Inventory
                  </button>
                  <button
                    onClick={() => captureAndProcessScreenshot()}
                    className="flex-1 px-4 py-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
                    disabled={isProcessingOCR}
                  >
                    {isProcessingOCR ? '🔍 Scanning...' : '🔄 Scan Again'}
                  </button>
                  <button
                    onClick={() => {
                      setShowOCREdit(false);
                      setOCREditText('');
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Preset Modal */}
          {showCreatePreset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-yellow-300">Create New Preset</h2>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Preset Name</label>
                  <input
                    type="text"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-white transition-all bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Enter preset name..."
                    maxLength={50}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && presetNameInput.trim()) {
                        handlePresetCreate(presetNameInput.trim());
                        setPresetNameInput('');
                        setShowCreatePreset(false);
                      } else if (e.key === 'Escape') {
                        setPresetNameInput('');
                        setShowCreatePreset(false);
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (presetNameInput.trim()) {
                        handlePresetCreate(presetNameInput.trim());
                        setPresetNameInput('');
                        setShowCreatePreset(false);
                      }
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-green-600 rounded hover:bg-green-700"
                    disabled={!presetNameInput.trim()}
                  >
                    ✅ Create Preset
                  </button>
                  <button
                    onClick={() => {
                      setPresetNameInput('');
                      setShowCreatePreset(false);
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Preset Modal */}
          {showDeletePreset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-red-300">Delete Preset</h2>
                <p className="mb-6 text-gray-300">
                  Are you sure you want to delete the preset <span className="font-bold text-yellow-300">&quot;{selectedPreset}&quot;</span>?
                  <br />
                  <span className="text-sm text-red-400">This action cannot be undone.</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedPreset) {
                        handlePresetDelete(selectedPreset);
                        setSelectedPreset('');
                        setShowDeletePreset(false);
                      }
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-red-600 rounded hover:bg-red-700"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => setShowDeletePreset(false)}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete All Presets Modal */}
          {showDeleteAllPresets && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-red-300">Delete All Custom Presets</h2>
                <p className="mb-6 text-gray-300">
                  Are you sure you want to delete <span className="font-bold text-yellow-300">all custom presets</span>?
                  <br />
                  <span className="text-sm text-red-400">This action cannot be undone.</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCustomPresets([]);
                      localStorage.removeItem('customPresets');
                      setShowDeleteAllPresets(false);
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-red-600 rounded hover:bg-red-700"
                  >
                    🗑️ Delete All
                  </button>
                  <button
                    onClick={() => setShowDeleteAllPresets(false)}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Erase All Data Modal */}
          {showEraseAllData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-2xl font-bold text-red-300">⚠️ Erase All Data</h2>
                <p className="mb-6 text-gray-300">
                  Are you sure you want to <span className="font-bold text-red-400">erase ALL data</span>?
                  <br />
                  This will delete:
                  <ul className="mt-2 text-sm text-gray-400 list-disc list-inside">
                    <li>All custom presets</li>
                    <li>Inventory data</li>
                    <li>Bonus settings</li>
                    <li>All other saved data</li>
                  </ul>
                  <span className="text-sm font-bold text-red-400">This action cannot be undone and will reload the page.</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-red-600 rounded hover:bg-red-700"
                  >
                    🗑️ Erase Everything
                  </button>
                  <button
                    onClick={() => setShowEraseAllData(false)}
                    className="flex-1 px-4 py-2 font-bold text-white transition-all duration-200 bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {showToast && (
            <div className="fixed z-50 max-w-sm p-4 text-white bg-gray-800 border border-yellow-500 rounded-lg shadow-lg top-4 right-4">
              <div className="flex items-center">
                <span className="mr-2">ℹ️</span>
                <span className="text-sm">{toastMessage}</span>
                <button
                  onClick={() => setShowToast(false)}
                  className="ml-2 text-gray-400 transition-colors hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Back to Top Button */}
          {showBackToTop && (
            <button
              onClick={scrollToTop}
              className="fixed z-40 p-3 text-white transition-all duration-300 bg-yellow-600 rounded-full shadow-lg bottom-6 right-6 hover:bg-yellow-700 hover:shadow-xl"
              title="Back to Top"
            >
              <span className="text-lg">⬆️</span>
            </button>
          )}

          {/* Footer */}
          <footer className="py-8 mt-12 text-center border bg-gray-800/50 border-blue-500/20 rounded-xl">
            <div className="mb-4">
              <img alt="New World Crafting Calculator" className="w-auto h-16 mx-auto mb-3 opacity-80" src="logo.png" />
            </div>
            <div className="space-y-2 text-gray-400">
              <p className="text-sm font-medium">Created with ❤️ by <span className="text-yellow-400">Involvex</span></p>
              <p className="text-xs">
                Game data sourced from{' '}
                <a 
                  href="https://nw-buddy.de" 
                  className="text-blue-400 underline transition-all hover:text-blue-300 decoration-dotted hover:decoration-solid"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  nw-buddy.de
                </a>
              </p>
              <p className="text-xs text-gray-500">
                New World Crafting Calculator v{APP_VERSION} • Open Source
              </p>
              <div className="pt-2 mt-3 border-t border-gray-600/30">
                <p className="mb-1 text-xs text-gray-400">💝 Like this project?</p>
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
            </div>
          </footer>
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
