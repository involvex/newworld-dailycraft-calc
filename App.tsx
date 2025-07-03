import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { calculateCraftingTree, aggregateRawMaterials, aggregateAllComponents } from './services/craftingService';
import { ITEMS } from './data/items';
import { RECIPES } from './data/recipes';
import CraftingNode from './components/CraftingNode';
import SummaryList from './components/SummaryList';
import { Item, AllBonuses, BonusConfiguration, RawMaterial } from './types';


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
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [manualEntryText, setManualEntryText] = useState<string>('');
  const [showOCREdit, setShowOCREdit] = useState<boolean>(false);
  const [ocrEditText, setOCREditText] = useState<string>('');
  
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
    
    // Comprehensive item mappings with common OCR misreadings
    const itemMappings: Record<string, string> = {
      // Ores
      'iron ore': 'IRON_ORE', 'ironore': 'IRON_ORE', 'iron': 'IRON_ORE',
      'starmetal ore': 'STARMETAL_ORE', 'starmetalore': 'STARMETAL_ORE', 'starmetal': 'STARMETAL_ORE',
      'orichalcum ore': 'ORICHALCUM_ORE', 'orichalcumore': 'ORICHALCUM_ORE', 'orichalcum': 'ORICHALCUM_ORE',
      'silver ore': 'SILVER_ORE', 'silverore': 'SILVER_ORE', 'silver': 'SILVER_ORE',
      'gold ore': 'GOLD_ORE', 'goldore': 'GOLD_ORE', 'gold': 'GOLD_ORE',
      'platinum ore': 'PLATINUM_ORE', 'platinumore': 'PLATINUM_ORE', 'platinum': 'PLATINUM_ORE',
      
      // Ingots
      'iron ingot': 'IRON_INGOT', 'ironingot': 'IRON_INGOT',
      'steel ingot': 'STEEL_INGOT', 'steelingot': 'STEEL_INGOT', 'steel': 'STEEL_INGOT',
      'starmetal ingot': 'STARMETAL_INGOT', 'starmetalingot': 'STARMETAL_INGOT',
      'orichalcum ingot': 'ORICHALCUM_INGOT', 'orichalcumingot': 'ORICHALCUM_INGOT',
      'asmodeum': 'ASMODEUM',
      
      // Wood
      'green wood': 'GREEN_WOOD', 'greenwood': 'GREEN_WOOD',
      'aged wood': 'AGED_WOOD', 'agedwood': 'AGED_WOOD',
      'wyrdwood': 'WYRDWOOD', 'wyrd wood': 'WYRDWOOD',
      'ironwood': 'IRONWOOD', 'iron wood': 'IRONWOOD',
      'timber': 'TIMBER',
      'lumber': 'LUMBER',
      'wyrdwood planks': 'WYRDWOOD_PLANKS', 'wyrdwoodplanks': 'WYRDWOOD_PLANKS',
      'ironwood planks': 'IRONWOOD_PLANKS', 'ironwoodplanks': 'IRONWOOD_PLANKS',
      'glittering ebony': 'GLITTERING_EBONY', 'glitteringebony': 'GLITTERING_EBONY',
      
      // Leather
      'rawhide': 'RAWHIDE', 'raw hide': 'RAWHIDE',
      'thick hide': 'THICK_HIDE', 'thickhide': 'THICK_HIDE',
      'iron hide': 'IRON_HIDE', 'ironhide': 'IRON_HIDE',
      'coarse leather': 'COARSE_LEATHER', 'coarseleather': 'COARSE_LEATHER',
      'rugged leather': 'RUGGED_LEATHER', 'ruggedleather': 'RUGGED_LEATHER',
      'layered leather': 'LAYERED_LEATHER', 'layeredleather': 'LAYERED_LEATHER',
      'infused leather': 'INFUSED_LEATHER', 'infusedleather': 'INFUSED_LEATHER',
      'runic leather': 'RUNIC_LEATHER', 'runicleather': 'RUNIC_LEATHER',
      
      // Cloth
      'fibers': 'FIBERS', 'fiber': 'FIBERS',
      'silk threads': 'SILK_THREADS', 'silkthreads': 'SILK_THREADS',
      'wirefiber': 'WIREFIBER', 'wire fiber': 'WIREFIBER',
      'linen': 'LINEN',
      'sateen': 'SATEEN',
      'silk': 'SILK',
      'infused silk': 'INFUSED_SILK', 'infusedsilk': 'INFUSED_SILK',
      'phoenixweave': 'PHOENIXWEAVE', 'phoenix weave': 'PHOENIXWEAVE',
      
      // Other materials
      'charcoal': 'CHARCOAL',
      'flux': 'FLUX',
      'sandpaper': 'SANDPAPER', 'sand paper': 'SANDPAPER',
      'tannin': 'TANNIN',
      'crossweave': 'CROSSWEAVE', 'cross weave': 'CROSSWEAVE',
      'solvent': 'SOLVENT',
      'obsidian flux': 'OBSIDIAN_FLUX', 'obsidianflux': 'OBSIDIAN_FLUX',
      'obsidian sandpaper': 'OBSIDIAN_SANDPAPER', 'obsidiansandpaper': 'OBSIDIAN_SANDPAPER'
    };
    
    // Clean and normalize text
    const normalizedText = ocrText
      .toLowerCase()
      .replace(/[|\\]/g, ' ') // Replace common OCR artifacts
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^a-z0-9\s:.,]/g, ''); // Remove special chars except basic punctuation
    
    const lines = normalizedText.split('\n');
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;
      
      console.log(`Processing line: "${cleanLine}"`);
      
      // Simple pattern: "item name: number"
      const simpleMatch = cleanLine.match(/^(.+?):\s*(\d+)$/i);
      if (simpleMatch) {
        const itemName = simpleMatch[1].toLowerCase().trim();
        const quantity = parseInt(simpleMatch[2]);
        
        console.log(`Simple match found: "${itemName}" = ${quantity}`);
        
        if (itemMappings[itemName]) {
          foundItems[itemMappings[itemName]] = quantity;
          console.log(`Mapped: ${itemName} -> ${itemMappings[itemName]}: ${quantity}`);
        }
      }
    }
    
    console.log('Final parsed items:', foundItems);
    return foundItems;
  }, []);

  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const captureAndProcessScreenshot = useCallback(async () => {
    try {
      setIsProcessingOCR(true);
      
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => video.play().then(resolve).catch(reject);
        video.onerror = reject;
        setTimeout(reject, 5000);
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(video, 0, 0);
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
      
      const { data: { text } } = await Tesseract.recognize(canvas.toDataURL('image/png'), 'eng', {
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz :.,/-'
      });
      
      const filteredText = text.split('\n')
        .filter(line => {
          const l = line.toLowerCase().trim();
          return l && 
            /\d/.test(l) && 
            l.length > 3 && l.length < 50 && 
            !l.includes('fps') && 
            !l.includes('cpu') && 
            !l.includes('gpu') && 
            !l.includes('ram') && 
            !l.includes('inventory') && 
            !l.includes('decorate') && 
            !l.includes('smelting') && 
            !l.includes('leatherworking') && 
            !l.includes('fishing');
        })
        .join('\n');
      
      // Show filtered text in OCR edit modal
      setOCREditText(filteredText.substring(0, 2000));
      setShowOCREdit(true);
    } catch (error) {
      setShowManualEntry(true);
    } finally {
      setIsProcessingOCR(false);
    }
  }, []);

  return (

    <div className="bg-gray-900 text-gray-300 min-h-screen font-sans" style={{background: 'radial-gradient(ellipse at top, #232526 0%, #414345 100%)'}}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        <header className="mb-8 text-center">
          <img src="logo.png" alt="Logo" className="mx-auto mb-4 h-16 w-auto" />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-wider" style={{fontFamily: 'UnifrakturCook, cursive', color: '#e2b857', textShadow: '2px 2px 8px #000, 0 0 8px #e2b85799', letterSpacing: 2}}>New World Crafting Calculator</h1>
          <p className="text-lg text-gray-200 mt-2">A comprehensive crafting calculator for Amazon's New World MMO with automatic inventory detection via OCR.</p>
        </header>

        <div className="bg-gray-800/30 backdrop-blur-sm p-3 rounded-xl border border-yellow-900/40 mb-6 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-yellow-300 flex items-center gap-2">
              ⚙️ Settings
            </h3>
            <button
              onClick={() => {
                setShowAdvanced(!showAdvanced);
                localStorage.setItem('showAdvanced', JSON.stringify(!showAdvanced));
              }}
              className="px-3 py-1 rounded text-xs bg-yellow-700 text-white hover:bg-yellow-600 transition font-medium"
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-w-4xl mx-auto">
            <div>
              <label className="block text-xs text-yellow-300 mb-1 font-medium">Presets</label>
              <select
                onChange={(e) => {
                  const preset = presets.find(p => p.name === e.target.value);
                  if (preset?.items[0]) {
                    setSelectedItemId(preset.items[0].id);
                    setQuantity(preset.items[0].qty);
                  }
                  e.target.value = '';
                }}
                className="w-full bg-gray-700 border border-yellow-900/40 rounded py-1 px-2 text-yellow-100 text-sm"
              >
                <option value="">Select...</option>
                {presets.map(preset => (
                  <option key={preset.name} value={preset.name}>{preset.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-yellow-300 mb-1 font-medium">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full bg-gray-700 border border-yellow-900/40 rounded py-1 px-2 text-yellow-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-yellow-300 mb-1 font-medium">Item</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-gray-700 border border-yellow-900/40 rounded py-1 px-2 text-yellow-100 text-sm"
              >
                {filteredItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (T{item.tier})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-yellow-300 mb-1 font-medium">Amount</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={quantity}
                  min="1"
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 bg-gray-700 border border-yellow-900/40 rounded py-1 px-2 text-yellow-100 text-sm"
                />
                <button
                  onClick={() => setQuantity(q => q * 10)}
                  className="px-2 py-1 bg-yellow-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-yellow-600"
                  title="×10"
                >
                  ×10
                </button>
              </div>
            </div>
          </div>
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
            <div className="bg-gray-800/30 backdrop-blur-sm p-3 rounded-xl border border-yellow-900/40 mb-6 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-yellow-300 flex items-center gap-2">
                    📊 Summary
                  </h3>
                  <div className="flex rounded-lg bg-gray-700 border border-yellow-900/40 overflow-hidden">
                    <button
                      onClick={() => setSummaryMode('net')}
                      className={`px-3 py-1 text-sm font-medium transition ${
                        summaryMode === 'net'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                      }`}
                    >
                      Buy Order
                    </button>
                    <button
                      onClick={() => setSummaryMode('xp')}
                      className={`px-3 py-1 text-sm font-medium transition ${
                        summaryMode === 'xp'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                      }`}
                    >
                      XP Summary
                    </button>
                  </div>
                </div>
                
                {summaryMode === 'net' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-yellow-300 font-medium">Mode:</span>
                    <div className="flex rounded bg-gray-700 border border-yellow-900/40 overflow-hidden">
                      <button
                        onClick={() => setViewMode('net')}
                        className={`py-1 px-3 text-xs font-medium transition ${
                          viewMode === 'net'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                        }`}
                        title="Without yield bonuses"
                      >
                        Net
                      </button>
                      <button
                        onClick={() => setViewMode('gross')}
                        className={`py-1 px-3 text-xs font-medium transition ${
                          viewMode === 'gross'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-transparent text-yellow-100 hover:bg-gray-600'
                        }`}
                        title="With yield bonuses"
                      >
                        Gross
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {summaryMode === 'net' && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-yellow-900/40">
                  <button
                    onClick={() => {
                      const materials = netRequirementsWithInventory.filter(m => m.quantity > 0);
                      const text = materials.map(m => `${m.item.name}: ${Math.ceil(m.quantity)}`).join('\n');
                      navigator.clipboard.writeText(text);
                    }}
                    className="px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={generatePrismaticBuyList}
                    className="px-2 py-1 rounded text-xs bg-purple-600 text-white hover:bg-purple-700 transition font-medium"
                  >
                    ✨ Prismatics
                  </button>
                  <button
                    onClick={() => {
                      setShowManualEntry(true);
                    }}
                    className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 transition font-medium"
                  >
                    📝 Import
                  </button>
                  <button
                    onClick={captureAndProcessScreenshot}
                    disabled={isProcessingOCR}
                    className={`px-2 py-1 rounded text-xs transition font-medium ${
                      isProcessingOCR 
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                    title="Screenshot OCR"
                  >
                    {isProcessingOCR ? '⏳' : '📷'}
                  </button>
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="px-2 py-1 rounded text-xs bg-yellow-600 text-white hover:bg-yellow-700 transition font-medium"
                    title="Manual Entry"
                  >
                    ✏️ Manual
                  </button>
                  <button
                    onClick={() => {
                      const items = Object.entries(inventory).map(([id, qty]) => {
                        const item = ITEMS[id];
                        return `${item?.name || id}: ${qty}`;
                      }).join('\n');
                      alert(items || 'Inventory is empty');
                    }}
                    className="px-2 py-1 rounded text-xs bg-gray-600 text-white hover:bg-gray-700 transition font-medium"
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear all inventory?')) {
                        setInventory({});
                        localStorage.setItem('inventory', JSON.stringify({}));
                      }
                    }}
                    className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition font-medium"
                  >
                    🗑️ Clear
                  </button>
                </div>
              )}
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

        {showManualEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Manual Entry</h3>
              <p className="text-gray-300 text-sm mb-4">
                Enter items one per line:<br/>
                Format: "Item Name: Quantity"<br/>
                Example: Iron Ore: 1800
              </p>
              <textarea
                value={manualEntryText}
                onChange={(e) => setManualEntryText(e.target.value)}
                placeholder="Iron Ore: 1800\nCharcoal: 41\nThick Hide: 635"
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    if (manualEntryText.trim()) {
                      const parsedItems = parseInventoryOCR(manualEntryText);
                      if (Object.keys(parsedItems).length > 0) {
                        const newInventory = { ...inventory, ...parsedItems };
                        setInventory(newInventory);
                        localStorage.setItem('inventory', JSON.stringify(newInventory));
                        const itemList = Object.entries(parsedItems).map(([id, qty]) => {
                          const item = ITEMS[id];
                          return `${item?.name || id}: ${qty}`;
                        }).join('\n');
                        alert(`Added ${Object.keys(parsedItems).length} items:\n\n${itemList}`);
                        setShowManualEntry(false);
                        setManualEntryText('');
                      } else {
                        alert('No valid items found. Use format:\nIron Ore: 1800\nCharcoal: 41');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Add Items
                </button>
                <button
                  onClick={() => {
                    setShowManualEntry(false);
                    setManualEntryText('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showOCREdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-2xl w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">OCR Text Editor</h3>
              <p className="text-gray-300 text-sm mb-4">
                Clean up the OCR text below. Look for item names with numbers and format as:<br/>
                <span className="text-yellow-300">Item Name: Quantity</span><br/>
                Example: Iron Ore: 280, Steel Ingot: 266, Charcoal: 88
              </p>
              <textarea
                value={ocrEditText}
                onChange={(e) => setOCREditText(e.target.value)}
                className="w-full h-48 bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm font-mono"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    if (ocrEditText.trim()) {
                      const parsedItems = parseInventoryOCR(ocrEditText);
                      if (Object.keys(parsedItems).length > 0) {
                        const newInventory = { ...inventory, ...parsedItems };
                        setInventory(newInventory);
                        localStorage.setItem('inventory', JSON.stringify(newInventory));
                        const itemList = Object.entries(parsedItems).map(([id, qty]) => {
                          const item = ITEMS[id];
                          return `${item?.name || id}: ${qty}`;
                        }).join('\n');
                        alert(`Imported ${Object.keys(parsedItems).length} items from OCR:\n\n${itemList}`);
                        setShowOCREdit(false);
                        setOCREditText('');
                      } else {
                        alert('No valid items found in OCR text.');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Process Items
                </button>
                <button
                  onClick={() => {
                    setShowOCREdit(false);
                    setOCREditText('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
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
