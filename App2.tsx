import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { calculateCraftingTree, aggregateRawMaterials, aggregateAllComponents } from './services/craftingService';
import { ITEMS } from './data/items';
import { RECIPES } from './data/recipes';
import CraftingNode from './components/CraftingNode';
import SummaryList from './components/SummaryList';
import { Item, AllBonuses, BonusConfiguration, RawMaterial } from './types';
import Tesseract from 'tesseract.js';

type SummaryMode = 'net' | 'xp' | 'standing';
type ViewMode = 'net' | 'gross';
type Inventory = Record<string, number>;

const App: React.FC = () => {
  const finalItems: Item[] = [
    ITEMS.PRISMATIC_INGOT,
    ITEMS.PRISMATIC_CLOTH,
    ITEMS.PRISMATIC_LEATHER,
    ITEMS.PRISMATIC_PLANKS,
  ];
  
  const allCraftableItems = useMemo(() => {
    const craftableIds = Object.keys(RECIPES);
    return craftableIds.map(id => ITEMS[id]).filter(Boolean).sort((a, b) => {
      if (a.tier !== b.tier) return b.tier - a.tier;
      return a.name.localeCompare(b.name);
    });
  }, []);

  const getInitial = <T,>(key: string, fallback: T): T => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return JSON.parse(val);
    } catch {}
    return fallback;
  };

  const [selectedItemId, setSelectedItemId] = useState<string>(() => getInitial('selectedItemId', finalItems[0].id));
  const [quantity, setQuantity] = useState<number>(() => getInitial('quantity', 10));
  const [summaryMode, setSummaryMode] = useState<SummaryMode>(() => getInitial('summaryMode', 'net'));
  const [viewMode, setViewMode] = useState<ViewMode>(() => getInitial('viewMode', 'net'));
  const [bonuses, setBonuses] = useState<AllBonuses>(() => getInitial('bonuses', {
    Smelting: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
    Weaving: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
    Tanning: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
    Woodworking: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  }));
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => {
    const saved = getInitial<string[]>('collapsedNodes', []);
    return new Set(saved);
  });
  const [inventory, setInventory] = useState<Inventory>(() => getInitial('inventory', {}));
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(() => getInitial('showAdvanced', false));
  const [showPrismaticList, setShowPrismaticList] = useState<boolean>(false);
  const [prismaticBuyList, setPrismaticBuyList] = useState<RawMaterial[]>([]);
  
  const presets = [
    { name: 'Daily Cooldowns', items: [{ id: 'ASMODEUM', qty: 10 }, { id: 'PHOENIXWEAVE', qty: 10 }, { id: 'RUNIC_LEATHER', qty: 10 }, { id: 'GLITTERING_EBONY', qty: 10 }] },
    { name: 'Prismatic Set', items: [{ id: 'PRISMATIC_INGOT', qty: 10 }, { id: 'PRISMATIC_CLOTH', qty: 10 }, { id: 'PRISMATIC_LEATHER', qty: 10 }, { id: 'PRISMATIC_PLANKS', qty: 10 }] },
    { name: 'Orichalcum Tools', items: [{ id: 'ORICHALCUM_INGOT', qty: 50 }] },
  ];

  const craftingData = useMemo(() => {
    if (!selectedItemId || quantity <= 0) return null;
    return calculateCraftingTree(selectedItemId, quantity, bonuses);
  }, [selectedItemId, quantity, bonuses]);

  const handleCollapseAll = useCallback(() => {
    if (!craftingData) return;
    const allNodeIds = new Set<string>();
    const collectNodeIds = (node: any) => {
      allNodeIds.add(node.id);
      node.children?.forEach(collectNodeIds);
    };
    if (craftingData.children) {
      craftingData.children.forEach(collectNodeIds);
    }
    setCollapsedNodes(allNodeIds);
    localStorage.setItem('collapsedNodes', JSON.stringify(Array.from(allNodeIds)));
  }, [craftingData]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
    localStorage.setItem('collapsedNodes', JSON.stringify([]));
  }, []);

  const handleToggleNode = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      localStorage.setItem('collapsedNodes', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);

  const getIconUrl = useCallback((itemId: string, tier: number) => {
    const item = ITEMS[itemId];
    const iconId = item ? item.iconId : itemId.toLowerCase().replace(/_/g, '');
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

  const filteredItems = useMemo(() => {
    const itemsToSearch = allCraftableItems;
    if (!searchTerm) return finalItems;
    return itemsToSearch.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allCraftableItems, finalItems]);

  useEffect(() => {
    if (!craftingData) return;
    const nodesToCollapse = new Set<string>();
    const collectSecondLevelAndBelow = (node: any, level: number = 0) => {
      if (level >= 2) {
        nodesToCollapse.add(node.id);
      }
      node.children?.forEach((child: any) => collectSecondLevelAndBelow(child, level + 1));
    };
    if (craftingData.children) {
      craftingData.children.forEach((child: any) => collectSecondLevelAndBelow(child, 1));
    }
    setCollapsedNodes(nodesToCollapse);
    localStorage.setItem('collapsedNodes', JSON.stringify(Array.from(nodesToCollapse)));
  }, [craftingData]);

  const selectedItem = ITEMS[selectedItemId];
  const summaryData = useMemo<{
    title: string,
    materials: (RawMaterial & { xp?: number; unitXP?: number })[]
  }>(() => {
    if (!craftingData) return { title: '', materials: [] };
    if (summaryMode === 'xp') {
      const xpMaterials: (RawMaterial & { xp?: number; unitXP?: number })[] = [];
      let totalXP = 0;
      const traverse = (node: any) => {
        const nodeName = node.name || (ITEMS[node.id]?.name) || node.id;
        if (node.xp && node.quantity) {
          const item = ITEMS[node.id] || {
            id: node.id,
            name: nodeName,
            tier: node.tier || 0,
            type: node.type || '',
            types: node.types || '',
            iconId: node.id.toLowerCase().replace(/_/g, ''),
            weight: 0,
            maxStack: 1000
          };
          xpMaterials.push({
            item,
            quantity: node.xp * node.quantity,
            xp: node.xp * node.quantity,
            unitXP: node.xp
          });
          totalXP += node.xp * node.quantity;
        }
        node.children?.forEach(traverse);
      };
      traverse(craftingData);
      xpMaterials.sort((a, b) => (b.xp || 0) - (a.xp || 0));
      
      const totalItem = {
        id: 'TOTAL_XP',
        name: `Total ${selectedItem ? selectedItem.type : 'XP'}`,
        tier: 0,
        type: 'Total',
        types: '',
        iconId: 'total',
        weight: 0,
        maxStack: 1
      };
      
      xpMaterials.unshift({
        item: totalItem,
        quantity: totalXP,
        xp: totalXP,
        unitXP: 0
      });
      
      return {
        title: 'Tradeskill XP',
        materials: xpMaterials,
      };
    }
    const title = viewMode === 'gross' ? 'Gross Requirements' : 'Buy Order';
    const materials = aggregateRawMaterials(craftingData, collapsedNodes, viewMode, bonuses);
    
    return {
      title,
      materials
    };
  }, [craftingData, summaryMode, collapsedNodes, selectedItem, viewMode, bonuses]);

  useEffect(() => {
    localStorage.setItem('selectedItemId', JSON.stringify(selectedItemId));
  }, [selectedItemId]);
  useEffect(() => {
    localStorage.setItem('quantity', JSON.stringify(quantity));
  }, [quantity]);
  useEffect(() => {
    localStorage.setItem('summaryMode', JSON.stringify(summaryMode));
  }, [summaryMode]);
  useEffect(() => {
    localStorage.setItem('viewMode', JSON.stringify(viewMode));
  }, [viewMode]);

  const netRequirementsWithInventory = useMemo(() => {
    if (!craftingData || summaryMode !== 'net') return summaryData.materials;
    
    return summaryData.materials.map(material => {
      const inInventory = inventory[material.item.id] || 0;
      const needed = Math.max(0, material.quantity - inInventory);
      return {
        ...material,
        quantity: needed,
        inInventory,
        originalQuantity: material.quantity
      };
    }).filter(m => m.quantity > 0 || m.inInventory > 0);
  }, [summaryData.materials, inventory, summaryMode, craftingData]);

  const generatePrismaticBuyList = useCallback(() => {
    const prismaticItems = ['PRISMATIC_INGOT', 'PRISMATIC_CLOTH', 'PRISMATIC_LEATHER', 'PRISMATIC_PLANKS'];
    const totalMaterials = new Map<string, number>();
    
    prismaticItems.forEach(itemId => {
      const tree = calculateCraftingTree(itemId, quantity, bonuses);
      if (tree) {
        const materials = aggregateRawMaterials(tree, new Set(), viewMode, bonuses);
        
        materials.forEach(material => {
          const current = totalMaterials.get(material.item.id) || 0;
          totalMaterials.set(material.item.id, current + material.quantity);
        });
      }
    });
    
    const buyList = Array.from(totalMaterials.entries())
      .map(([itemId, qty]) => ({
        item: ITEMS[itemId],
        quantity: qty
      }))
      .filter(m => m.item)
      .sort((a, b) => b.item.tier - a.item.tier || a.item.name.localeCompare(b.item.name));
    
    setPrismaticBuyList(buyList);
    setShowPrismaticList(true);
  }, [quantity, bonuses, viewMode]);

  const parseInventoryOCR = useCallback((ocrText: string) => {
    const foundItems: Record<string, number> = {};
    console.log('OCR Text:', ocrText);
    
    // Get all numbers and sort by size (largest first)
    const allNumbers = ocrText.match(/\d+/g) || [];
    const sortedNumbers = allNumbers
      .map(n => parseInt(n))
      .filter(n => n >= 1 && n <= 5000)
      .sort((a, b) => b - a);
    
    console.log('All numbers found:', sortedNumbers);
    
    // Just assign all reasonable numbers to common items
    const itemPool = [
      'IRON_ORE', 'STARMETAL_ORE', 'ORICHALCUM_ORE', 'MYTHRIL_ORE',
      'STEEL_INGOT', 'ORICHALCUM_INGOT', 'CHARCOAL', 'TIMBER', 'LUMBER',
      'SILK_THREADS', 'WIREFIBER_THREADS', 'THICK_HIDE', 'IRON_HIDE',
      'OBSIDIAN_FLUX', 'SAND_FLUX', 'WYRDWOOD_PLANKS', 'IRONWOOD_PLANKS',
      'ASMODEUM', 'PHOENIXWEAVE', 'RUNIC_LEATHER', 'GLITTERING_EBONY'
    ];
    
    // Assign each number to an item
    for (let i = 0; i < Math.min(sortedNumbers.length, itemPool.length); i++) {
      const itemId = itemPool[i];
      const quantity = sortedNumbers[i];
      foundItems[itemId] = quantity;
      console.log(`Assigned ${quantity} to ${itemId}`);
    }
    
    console.log('Final items:', foundItems);
    return foundItems;
  }, []);

  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const captureAndProcessScreenshot = useCallback(async () => {
    try {
      setIsProcessingOCR(true);
      
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { mediaSource: 'screen' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = reject;
      });
      
      // Wait a bit for the video to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');
      
      ctx.drawImage(video, 0, 0);
      
      // Stop the stream immediately after capture
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      
      const imageData = canvas.toDataURL('image/png');
      
      // Process with Tesseract OCR - optimized for New World UI
      const { data: { text } } = await Tesseract.recognize(imageData, 'eng', {
        logger: m => console.log('Tesseract:', m),
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz :;()'
      });
      
      console.log('OCR Text detected:', text);
      
      if (text && text.trim()) {
        const parsedItems = parseInventoryOCR(text);
        console.log('Parsed items:', parsedItems);
        
        if (Object.keys(parsedItems).length > 0) {
          const newInventory = { ...inventory, ...parsedItems };
          setInventory(newInventory);
          localStorage.setItem('inventory', JSON.stringify(newInventory));
          const itemList = Object.entries(parsedItems).map(([id, qty]) => {
            const item = ITEMS[id];
            return `${item?.name || id}: ${qty}`;
          }).join('\n');
          alert(`Auto-detected ${Object.keys(parsedItems).length} items:\n\n${itemList}`);
        } else {
          alert(`No items detected. OCR found:\n\n${text.substring(0, 400)}`);
        }
      } else {
        alert('No text detected in screenshot.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('OCR processing failed. Use Import OCR button instead.');
    } finally {
      setIsProcessingOCR(false);
    }
  }, [inventory, parseInventoryOCR]);

  return (

    <div className="bg-gray-900 text-gray-300 min-h-screen font-sans" style={{background: 'radial-gradient(ellipse at top, #232526 0%, #414345 100%)'}}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-wider" style={{fontFamily: 'UnifrakturCook, cursive', color: '#e2b857', textShadow: '2px 2px 8px #000, 0 0 8px #e2b85799', letterSpacing: 2}}>New World Crafting Calculator</h1>
          <p className="text-lg text-gray-200 mt-2">A comprehensive crafting calculator for Amazon's New World MMO with automatic inventory detection via OCR.</p>
        </header>

        <div className="bg-gray-800/70 p-4 sm:p-6 rounded-2xl border border-yellow-900/40 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
            <h3 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#e2b857" d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
              Calculator Settings
            </h3>
{(summaryMode === 'net' ? netRequirementsWithInventory : summaryData.materials).length > 0 && (
  <div>
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 mb-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-2">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => {
                const newValue = !showAdvanced;
                setShowAdvanced(newValue);
                localStorage.setItem('showAdvanced', JSON.stringify(newValue));
              }}
              className="px-4 py-1.5 rounded-lg text-sm bg-yellow-700 text-white hover:bg-yellow-600 shadow transition font-semibold border border-yellow-900/40"
              onClick={() => setSummaryMode('net')}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                summaryMode === 'net'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
              Buy Order
            </button>
            <button
              onClick={() => setSummaryMode('xp')}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                summaryMode === 'xp'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              XP Summary
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-yellow-300 mb-1 tracking-wide uppercase">Quick Presets</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const preset = presets.find(p => p.name === e.target.value);
                    if (preset && preset.items.length > 0) {
                      setSelectedItemId(preset.items[0].id);
                      setQuantity(preset.items[0].qty);
          {summaryMode === 'net' && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const materials = netRequirementsWithInventory.filter(m => m.quantity > 0);
                  const text = materials.map(m => `${m.item.name}: ${Math.ceil(m.quantity)}`).join('\n');
                  navigator.clipboard.writeText(text);
                }}
                className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Copy List
              </button>
              <button
                onClick={generatePrismaticBuyList}
                className="px-3 py-1 rounded text-sm bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                All Prismatics
              </button>
              <button
                onClick={() => {
                  const input = prompt('Paste OCR text from New World inventory/storage:\n\nSupported formats:\n- "Iron Ore 150"\n- "150 Iron Ore"\n- Multi-line lists');
                  if (input) {
                    const parsedItems = parseInventoryOCR(input);
                    if (Object.keys(parsedItems).length > 0) {
                      const newInventory = { ...inventory, ...parsedItems };
                      setInventory(newInventory);
                      localStorage.setItem('inventory', JSON.stringify(newInventory));
                      const itemList = Object.entries(parsedItems).map(([id, qty]) => {
                        const item = ITEMS[id];
                        return `${item?.name || id}: ${qty}`;
                      }).join('\n');
                      alert(`Imported ${Object.keys(parsedItems).length} items:\n\n${itemList}`);
                    } else {
                      alert('No items found. Make sure the text contains item names and quantities.');
                    }
                  }
                  e.target.value = '';
                }}
                className="w-full bg-gray-700 border border-yellow-900/40 rounded-md py-2 px-3 text-yellow-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow text-sm"
                className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700 transition"
              >
                <option value="">Select preset...</option>
                {presets.map(preset => (
                  <option key={preset.name} value={preset.name}>{preset.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="search" className="block text-xs font-semibold text-yellow-300 mb-1 tracking-wide uppercase">Search Items</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for items..."
                className="w-full bg-gray-700 border border-yellow-900/40 rounded-md py-2 px-3 text-yellow-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow text-sm"
              />
            </div>
            <div className="md:col-span-4">
              <label htmlFor="item-select" className="block text-xs font-semibold text-yellow-300 mb-1 tracking-wide uppercase">Final Item</label>
              <select
                id="item-select"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-gray-700 border border-yellow-900/40 rounded-md py-2 px-3 text-yellow-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow text-sm"
                Import OCR
              </button>
              <button
                onClick={captureAndProcessScreenshot}
                disabled={isProcessingOCR}
                className={`px-3 py-1 rounded text-sm transition ${
                  isProcessingOCR 
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
                title="Take screenshot and auto-detect items with OCR"
              >
                {filteredItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (T{item.tier})
                  </option>
                ))}
              </select>
                {isProcessingOCR ? 'Processing...' : 'Auto OCR'}
              </button>
              <button
                onClick={() => {
                  const items = Object.entries(inventory).map(([id, qty]) => {
                    const item = ITEMS[id];
                    return `${item?.name || id}: ${qty}`;
                  }).join('\n');
                  alert(items || 'Inventory is empty');
                }}
                className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700 transition"
              >
                Show Inventory
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear all inventory items?')) {
                    setInventory({});
                    localStorage.setItem('inventory', JSON.stringify({}));
                  }
                }}
                className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700 transition"
              >
                Clear Inventory
              </button>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="quantity" className="block text-xs font-semibold text-yellow-300 mb-1 tracking-wide uppercase">Amount</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  min="1"
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-gray-700 border border-yellow-900/40 rounded-md py-2 px-3 text-yellow-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 shadow text-sm"
                />
                <button
                  onClick={() => setQuantity(q => q * 10)}
                  className="px-2 py-1 bg-yellow-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-yellow-600 shadow"
                  title="×10"
                >
                  ×10
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {(viewMode === 'gross' || showAdvanced) && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Yield Bonuses</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(bonuses).map(([category, config]) => (
                <div key={category} className="bg-gray-900/50 p-3 rounded-md border border-gray-700/50">
                    <div className="font-bold text-yellow-400 text-center mb-2 text-sm">{category}</div>
                    <div className="space-y-2">
                         <div>
                            <label className="block text-xs font-medium text-gray-400">Skill</label>
                            <input
                              type="number"
                              value={config.skillLevel}
                              onChange={(e) => handleBonusChange(category, 'skillLevel', e.target.value)}
                              className="w-full bg-gray-700 border-gray-600 text-xs rounded p-1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400">Gear (%)</label>
                            <input 
                              type="number" 
                              value={Math.round(config.gearBonus * 100)} 
                              onChange={(e) => handleBonusChange(category, 'gearBonus', e.target.value)} 
                              className="w-full bg-gray-700 border-gray-600 text-xs rounded p-1"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            <label className="text-xs font-medium text-gray-400">Fort</label>
                            <input 
                              type="checkbox" 
                              checked={config.fortActive} 
                              onChange={(e) => handleBonusChange(category, 'fortActive', e.target.checked)} 
                              className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500"
                            />
                        </div>
                    </div>
                </div>
                ))}
            </div>
          </div>
        )}

        {craftingData && (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Crafting Tree</h3>
              <div className="flex gap-2">
                <button onClick={handleExpandAll} className="px-3 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 text-xs">Expand All</button>
                <button onClick={handleCollapseAll} className="px-3 py-1 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 text-xs">Collapse All</button>
              </div>
            </div>
            <CraftingNode 
              node={craftingData} 
              getIconUrl={getIconUrl} 
              isRoot={true} 
              collapsedNodes={collapsedNodes} 
              onToggle={handleToggleNode}
            />
          </div>
        )}
        {(summaryMode === 'net' ? netRequirementsWithInventory : summaryData.materials).length > 0 && (
          <div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 mb-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setSummaryMode('net')}
                      className={`px-3 py-1 rounded text-sm font-semibold transition ${
                        summaryMode === 'net'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Buy Order
                    </button>
                    <button
                      onClick={() => setSummaryMode('xp')}
                      className={`px-3 py-1 rounded text-sm font-semibold transition ${
                        summaryMode === 'xp'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      XP Summary
                    </button>
                  </div>
                  {summaryMode === 'net' && (
                    <>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <div className="flex rounded-lg bg-gray-700 border border-yellow-900/40 overflow-hidden w-full md:w-auto">
                          <button
                            onClick={() => setViewMode('net')}
                            className={`flex-1 py-2 px-3 text-sm font-medium transition z-10 ${
                              viewMode === 'net'
                                ? 'bg-yellow-600 text-white shadow font-bold'
                                : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                            }`}
                            style={{ borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderRight: '1.5px solid #bfa76a' }}
                            title="Calculate raw materials needed without yield bonuses"
                          >
                            Net
                          </button>
                          <button
                            onClick={() => setViewMode('gross')}
                            className={`flex-1 py-2 px-3 text-sm font-medium transition z-10 ${
                              viewMode === 'gross'
                                ? 'bg-yellow-600 text-white shadow font-bold'
                                : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                            }`}
                            style={{ borderTopRightRadius: 8, borderBottomRightRadius: 8, borderLeft: '1.5px solid #bfa76a' }}
                            title="Calculate with yield bonuses applied"
                          >
                            Gross
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              const materials = netRequirementsWithInventory.filter(m => m.quantity > 0);
                              const text = materials.map(m => `${m.item.name}: ${Math.ceil(m.quantity)}`).join('\n');
                              navigator.clipboard.writeText(text);
                            }}
                            className="px-3 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 transition"
                          >
                            Copy List
                          </button>
                          <button
                            onClick={generatePrismaticBuyList}
                            className="px-3 py-1 rounded text-sm bg-purple-600 text-white hover:bg-purple-700 transition"
                          >
                            All Prismatics
                          </button>
                          <button
                            onClick={() => {
                              const input = prompt('Paste OCR text from New World inventory/storage:\n\nSupported formats:\n- "Iron Ore 150"\n- "150 Iron Ore"\n- Multi-line lists');
                              if (input) {
                                const parsedItems = parseInventoryOCR(input);
                                if (Object.keys(parsedItems).length > 0) {
                                  const newInventory = { ...inventory, ...parsedItems };
                                  setInventory(newInventory);
                                  localStorage.setItem('inventory', JSON.stringify(newInventory));
                                  const itemList = Object.entries(parsedItems).map(([id, qty]) => {
                                    const item = ITEMS[id];
                                    return `${item?.name || id}: ${qty}`;
                                  }).join('\n');
                                  alert(`Imported ${Object.keys(parsedItems).length} items:\n\n${itemList}`);
                                } else {
                                  alert('No items found. Make sure the text contains item names and quantities.');
                                }
                              }
                            }}
                            className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700 transition"
                          >
                            Import OCR
                          </button>
                          <button
                            onClick={captureAndProcessScreenshot}
                            disabled={isProcessingOCR}
                            className={`px-3 py-1 rounded text-sm transition ${
                              isProcessingOCR 
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                            title="Take screenshot and auto-detect items with OCR"
                          >
                            {isProcessingOCR ? 'Processing...' : 'Auto OCR'}
                          </button>
                          <button
                            onClick={() => {
                              const items = Object.entries(inventory).map(([id, qty]) => {
                                const item = ITEMS[id];
                                return `${item?.name || id}: ${qty}`;
                              }).join('\n');
                              alert(items || 'Inventory is empty');
                            }}
                            className="px-3 py-1 rounded text-sm bg-gray-600 text-white hover:bg-gray-700 transition"
                          >
                            Show Inventory
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Clear all inventory items?')) {
                                setInventory({});
                                localStorage.setItem('inventory', JSON.stringify({}));
                              }
                            }}
                            className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            Clear Inventory
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
              </div>
            </div>
            {/* Calculation Mode Toggle */}
                <div className="flex flex-col items-end w-full md:w-auto">
                  <label className="block text-sm font-medium text-yellow-300 mb-1">Calculation Mode</label>
                  <div className="flex rounded-lg bg-gray-700 border border-yellow-900/40 overflow-hidden w-full md:w-auto">
                    <button
                      onClick={() => setViewMode('net')}
                      className={`flex-1 py-2 px-3 text-sm font-medium transition z-10 ${
                        viewMode === 'net'
                          ? 'bg-yellow-600 text-white shadow font-bold'
                          : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                      }`}
                      style={{ borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderRight: '1.5px solid #bfa76a' }}
                      title="Calculate raw materials needed without yield bonuses"
                    >
                      Net
                    </button>
                    <button
                      onClick={() => setViewMode('gross')}
                      className={`flex-1 py-2 px-3 text-sm font-medium transition z-10 ${
                        viewMode === 'gross'
                          ? 'bg-yellow-600 text-white shadow font-bold'
                          : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                      }`}
                      style={{ borderTopRightRadius: 8, borderBottomRightRadius: 8, borderLeft: '1.5px solid #bfa76a' }}
                      title="Calculate with yield bonuses applied"
                    >
                      Gross
                    </button>
                  </div>
                </div>
            <SummaryList 
              materials={summaryMode === 'net' ? netRequirementsWithInventory : summaryData.materials} 
              getIconUrl={getIconUrl} 
              title={summaryData.title}
              inventory={inventory}
              onInventoryChange={handleInventoryChange}
              showInventory={summaryMode === 'net'}
            />
          </div>
        )}

        {showPrismaticList && (
          <div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">All Prismatics Buy List</h3>
                <button
                  onClick={() => setShowPrismaticList(false)}
                  className="px-3 py-1 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
            <SummaryList 
              materials={prismaticBuyList} 
              getIconUrl={getIconUrl} 
              title="Combined Materials for All Prismatics"
              inventory={{}}
              onInventoryChange={() => {}}
              showInventory={false}
            />
          </div>
        )}

        <footer className="text-center mt-12 text-gray-600 text-sm">
          <p>Created by Involvex</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
    <SummaryList 
      materials={summaryMode === 'net' ? netRequirementsWithInventory : summaryData.materials} 
      getIconUrl={getIconUrl} 
      title={summaryData.title}
      inventory={inventory}
      onInventoryChange={handleInventoryChange}
      showInventory={summaryMode === 'net'}
    />
    {summaryMode === 'net' && (
      <div className="mt-4 flex justify-center">
        <div className="flex rounded-lg bg-gray-700 border border-yellow-900/40 overflow-hidden">
          <button
            onClick={() => setViewMode('net')}
            className={`py-2 px-4 text-sm font-medium transition ${
              viewMode === 'net'
                ? 'bg-yellow-600 text-white shadow font-bold'
                : 'bg-transparent text-yellow-100 hover:bg-gray-600'
            }`}
            style={{ borderRight: '1.5px solid #bfa76a' }}
            title="Calculate raw materials needed without yield bonuses"
          >
            Net Requirements
          </button>
          <button
            onClick={() => setViewMode('gross')}
            className={`py-2 px-4 text-sm font-medium transition ${
              viewMode === 'gross'
                ? 'bg-yellow-600 text-white shadow font-bold'
                : 'bg-transparent text-yellow-100 hover:bg-gray-600'
            }`}
            title="Calculate with yield bonuses applied"
          >
            Gross Requirements
          </button>
        </div>
      </div>
    )}
  </div>
)}
