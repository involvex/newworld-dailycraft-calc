import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ITEMS } from './data/items';
import { RECIPES } from './data/recipes';
import CraftingNode from './components/CraftingNode';
import SummaryList from './components/SummaryList';
import XPSummaryList from './components/XPSummaryList';
import ContextMenu from './components/ContextMenu';
import { Item, AllBonuses, BonusConfiguration } from './types';
import useCraftingTree from './hooks/useCraftingTree';
import useInventoryOCR from './hooks/useInventoryOCR';
import usePresets from './hooks/usePresets';
import useTreeCollapse from './hooks/useTreeCollapse';
import { findNodeById } from './utils/treeUtils';

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
  // Core state (move all useState above any useEffect) - Fixed hook rendering issue and preset state management
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
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Modal states
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [showOCREdit, setShowOCREdit] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);

  // Data states
  const [manualEntryText, setManualEntryText] = useState<string>('');
  const [ocrEditText, setOCREditText] = useState<string>('');
  const [isProcessingOCR, setIsProcessingOCR] = useState<boolean>(false);
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
    handleCollapseSubtree,
    handleExpandSubtree,
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
    setCollapsedNodes,
    setMultiItems,
    setSelectedItemId,
    setQuantity,
    restoreCollapsedNodes: treeRestoreCollapsedNodes,
    selectedPreset, // Pass selectedPreset from App.tsx
    setSelectedPreset, // Pass setSelectedPreset from App.tsx
    setInventory, // Pass setInventory from App.tsx
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
            alert('Data imported successfully!');
          } catch (error) {
            alert('Failed to import data. The file may be corrupted.');
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <React.Fragment>
      <div className="bg-gray-900 text-gray-300 min-h-screen font-sans app-gradient-bg">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          <header className="mb-6 text-center">
            <img src="logo.png" alt="New World Crafting Calculator" className="mx-auto mb-4 h-20 w-auto" />
            <h1 className="text-3xl font-bold text-yellow-300 mb-2">New World Crafting Calculator</h1>
            <p className="text-gray-400 text-sm">Plan your crafting efficiently with advanced material calculations</p>
          </header>

          {/* Navigation Bar */}
          <div className="mb-6 bg-gray-800/30 p-3 rounded-xl border border-gray-600/30 backdrop-blur-sm">
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <span className="text-sm text-gray-300 font-medium mr-2">Jump to:</span>
              <button
                onClick={() => document.getElementById('presets-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 rounded-md text-xs text-yellow-300 transition-all duration-200"
              >
                📋 Presets
              </button>
              <button
                onClick={() => document.getElementById('selection-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 rounded-md text-xs text-yellow-300 transition-all duration-200"
              >
                🎯 Item Selection
              </button>
              <button
                onClick={() => document.getElementById('inventory-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-md text-xs text-blue-300 transition-all duration-200"
              >
                🎒 Inventory
              </button>
              <button
                onClick={() => document.getElementById('crafting-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 rounded-md text-xs text-green-300 transition-all duration-200"
              >
                🌳 Crafting Tree
              </button>
              <button
                onClick={() => document.getElementById('summary-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-md text-xs text-purple-300 transition-all duration-200"
              >
                📊 Summary
              </button>
            </div>
          </div>

          {/* Quick Controls Bar */}
          <div className="mb-6 bg-gray-800/50 p-4 rounded-xl border border-yellow-900/30 backdrop-blur-sm">
            <div className="flex flex-wrap gap-3 items-center justify-center">
              <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-300 font-medium">View:</span>
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
              
              <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-300 font-medium">Summary:</span>
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
          </div>
          {/* Presets Section */}
          <div id="presets-section" className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-xl border border-yellow-900/40 shadow-lg">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Crafting Presets
            </h3>
            <div className="flex gap-2 flex-wrap items-center">
              <select
                title="Select a preset"
                value={selectedPreset}
                onChange={(e) => {
                  handlePresetSelect(e.target.value);
                }}
                className="flex-1 min-w-64 bg-gray-700 border border-yellow-900/40 rounded-lg py-2 px-3 text-yellow-100 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
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
                onClick={() => {
                  const name = prompt('Enter preset name:');
                  if (name !== null) {
                    handlePresetCreate(name);
                  }
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg text-sm text-white hover:shadow-lg transition-all duration-200 flex-shrink-0"
                title="Create Preset"
              >
                ➕ Create
              </button>
              <button
                onClick={() => {
                  if (selectedPreset && confirm(`Are you sure you want to delete the preset "${selectedPreset}"?`)) {
                    handlePresetDelete(selectedPreset);
                    setSelectedPreset('');
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
          <div id="selection-section" className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Left Side: Item Selection */}
              <div className="lg:col-span-3 bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border border-yellow-900/40 shadow-lg">
                <h3 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  Item Selection
                </h3>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="🔍 Search for items to craft..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white pr-10 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
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
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  aria-label="Select item"
                >
                  <option value="">📦 Select an item to craft...</option>
                  {filteredCraftableItems.map((item: Item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>

                {multiItems.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-yellow-900/30">
                    <h4 className="text-md font-semibold text-yellow-400 mb-2 flex items-center">
                      <span className="mr-2">📋</span>
                      Selected Items ({multiItems.length})
                    </h4>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {multiItems.map(item => (
                        <li key={item.id} className="text-sm text-gray-300 bg-gray-600/50 p-2 rounded flex items-center">
                          <span className="mr-2">📦</span>
                          {item.qty}x {ITEMS[item.id]?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Side: Quantity and Controls */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border border-yellow-900/40 shadow-lg">
                <h3 className="text-lg font-semibold text-yellow-300 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Controls
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-white text-center text-lg font-bold focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    aria-label="Quantity"
                    min="1"
                    max="10000"
                  />
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowSettings(true)} 
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                  >
                    ⚙️ Settings
                  </button>
                  <button 
                    onClick={() => setShowAbout(true)} 
                    className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
                  >
                    ℹ️ About
                  </button>
                </div>
              </div>
            </div>

            {showAdvanced && (
              <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl border border-yellow-900/40 shadow-lg">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                  <span className="mr-2">🔧</span>
                  Advanced Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <span className="mr-2">👁️</span>
                      View Mode
                    </label>
                    <select 
                      value={viewMode} 
                      onChange={(e) => handleViewModeChange(e.target.value as ViewMode)} 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-yellow-500 transition-all" 
                      aria-label="View mode"
                    >
                      <option value="net">📊 Net (Consider Inventory)</option>
                      <option value="gross">📈 Gross (Total Required)</option>
                    </select>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <span className="mr-2">📋</span>
                      Summary Mode
                    </label>
                    <select 
                      value={summaryMode} 
                      onChange={(e) => handleSummaryModeChange(e.target.value as SummaryMode)} 
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-yellow-500 transition-all" 
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
            <div id="crafting-section" className="mb-6">
              <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-6 rounded-xl border border-green-500/30 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-green-300 flex items-center">
                    <span className="mr-2">🌳</span>
                    Crafting Tree
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
            <div id="summary-section" className="mb-6">
              <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-6 rounded-xl border border-purple-500/30 shadow-lg">
                <h2 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
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

          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex-shrink-0">Settings</h2>
                <div className="space-y-6 overflow-y-auto pr-2">
                  {/* Interface Options */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Interface Options</h3>
                    <div className="flex items-center gap-4">
                      {/* OCR and Manual Entry buttons moved to main UI */}
                    </div>
                  </div>

                  {/* Data Management */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Data Management</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleExportData} className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500">💾 Export Data</button>
                      <button onClick={handleImportData} className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500">📁 Import Data</button>
                      <button onClick={() => {
                        if (confirm('Are you sure you want to delete all custom presets?')) {
                          setCustomPresets([]);
                          localStorage.removeItem('customPresets');
                        }
                      }} className="px-3 py-1 bg-red-700 rounded text-sm hover:bg-red-600">🗑️ Delete Presets</button>
                      <button onClick={() => {
                        if (confirm('Are you sure you want to erase ALL data? This cannot be undone.')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }} className="px-3 py-1 bg-red-800 rounded text-sm hover:bg-red-700">🗑️ Erase All Data</button>
                    </div>
                  </div>

                  {/* Global Hotkeys */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Global Hotkeys</h3>
                    <div className="text-sm text-gray-400">
                      <p>Ctrl+Alt+I - Toggle Calculator</p>
                      <p>Ctrl+Alt+O - Start OCR Detection</p>
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
                            <input type="number" aria-label={`${category} skill level`} value={config.skillLevel} onChange={(e) => handleBonusChange(category, 'skillLevel', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300">Gear Bonus (%)</label>
                            <input type="number" aria-label={`${category} gear bonus`} value={config.gearBonus * 100} onChange={(e) => handleBonusChange(category, 'gearBonus', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" />
                          </div>
                          <div className="col-span-2 flex items-center">
                            <input type="checkbox" aria-label={`${category} fort active`} checked={config.fortActive} onChange={(e) => handleBonusChange(category, 'fortActive', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" />
                            <label className="ml-2 block text-sm text-gray-300">Fort Bonus Active</label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="mt-6 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded flex-shrink-0">Close</button>
              </div>
            </div>
          )}
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              onExpand={() => {
                const node = findNodeById(craftingData, contextMenu.nodeId);
                if (node) {
                  handleExpandSubtree(node);
                }
                setContextMenu(null);
              }}
              onCollapse={() => {
                const node = findNodeById(craftingData, contextMenu.nodeId);
                if (node) {
                  handleCollapseSubtree(node);
                }
                setContextMenu(null);
              }}
              onRemove={() => handleRemoveNode(contextMenu.nodeId)}
            />
          )}

          {showAbout && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">About</h2>
                <p className="text-gray-300">This New World Crafting Calculator is an open-source project designed to help players plan their crafting efficiently.</p>
                <p className="text-gray-300 mt-2">Version: 0.9.8</p>
                <button onClick={() => setShowAbout(false)} className="mt-6 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Close</button>
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
                        alert('No valid items found. Please check your format: "Item Name: Quantity"');
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
                        alert('No valid items found. Please check your format: "Item Name: Quantity"');
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
                New World Crafting Calculator v0.9.8 • Open Source
              </p>
            </div>
          </footer>

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
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
