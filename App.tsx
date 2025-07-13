import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { APP_VERSION } from './src/version';
import { ITEMS } from './data/items';
import { RECIPES } from './data/recipes';
import CraftingNode from './components/CraftingNode';
import SummaryList from './components/SummaryList';
import XPSummaryList from './components/XPSummaryList';
import ContextMenu from './components/ContextMenu';
import { SettingsModal } from './components/SettingsModal';
import UpdateNotification from './components/UpdateNotification';
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
  // Config management
  useConfig();

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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getInitial('isDarkMode', true));

  // UI state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

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

  // Memoized filtered list for search
const filteredCraftableItems = useMemo(() => {
  return allCraftableItems.filter((item: Item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [allCraftableItems, searchTerm]);

  const {
    captureAndProcessScreenshot,
    parseInventoryOCR,
  } = useInventoryOCR({
    setOCREditText,
    setShowOCREdit,
    setIsProcessingOCR,
  });

  const getIconUrl = useCallback((itemId: string) => {
    if (itemId === 'MULTI') {
      return 'https://nwdb.info/images/db/icons/filters/itemtypes/all.png';
    }
    if (itemId === 'GEMSTONE_DUST') {
      return 'https://cdn.nwdb.info/db/images/live/v55/icons/items/consumable/gemstonedustt5.png';
    }
    const iconId = ITEMS[itemId]?.iconId || itemId.toLowerCase().replace(/_/g, '');
    const url = `https://cdn.nwdb.info/db/images/live/v55/icons/items/resource/${iconId}.png`;
    
    // Debug logging for Electron builds
    if (window.electronAPI) {
      console.log(`Loading icon for ${itemId}: ${url}`);
    }
    
    return url;
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
            showToastMessage('Failed to import data. The file may be corrupted.');
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

      // New hotkey handlers
      const handleToggleViewMode = () => {
        setViewMode(prev => {
          const newMode = prev === 'net' ? 'gross' : 'net';
          localStorage.setItem('viewMode', JSON.stringify(newMode));
          return newMode;
        });
      };

      const handleToggleTreeExpansion = () => {
        if (craftingData) {
          // Toggle between expand all and collapse all
          const hasCollapsedNodes = collapsedNodes.size > 0;
          if (hasCollapsedNodes) {
            handleExpandAll(craftingData);
          } else {
            handleCollapseAll(craftingData);
          }
        }
      };

      const handleViewSummary = () => {
        document.getElementById('summary-section')?.scrollIntoView({ behavior: 'smooth' });
      };

      // Register the listeners and get cleanup functions
      const cleanupOCR = window.electronAPI.onTriggerOCR(handleTriggerOCR);
      const cleanupSettings = window.electronAPI.onShowSettings(handleShowSettings);
      const cleanupAbout = window.electronAPI.onShowAbout(handleShowAbout);
      const cleanupToggleViewMode = window.electronAPI.onToggleViewMode(handleToggleViewMode);
      const cleanupToggleTreeExpansion = window.electronAPI.onToggleTreeExpansion(handleToggleTreeExpansion);
      const cleanupViewSummary = window.electronAPI.onViewSummary(handleViewSummary);

      console.log('Electron event listeners registered');

      // Return cleanup function
      return () => {
        if (typeof cleanupOCR === 'function') cleanupOCR();
        if (typeof cleanupSettings === 'function') cleanupSettings();
        if (typeof cleanupAbout === 'function') cleanupAbout();
        if (typeof cleanupToggleViewMode === 'function') cleanupToggleViewMode();
        if (typeof cleanupToggleTreeExpansion === 'function') cleanupToggleTreeExpansion();
        if (typeof cleanupViewSummary === 'function') cleanupViewSummary();
        console.log('Electron event listeners cleaned up');
      };
    }
  }, [captureAndProcessScreenshot, isProcessingOCR, craftingData, collapsedNodes, handleExpandAll, handleCollapseAll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleThemeToggle = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('isDarkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  return (
    <React.Fragment>
      {/* Auto-updater notification */}
      <UpdateNotification />
      
      <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-300' : 'bg-gradient-to-br from-gray-100 via-white to-gray-100 text-gray-700'} min-h-screen font-sans relative overflow-hidden`}>
        {/* Background decoration */}
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-yellow-500/5 via-transparent to-blue-500/5' : 'bg-gradient-to-r from-yellow-400/10 via-transparent to-blue-400/10'}`}></div>
        <div className={`absolute top-0 left-1/4 w-96 h-96 ${isDarkMode ? 'bg-yellow-500/3' : 'bg-yellow-400/8'} rounded-full blur-3xl`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${isDarkMode ? 'bg-blue-500/3' : 'bg-blue-400/8'} rounded-full blur-3xl`}></div>
        
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl relative z-10">
          {/* Fixed Sticky Navigation Bar */}
          <div className={`fixed top-0 left-0 right-0 z-40 ${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm shadow-2xl border-b ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
              <div className="py-3">
                <div className="grid grid-cols-3 items-start h-full">
                  {/* Logo and Title Section - Far Left */}
                  <div className="flex flex-col justify-self-start">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <a 
                          href="https://github.com/involvex/newworld-dailycraft-calc" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block hover:scale-105 transition-transform duration-300"
                          title="Visit GitHub Repository"
                        >
                          <img 
                            src="logo.png" 
                            alt="New World Crafting Calculator" 
                            className="h-12 w-auto drop-shadow-xl cursor-pointer" 
                          />
                          <div className={`absolute -inset-2 ${isDarkMode ? 'bg-gradient-to-r from-yellow-400/20 to-blue-400/20' : 'bg-gradient-to-r from-yellow-500/30 to-blue-500/30'} rounded-full blur-lg opacity-75`}></div>
                        </a>
                      </div>
                      <div className="flex flex-col">
                        <a 
                          href="https://github.com/involvex/newworld-dailycraft-calc" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block hover:opacity-80 transition-opacity duration-300"
                          title="Visit GitHub Repository"
                        >
                          <h1 className={`text-lg font-bold leading-tight ${isDarkMode ? 'bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300' : 'bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600'} bg-clip-text text-transparent tracking-tight cursor-pointer`}>
                            New World<br />Crafting Calculator
                          </h1>
                        </a>
                      </div>
                    </div>
                    {/* Feature badges under logo/title - all the way left */}
                    <div className="mt-2 flex flex-wrap gap-1 text-xs">
                      <span className={`${isDarkMode ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-yellow-400/30 text-yellow-700 border-yellow-400/50'} px-1.5 py-0.5 rounded-full border`}>
                        🔍 OCR
                      </span>
                      <span className={`${isDarkMode ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-400/30 text-blue-700 border-blue-400/50'} px-1.5 py-0.5 rounded-full border`}>
                        ⚡ Real-time
                      </span>
                      <span className={`${isDarkMode ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-400/30 text-green-700 border-green-400/50'} px-1.5 py-0.5 rounded-full border`}>
                        💾 Auto-save
                      </span>
                    </div>
                  </div>
                  
                  {/* Navigation Section - Centered */}
                  <div className="flex justify-center">
                    <div className="text-center">
                      <h3 className={`text-sm font-semibold ${isDarkMode ? 'bg-gradient-to-r from-blue-300 to-cyan-300' : 'bg-gradient-to-r from-blue-600 to-cyan-600'} bg-clip-text text-transparent mb-2`}>
                        🚀 Quick Navigation
                      </h3>
                      <div className="flex flex-wrap gap-1 items-center justify-center">
                        <button
                          onClick={() => document.getElementById('presets-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className={`px-2 py-1 rounded-md text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 hover:from-yellow-600/40 hover:to-yellow-500/40 border border-yellow-500/30 text-yellow-300'
                              : 'bg-gradient-to-r from-yellow-500/30 to-yellow-400/30 hover:from-yellow-500/50 hover:to-yellow-400/50 border border-yellow-400/50 text-yellow-700'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            📋 <span className="font-medium">Presets</span>
                          </span>
                        </button>
                        <button
                          onClick={() => document.getElementById('selection-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className={`px-2 py-1 rounded-md text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-orange-600/20 to-red-500/20 hover:from-orange-600/40 hover:to-red-500/40 border border-orange-500/30 text-orange-300'
                              : 'bg-gradient-to-r from-orange-500/30 to-red-500/30 hover:from-orange-500/50 hover:to-red-500/50 border border-orange-400/50 text-orange-700'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            🎯 <span className="font-medium">Selection</span>
                          </span>
                        </button>
                        <button
                          onClick={() => document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className={`px-2 py-1 rounded-md text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/20 hover:from-blue-600/40 hover:to-cyan-500/40 border border-blue-500/30 text-blue-300'
                              : 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 hover:from-blue-500/50 hover:to-cyan-500/50 border border-blue-400/50 text-blue-700'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            🎒 <span className="font-medium">Inventory</span>
                          </span>
                        </button>
                        <button
                          onClick={() => document.getElementById('crafting-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className={`px-2 py-1 rounded-md text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-green-600/20 to-emerald-500/20 hover:from-green-600/40 hover:to-emerald-500/40 border border-green-500/30 text-green-300'
                              : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 hover:from-green-500/50 hover:to-emerald-500/50 border border-green-400/50 text-green-700'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            🌳 <span className="font-medium">Tree</span>
                          </span>
                        </button>
                        <button
                          onClick={() => document.getElementById('summary-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className={`px-2 py-1 rounded-md text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-purple-600/20 to-pink-500/20 hover:from-purple-600/40 hover:to-pink-500/40 border border-purple-500/30 text-purple-300'
                              : 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/50 hover:to-pink-500/50 border border-purple-400/50 text-purple-700'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            📊 <span className="font-medium">Summary</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Settings, Controls, About, Theme Toggle - Far Right */}
                  <div className="flex flex-col items-end justify-self-end gap-2">
                    {/* Top row: Settings and About */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSettings(true)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-blue-700/60 hover:bg-blue-600/80 text-blue-200 hover:text-white'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-900'
                        }`}
                        title="Settings"
                      >
                        ⚙️ Settings
                      </button>
                      <button
                        onClick={() => setShowAbout(true)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          isDarkMode
                            ? 'bg-gray-700/60 hover:bg-gray-600/80 text-gray-200 hover:text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                        }`}
                        title="About"
                      >
                        ℹ️ About
                      </button>
                      <button
                        onClick={handleThemeToggle}
                        className={`p-1.5 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                          isDarkMode 
                            ? 'bg-gray-700/60 hover:bg-gray-600/80 text-yellow-400 hover:text-yellow-300' 
                            : 'bg-gray-200/60 hover:bg-gray-300/80 text-gray-700 hover:text-gray-900'
                        }`}
                        title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} mode`}
                        aria-label={`Switch to ${isDarkMode ? 'Light' : 'Dark'} mode`}
                      >
                        {isDarkMode ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Bottom row: Control Center */}
                    <div className="flex items-center gap-1">
                      <div className={`flex items-center gap-1 ${isDarkMode ? 'bg-gray-700/40' : 'bg-gray-200/40'} rounded-lg px-2 py-1 ${isDarkMode ? 'border border-gray-600/20' : 'border border-gray-300/20'}`}>
                        <button
                          onClick={() => handleViewModeChange(viewMode === 'net' ? 'gross' : 'net')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                            viewMode === 'net' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm' 
                              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm'
                          }`}
                          title={`Switch to ${viewMode === 'net' ? 'Gross' : 'Net'} mode`}
                        >
                          {viewMode === 'net' ? '📊' : '📈'}
                        </button>
                        <button
                          onClick={() => handleSummaryModeChange(summaryMode === 'net' ? 'xp' : 'net')}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                            summaryMode === 'net' 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm' 
                              : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
                          }`}
                          title={`Switch to ${summaryMode === 'net' ? 'XP' : 'Materials'} summary`}
                        >
                          {summaryMode === 'net' ? '📦' : '⭐'}
                        </button>
                        <button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                            showAdvanced 
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-sm' 
                              : `${isDarkMode ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-400 text-gray-800 hover:bg-gray-500'}`
                          }`}
                          title="Toggle advanced options"
                        >
                          🔧
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add top padding to compensate for fixed navigation */}
          <div className="pt-20"></div>

          {/* Presets Section */}
          <div id="presets-section" className={`mb-6 ${isDarkMode ? 'bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80' : 'bg-gradient-to-r from-gray-100/80 via-white/80 to-gray-100/80'} backdrop-blur-sm p-4 rounded-xl ${isDarkMode ? 'border border-yellow-900/40' : 'border border-yellow-400/40'} shadow-2xl`}>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300' : 'bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600'} bg-clip-text text-transparent mb-3 flex items-center`}>
              <span className="mr-2 text-xl">📋</span>
              Crafting Presets & Quick Sets
            </h3>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                title="Select a preset"
                value={selectedPreset}
                onChange={(e) => {
                  handlePresetSelect(e.target.value);
                }}
                className={`flex-1 min-w-64 ${isDarkMode ? 'bg-gray-700 border-yellow-900/40 text-yellow-100' : 'bg-white border-yellow-400/40 text-gray-800'} rounded-lg py-2 px-3 text-sm focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-500' : 'focus:ring-yellow-400'} focus:border-transparent transition-all`}
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
                className="px-3 py-2 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg text-sm text-white hover:shadow-lg transition-all duration-200 flex-shrink-0"
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
                className="px-3 py-2 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg text-sm text-white hover:shadow-lg transition-all duration-200 flex-shrink-0"
                title="Delete Preset"
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div id="selection-section" className="mb-8">
            {/* Full width for item selection to match other sections */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-800/80 via-gray-700/80 to-gray-800/80' : 'bg-gradient-to-br from-gray-100/80 via-white/80 to-gray-100/80'} backdrop-blur-sm p-6 rounded-2xl ${isDarkMode ? 'border border-yellow-900/40' : 'border border-yellow-400/40'} shadow-2xl`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300' : 'bg-gradient-to-r from-yellow-600 via-orange-500 to-yellow-600'} bg-clip-text text-transparent mb-4 flex items-center`}>
                <span className="mr-3 text-2xl">🎯</span>
                Item Selection & Search
              </h3>
              
              {/* Grid layout for better organization */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column: Search and Select */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 Search for items to craft..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg py-3 px-4 pr-10 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
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
                    className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
                    aria-label="Select item"
                  >
                    <option value="">📦 Select an item to craft...</option>
                    {filteredCraftableItems.map((item: Item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Right column: Quantity controls */}
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                      className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg py-3 px-4 text-center text-lg font-bold focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
                      aria-label="Quantity"
                      min="1"
                      max="10000"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setQuantity(prev => Math.min(prev + 10, 10000))}
                      className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                      title="Add 10"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => setQuantity(prev => Math.min(prev + 100, 10000))}
                      className="px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors font-medium"
                      title="Add 100"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => setQuantity(1)}
                      className="px-2 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors font-medium"
                      title="Reset to 1"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {multiItems.length > 0 && (
                <div className={`mt-6 p-4 ${isDarkMode ? 'bg-gray-700/50 border-yellow-900/30' : 'bg-gray-200/50 border-yellow-400/30'} rounded-lg border`}>
                  <h4 className={`text-md font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-2 flex items-center`}>
                    <span className="mr-2">📦</span>
                    Selected Items ({multiItems.length})
                  </h4>
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {multiItems.map(item => (
                      <li key={item.id} className={`text-sm ${isDarkMode ? 'text-gray-300 bg-gray-600/50' : 'text-gray-700 bg-gray-100/50'} p-2 rounded flex items-center`}>
                        <span className="mr-2">📦</span>
                        {item.qty}x {ITEMS[item.id]?.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {showAdvanced && (
              <div className={`mt-6 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-200 to-gray-100'} p-6 rounded-xl ${isDarkMode ? 'border border-yellow-900/40' : 'border border-yellow-400/40'} shadow-lg`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-4 flex items-center`}>
                  <span className="mr-2">🔧</span>
                  Advanced Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} p-4 rounded-lg`}>
                    <label className={`flex text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 items-center`}>
                      <span className="mr-2">👁️</span>
                      View Mode
                    </label>
                    <select 
                      value={viewMode} 
                      onChange={(e) => handleViewModeChange(e.target.value as ViewMode)} 
                      className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg py-2 px-3 focus:ring-2 focus:ring-yellow-500 transition-all`} 
                      aria-label="View mode"
                    >
                      <option value="net">📊 Net (Consider Inventory)</option>
                      <option value="gross">📈 Gross (Total Required)</option>
                    </select>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'} p-4 rounded-lg`}>
                    <label className={`flex text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 items-center`}>
                      <span className="mr-2">📋</span>
                      Summary Mode
                    </label>
                    <select 
                      value={summaryMode} 
                      onChange={(e) => handleSummaryModeChange(e.target.value as SummaryMode)} 
                      className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg py-2 px-3 focus:ring-2 focus:ring-yellow-500 transition-all`} 
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
          <div id="inventory-section" className="mb-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-500/30 shadow-lg">
            <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
              <span className="mr-2">🎒</span>
              Inventory Management
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                    <span className="animate-spin mr-2">🔄</span>
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
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              >
                <span className="mr-2">✏️</span>
                Manual Entry
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4 text-center">
              Use OCR to automatically detect your inventory from screenshots, or enter items manually
            </p>

            {/* Current Inventory */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-semibold text-blue-300 flex items-center">
                  <span className="mr-2">📦</span>
                  Current Inventory ({Object.keys(inventory).length} items)
                </h4>
                <button 
                  onClick={handleClearInventory} 
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-all duration-200"
                  title="Clear all inventory"
                >
                  🗑️ Clear All
                </button>
              </div>
              {Object.keys(inventory).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No items in inventory. Use OCR scan or manual entry to add items.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {Object.entries(inventory).sort(([, qtyA], [, qtyB]) => qtyB - qtyA).map(([itemId, qty]) => (
                    <div key={itemId} className="flex justify-between items-center p-2 bg-gray-700/50 rounded text-sm">
                      <span className="text-gray-300 truncate mr-2" title={ITEMS[itemId]?.name || itemId}>
                        {ITEMS[itemId]?.name || itemId}: {qty.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleInventoryChange(itemId, 0)}
                        className="text-red-400 hover:text-red-300 text-xs ml-1 flex-shrink-0"
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
            <div id="crafting-section" className="mb-8">
              <div className="bg-gradient-to-r from-green-900/30 via-emerald-900/30 to-green-900/30 backdrop-blur-sm p-6 rounded-2xl border border-green-500/40 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-300 via-emerald-200 to-green-300 bg-clip-text text-transparent flex items-center">
                    <span className="mr-3 text-3xl">🌳</span>
                    Interactive Crafting Tree
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleExpandAll(craftingData)} 
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium text-white hover:shadow-lg transition-all duration-200"
                    >
                      📖 Expand All
                    </button>
                    <button 
                      onClick={() => handleCollapseAll(craftingData)} 
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs font-medium text-white hover:shadow-lg transition-all duration-200"
                    >
                      📕 Collapse All
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <CraftingNode
                    node={craftingData}
                    collapsedNodes={collapsedNodes}
                    onToggle={handleToggleNode}
                    getIconUrl={getIconUrl}
                    onNodeContextMenu={handleContextMenu}
                  />
                </div>
              </div>
            </div>
          )}

          {summaryData && (summaryData.materials || summaryData.xpGains) && (
            <div id="summary-section" className="mb-8">
              <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/40 shadow-2xl">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-200 to-purple-300 bg-clip-text text-transparent mb-6 flex items-center">
                  <span className="mr-3 text-3xl">📊</span>
                  {summaryData.title || "Material & XP Summary"}
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
                    onIngredientChange={(itemId, ingredient) => {
                      setSelectedIngredients(prev => ({ ...prev, [itemId]: ingredient }));
                    }}
                  />
                ) : (
                  <div className="text-center text-gray-400 py-8">
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">About</h2>
                
                {/* App Description */}
{/*                 <div className="mb-6">
                  <p className="text-gray-300 mb-3">This New World Crafting Calculator is an open-source project designed to help players plan their crafting efficiently.</p>
                  <p className="text-gray-300 mb-3">Version: {APP_VERSION}</p>
                </div> */}

                {/* Footer Content */}
                <div className="mb-6">
                  <div className="mb-4">
                    <img alt="New World Crafting Calculator" className="mx-auto mb-3 h-16 w-auto opacity-80" src="logo.png" />
                  </div>
                  <div className="space-y-3 text-gray-400 text-center">
                    <p className="text-sm font-medium">Created with ❤️ by <span className="text-yellow-400">Involvex</span></p>
                    <p className="text-xs">
                      Game data sourced from{' '}
                      <a 
                        href="https://nw-buddy.de" 
                        className="text-blue-400 hover:text-blue-300 underline decoration-dotted hover:decoration-solid transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        nw-buddy.de
                      </a>
                    </p>
                    <p className="text-xs text-gray-500">
                      New World Crafting Calculator v{APP_VERSION} • Open Source
                    </p>
                    <div className="pt-3 border-t border-gray-600/30">
                      <p className="text-xs text-gray-400 mb-2">💝 Like this project?</p>
                      <a 
                        href="https://paypal.me/involvex" 
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline decoration-dotted hover:decoration-solid transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Support development ☕
                      </a>
                    </div>
                    <div className="pt-2 border-t border-gray-600/30">
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <a 
                          href="https://github.com/involvex/newworld-dailycraft-calc" 
                          className="text-blue-400 hover:text-blue-300 underline decoration-dotted hover:decoration-solid transition-all"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          GitHub Repository
                        </a>
                        <span>•</span>
                        <a 
                          href="https://involvex.github.io/newworld-dailycraft-calc/" 
                          className="text-blue-400 hover:text-blue-300 underline decoration-dotted hover:decoration-solid transition-all"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Live Demo
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Update check button for Electron app */}
                {window.electronAPI?.updater && (
                  <button
                    onClick={async () => {
                      try {
                        await window.electronAPI?.updater.checkForUpdates();
                      } catch (err) {
                        console.error('Failed to check for updates:', err);
                      }
                    }}
                    className="mb-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    🔄 Check for Updates
                  </button>
                )}
                
                <button onClick={() => setShowAbout(false)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Close</button>
              </div>
            </div>
          )}

          {/* Manual Entry Modal */}
          {showManualEntry && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">📝 Manual Inventory Entry</h2>
                <div className="flex-1 overflow-y-auto">
                  <p className="text-gray-300 mb-4">
                    Enter your inventory items using the format: <code className="bg-gray-700 px-1 rounded">Item Name: Quantity</code>
                  </p>
                  <div className="mb-4 p-3 bg-gray-700 rounded text-sm text-gray-300">
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
                    className="w-full h-64 bg-gray-700 border border-gray-600 rounded p-3 text-white font-mono text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2 mt-4 flex-shrink-0">
                  <button
                    onClick={() => {
                      // Parse manual entry
                      const parsed = parseInventoryOCR(manualEntryText);
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    ✅ Apply to Inventory
                  </button>
                  <button
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualEntryText('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OCR Edit Modal */}
          {showOCREdit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">🔍 OCR Results</h2>
                <div className="flex-1 overflow-y-auto">
                  <p className="text-gray-300 mb-4">
                    Review and edit the detected items. Format: <code className="bg-gray-700 px-1 rounded">Item Name: Quantity</code>
                  </p>
                  <textarea
                    value={ocrEditText}
                    onChange={(e) => setOCREditText(e.target.value)}
                    className="w-full h-64 bg-gray-700 border border-gray-600 rounded p-3 text-white font-mono text-sm resize-none"
                    placeholder="OCR results will appear here..."
                  />
                </div>
                <div className="flex gap-2 mt-4 flex-shrink-0">
                  <button
                    onClick={() => {
                      // Parse OCR text
                      const parsed = parseInventoryOCR(ocrEditText);
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    ✅ Apply to Inventory
                  </button>
                  <button
                    onClick={() => captureAndProcessScreenshot()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={isProcessingOCR}
                  >
                    {isProcessingOCR ? '🔍 Scanning...' : '🔄 Scan Again'}
                  </button>
                  <button
                    onClick={() => {
                      setShowOCREdit(false);
                      setOCREditText('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Preset Modal */}
          {showCreatePreset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">Create New Preset</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Preset Name</label>
                  <input
                    type="text"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                    disabled={!presetNameInput.trim()}
                  >
                    ✅ Create Preset
                  </button>
                  <button
                    onClick={() => {
                      setPresetNameInput('');
                      setShowCreatePreset(false);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Preset Modal */}
          {showDeletePreset && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-red-300 mb-4">Delete Preset</h2>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete the preset <span className="font-bold text-yellow-300">"{selectedPreset}"</span>?
                  <br />
                  <span className="text-red-400 text-sm">This action cannot be undone.</span>
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
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => setShowDeletePreset(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete All Presets Modal */}
          {showDeleteAllPresets && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-red-300 mb-4">Delete All Custom Presets</h2>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete <span className="font-bold text-yellow-300">all custom presets</span>?
                  <br />
                  <span className="text-red-400 text-sm">This action cannot be undone.</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCustomPresets([]);
                      localStorage.removeItem('customPresets');
                      setShowDeleteAllPresets(false);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                  >
                    🗑️ Delete All
                  </button>
                  <button
                    onClick={() => setShowDeleteAllPresets(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Erase All Data Modal */}
          {showEraseAllData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-red-300 mb-4">⚠️ Erase All Data</h2>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to <span className="font-bold text-red-400">erase ALL data</span>?
                  <br />
                  This will delete:
                  <ul className="list-disc list-inside mt-2 text-sm text-gray-400">
                    <li>All custom presets</li>
                    <li>Inventory data</li>
                    <li>Bonus settings</li>
                    <li>All other saved data</li>
                  </ul>
                  <span className="text-red-400 text-sm font-bold">This action cannot be undone and will reload the page.</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                  >
                    🗑️ Erase Everything
                  </button>
                  <button
                    onClick={() => setShowEraseAllData(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {showToast && (
            <div className="fixed top-4 right-4 bg-gray-800 border border-yellow-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
              <div className="flex items-center">
                <span className="mr-2">ℹ️</span>
                <span className="text-sm">{toastMessage}</span>
                <button
                  onClick={() => setShowToast(false)}
                  className="ml-2 text-gray-400 hover:text-white transition-colors"
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
              className="fixed bottom-6 right-6 bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40"
              title="Back to Top"
            >
              <span className="text-lg">⬆️</span>
            </button>
          )}

          {/* Footer */}
          <footer className="text-center mt-12 py-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30">
            <div className="mb-4">
              <img alt="New World Crafting Calculator" className="mx-auto mb-3 h-16 w-auto opacity-80" src="logo.png" />
            </div>
            <div className="space-y-2 text-gray-400">
              <p className="text-sm font-medium">Created with ❤️ by <span className="text-yellow-400">Involvex</span></p>
              <p className="text-xs">
                Game data sourced from{' '}
                <a 
                  href="https://nw-buddy.de" 
                  className="text-blue-400 hover:text-blue-300 underline decoration-dotted hover:decoration-solid transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  nw-buddy.de
                </a>
              </p>
              <p className="text-xs text-gray-500">
                New World Crafting Calculator v{APP_VERSION} • Open Source
              </p>
              <div className="mt-3 pt-2 border-t border-gray-600/30">
                <p className="text-xs text-gray-400 mb-1">💝 Like this project?</p>
                <a 
                  href="https://paypal.me/involvex" 
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline decoration-dotted hover:decoration-solid transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Support development ☕
                </a>
              </div>
            </div>
          </footer>
        </div>  {/* Close container mx-auto div */}
      </div>    {/* Close bg-gradient-to-br div */}
    </React.Fragment>
  );
}

export default App;
