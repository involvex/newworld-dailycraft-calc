import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { calculateCraftingTree, aggregateRawMaterials } from './services/craftingService';
import { ITEMS } from './data/items';
import { RECIPES } from './data/recipes';
import CraftingNode from './components/CraftingNode';
import SummaryList from './components/SummaryList';
import { Item, AllBonuses, BonusConfiguration, RawMaterial } from './types';

// Types
type SummaryMode = 'net' | 'xp';
type ViewMode = 'net' | 'gross';
type Inventory = Record<string, number>;

// Constants
const FINAL_ITEMS = [ITEMS.PRISMATIC_INGOT, ITEMS.PRISMATIC_CLOTH, ITEMS.PRISMATIC_LEATHER, ITEMS.PRISMATIC_PLANKS];
const PRISMATIC_ITEMS = ['PRISMATIC_INGOT', 'PRISMATIC_CLOTH', 'PRISMATIC_LEATHER', 'PRISMATIC_PLANKS'];
const DEFAULT_BONUSES = {
  Smelting: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  Weaving: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  Tanning: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
  Woodworking: { skillLevel: 250, gearBonus: 0.1, fortActive: true },
};
const PRESETS = [
  { name: 'Daily Cooldowns', items: [{ id: 'PRISMATIC_INGOT', qty: 10 }, { id: 'PRISMATIC_CLOTH', qty: 10 }, { id: 'PRISMATIC_LEATHER', qty: 10 }, { id: 'PRISMATIC_PLANKS', qty: 10 },{ id: 'ASMODEUM', qty: 10 }, { id: 'PHOENIXWEAVE', qty: 10 }, { id: 'RUNIC_LEATHER', qty: 10 }, { id: 'GLITTERING_EBONY', qty: 10 }] },
  { name: 'Prismatic Set', items: [{ id: 'PRISMATIC_INGOT', qty: 10 }, { id: 'PRISMATIC_CLOTH', qty: 10 }, { id: 'PRISMATIC_LEATHER', qty: 10 }, { id: 'PRISMATIC_PLANKS', qty: 10 }] },
];
const ITEM_MAPPINGS = {
  'iron ore': 'IRON_ORE', 'steel ingot': 'STEEL_INGOT', 'starmetal ingot': 'STARMETAL_INGOT',
  'orichalcum ore': 'ORICHALCUM_ORE', 'starmetal ore': 'STARMETAL_ORE', 'charcoal': 'CHARCOAL',
  'thick hide': 'THICK_HIDE', 'timber': 'TIMBER', 'lumber': 'LUMBER', 'fiber': 'FIBERS',
  'linen': 'LINEN', 'silk': 'SILK', 'reagents': 'REAGENTS'
};
const COMMON_ITEMS = [
  'Iron Ore', 'Orichalcum Ore', 'Starmetal Ore', 'Steel Ingot', 'Starmetal Ingot', 
  'Charcoal', 'Thick Hide', 'Linen', 'Fiber', 'Lumber', 'Timber', 'Silk', 
  'Rawhide', 'Green Wood', 'Aged Wood', 'Silver Ore', 'Gold Ore', 'Mythril Ore',
  'Reagents', 'Coarse Leather', 'Rugged Leather', 'Wyrdwood', 'Ironwood',
  'Sand Flux', 'Obsidian Flux', 'Hemp', 'Cotton', 'Wirefiber', 'Silkweed',
  'Iron Ingot', 'Orichalcum Ingot', 'Platinum Ore', 'Lodestone', 'Fae Iron',
  'Voidmetal', 'Cinnabar', 'Tolvium', 'Azoth', 'Quintessence', 'Sateen',
  'Phoenixweave', 'Runic Leather', 'Layered Leather', 'Glittering Ebony',
  'Asmodeum', 'Void Ore', 'Scalecloth', 'Infused Leather', 'Barbvine',
  'Blisterweave', 'Scarhide', 'Shadowcloth', 'Voidbent Ingot'
];

const getInitial = <T,>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};

const App: React.FC = () => {
  const allCraftableItems = useMemo(() => 
    Object.keys(RECIPES).map(id => ITEMS[id]).filter(Boolean)
      .sort((a, b) => a.tier !== b.tier ? b.tier - a.tier : a.name.localeCompare(b.name))
  , []);

  // Core state
  const [selectedItemId, setSelectedItemId] = useState(() => getInitial('selectedItemId', FINAL_ITEMS[0].id));
  const [quantity, setQuantity] = useState(() => getInitial('quantity', 10));
  const [multiItems, setMultiItems] = useState(() => getInitial('multiItems', []));
  const [summaryMode, setSummaryMode] = useState<SummaryMode>(() => getInitial('summaryMode', 'net'));
  const [viewMode, setViewMode] = useState<ViewMode>(() => getInitial('viewMode', 'net'));
  const [bonuses, setBonuses] = useState<AllBonuses>(() => getInitial('bonuses', DEFAULT_BONUSES));
  const [collapsedNodes, setCollapsedNodes] = useState(() => new Set(getInitial<string[]>('collapsedNodes', [])));
  const [inventory, setInventory] = useState<Inventory>(() => getInitial('inventory', {}));
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(() => getInitial('showAdvanced', false));
  const [manualMode, setManualMode] = useState(() => getInitial('manualMode', false));
  const [selectedPreset, setSelectedPreset] = useState('');
  
  // Modal states
  const [showPrismaticList, setShowPrismaticList] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showOCREdit, setShowOCREdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showCreatePreset, setShowCreatePreset] = useState(false);
  
  // Data states
  const [prismaticBuyList, setPrismaticBuyList] = useState<RawMaterial[]>([]);
  const [customPresets, setCustomPresets] = useState(() => getInitial('customPresets', []));
  const [manualEntryText, setManualEntryText] = useState('');
  const [ocrEditText, setOCREditText] = useState('');
  const [presetName, setPresetName] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const craftingData = useMemo(() => {
    if (multiItems.length > 0) {
      // Create individual trees for each item
      const trees = multiItems.map(({ id, qty }) => calculateCraftingTree(id, qty, bonuses)).filter(Boolean);
      
      if (trees.length === 0) return null;
      if (trees.length === 1) return trees[0];
      
      // Create a virtual root node for multiple items
      return {
        id: 'ROOT>MULTI',
        item: { id: 'MULTI', name: 'Multiple Items', tier: 0, type: 'Virtual', types: '', iconId: 'multi', weight: 0, maxStack: 1 },
        quantity: 1,
        totalQuantity: multiItems.reduce((sum, item) => sum + item.qty, 0),
        yieldBonus: 0,
        children: trees
      };
    }
    return selectedItemId && quantity > 0 ? calculateCraftingTree(selectedItemId, quantity, bonuses) : null;
  }, [selectedItemId, quantity, bonuses, multiItems, viewMode]);

  const handleCollapseAll = useCallback(() => {
    if (!craftingData?.children) return;
    const allNodeIds = new Set<string>();
    const collectNodeIds = (node: any) => {
      allNodeIds.add(node.id);
      node.children?.forEach(collectNodeIds);
    };
    craftingData.children.forEach(collectNodeIds);
    setCollapsedNodes(allNodeIds);
    localStorage.setItem('collapsedNodes', JSON.stringify([...allNodeIds]));
  }, [craftingData]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
    localStorage.setItem('collapsedNodes', '[]');
  }, []);

  const handleToggleNode = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
      localStorage.setItem('collapsedNodes', JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  const getIconUrl = useCallback((itemId: string) => {
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

  const filteredItems = useMemo(() => 
    searchTerm ? allCraftableItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : allCraftableItems.slice(0, 50)
  , [searchTerm, allCraftableItems]);

  useEffect(() => {
    if (!craftingData?.children) return;
    const nodesToCollapse = new Set<string>();
    const collectSecondLevel = (node: any, level = 0) => {
      if (level >= 2) nodesToCollapse.add(node.id);
      node.children?.forEach((child: any) => collectSecondLevel(child, level + 1));
    };
    craftingData.children.forEach((child: any) => collectSecondLevel(child, 1));
    setCollapsedNodes(nodesToCollapse);
    localStorage.setItem('collapsedNodes', JSON.stringify([...nodesToCollapse]));
  }, [craftingData]);

  const summaryData = useMemo(() => {
    if (!craftingData) return { title: '', materials: [] };
    
    if (summaryMode === 'xp') {
      const xpMaterials: (RawMaterial & { xp?: number; unitXP?: number })[] = [];
      let totalXP = 0;
      
      const traverse = (node: any) => {
        if (node.xp && node.quantity) {
          const xpValue = node.xp * node.quantity;
          xpMaterials.push({
            item: ITEMS[node.id] || {
              id: node.id, name: node.name || node.id, tier: node.tier || 0,
              type: node.type || '', types: '', iconId: node.id.toLowerCase().replace(/_/g, ''),
              weight: 0, maxStack: 1000
            },
            quantity: xpValue, xp: xpValue, unitXP: node.xp
          });
          totalXP += xpValue;
        }
        node.children?.forEach(traverse);
      };
      
      traverse(craftingData);
      xpMaterials.sort((a, b) => (b.xp || 0) - (a.xp || 0));
      xpMaterials.unshift({
        item: { id: 'TOTAL_XP', name: `Total ${ITEMS[selectedItemId]?.type || 'XP'}`, tier: 0, type: 'Total', types: '', iconId: 'total', weight: 0, maxStack: 1 },
        quantity: totalXP, xp: totalXP, unitXP: 0
      });
      
      return { title: 'Tradeskill XP', materials: xpMaterials };
    }
    
    // Handle multi-item scenarios
    if (multiItems.length > 0) {
      const totalMaterials = new Map<string, number>();
      multiItems.forEach(({ id, qty }) => {
        const tree = calculateCraftingTree(id, qty, bonuses);
        if (tree) {
          const materials = aggregateRawMaterials(tree, new Set(), viewMode, bonuses);
          materials.forEach(material => {
            if (material?.item?.id) {
              const current = totalMaterials.get(material.item.id) || 0;
              totalMaterials.set(material.item.id, current + material.quantity);
            }
          });
        }
      });
      
      const combinedMaterials = Array.from(totalMaterials.entries())
        .map(([itemId, qty]) => ({ item: ITEMS[itemId], quantity: qty }))
        .filter(m => m.item)
        .sort((a, b) => b.item.tier - a.item.tier || a.item.name.localeCompare(b.item.name));
      
      return {
        title: viewMode === 'gross' ? 'Gross Requirements' : 'Buy Order',
        materials: combinedMaterials
      };
    }
    
    return {
      title: viewMode === 'gross' ? 'Gross Requirements' : 'Buy Order',
      materials: aggregateRawMaterials(craftingData, collapsedNodes, viewMode, bonuses)
    };
  }, [craftingData, summaryMode, collapsedNodes, selectedItemId, viewMode, bonuses, multiItems]);

  useEffect(() => {
    const items = { selectedItemId, quantity, summaryMode, viewMode, multiItems };
    Object.entries(items).forEach(([key, value]) => 
      localStorage.setItem(key, JSON.stringify(value))
    );
    
    // Update selected preset based on current selection
    const allPresets = [...PRESETS, ...customPresets];
    let matchingPreset;
    
    if (multiItems.length > 0) {
      // Match multi-item preset
      matchingPreset = allPresets.find(p => 
        p.items.length > 1 && 
        p.items.length === multiItems.length &&
        p.items.every(item => multiItems.some(mi => mi.id === item.id && mi.qty === item.qty))
      );
    } else {
      // Match single-item preset
      matchingPreset = allPresets.find(p => 
        p.items.length === 1 && p.items[0]?.id === selectedItemId && p.items[0]?.qty === quantity
      );
    }
    
    setSelectedPreset(matchingPreset?.name || '');
  }, [selectedItemId, quantity, summaryMode, viewMode, multiItems, customPresets]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onTriggerOCR(() => {
        if (!isProcessingOCR) captureAndProcessScreenshot();
      });
      window.electronAPI.onShowSettings(() => {
        setShowSettings(true);
      });
      window.electronAPI.onShowAbout(() => {
        setShowAbout(true);
      });
    }
  }, [isProcessingOCR]);

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

  const generatePrismaticBuyList = useCallback(async () => {
    const totalMaterials = new Map<string, number>();
    
    PRISMATIC_ITEMS.forEach(itemId => {
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
    
    // Copy to clipboard
    const text = buyList.map(m => `${m.item.name}: ${Math.ceil(m.quantity)}`).join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
    
    setPrismaticBuyList(buyList);
    setShowPrismaticList(true);
  }, [quantity, bonuses, viewMode]);

  const parseInventoryOCR = useCallback((ocrText: string) => {
    const foundItems: Record<string, number> = {};
    
    // Only process lines that look like "Item Name: Number"
    const lines = ocrText.split(/[\n\r]+/);
    
    for (const line of lines) {
      const cleanLine = line.trim().toLowerCase();
      const match = cleanLine.match(/^(.+?):\s*(\d+)$/);
      
      if (match) {
        const itemName = match[1].trim();
        const quantity = parseInt(match[2]);
        
        // Only accept realistic quantities (10-10000)
        if (quantity >= 10 && quantity <= 10000) {
          for (const [key, itemId] of Object.entries(ITEM_MAPPINGS)) {
            if (itemName === key || itemName.includes(key)) {
              foundItems[itemId] = quantity;
              break;
            }
          }
        }
      }
    }
    
    return foundItems;
  }, []);

  const captureAndProcessScreenshot = useCallback(async () => {
    try {
      setIsProcessingOCR(true);
      
      // Check if we're in Electron
      const isElectron = typeof window !== 'undefined' && window.electronAPI;
      let stream;
      
      if (isElectron) {
        // Use Electron's desktopCapturer
        const sources = await window.electronAPI.getDesktopSources();
        console.log('Available sources:', sources.map(s => s.name));
        
        const primaryScreen = sources.find(source => 
          source.name.toLowerCase().includes('screen') ||
          source.name.toLowerCase().includes('entire') ||
          source.id.includes('screen')
        ) || sources[0]; // Fallback to first source
        
        if (primaryScreen) {
          console.log('Using source:', primaryScreen.name);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: primaryScreen.id,
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 }
            }
          });
        } else {
          throw new Error(`No screen source found. Available: ${sources.map(s => s.name).join(', ')}`);
        }
      } else {
        // Use web API
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { 
            width: { ideal: 1920, max: 1920 }, 
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 1, max: 5 }
          },
          audio: false
        });
      }
      
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
      
      // Focus on inventory area - crop to center portion where inventory typically is
      const cropX = Math.floor(canvas.width * 0.2);
      const cropY = Math.floor(canvas.height * 0.3);
      const cropWidth = Math.floor(canvas.width * 0.6);
      const cropHeight = Math.floor(canvas.height * 0.4);
      
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedCtx = croppedCanvas.getContext('2d');
      
      croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      // Enhanced image preprocessing for better OCR
      const imageData = croppedCtx.getImageData(0, 0, cropWidth, cropHeight);
      const data = imageData.data;
      
      // Apply multiple preprocessing techniques
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Adaptive thresholding for better text recognition
        const threshold = gray > 140 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = threshold;
        data[i + 3] = 255; // Full opacity
      }
      croppedCtx.putImageData(imageData, 0, 0);
      
      // Scale up for better OCR accuracy
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = cropWidth * 2;
      scaledCanvas.height = cropHeight * 2;
      const scaledCtx = scaledCanvas.getContext('2d');
      scaledCtx.imageSmoothingEnabled = false;
      scaledCtx.drawImage(croppedCanvas, 0, 0, cropWidth * 2, cropHeight * 2);
      
      const { data: { text } } = await Tesseract.recognize(scaledCanvas.toDataURL('image/png'), 'eng', {
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz :.,()-',
        tessedit_ocr_engine_mode: '2',
        preserve_interword_spaces: '1'
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
      
      // Extract only significant inventory quantities
      const quantities = (text.match(/\b\d{2,5}\b/g) || [])
        .map(n => parseInt(n))
        .filter(n => n >= 50 && n <= 10000) // Realistic inventory range
        .filter(n => ![60, 100, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000].includes(n))
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .sort((a, b) => b - a)
        .slice(0, 8); // Limit to 8 most likely items
      
      // Enhanced OCR processing with multiple strategies
      const parsedItems = parseInventoryOCR(text);
      const parsedCount = Object.keys(parsedItems).length;
      
      // Extract more numbers and try to match with common items
      const allNumbers = (text.match(/\b\d{1,5}\b/g) || [])
        .map(n => parseInt(n))
        .filter(n => n >= 1 && n <= 20000)
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .sort((a, b) => b - a)
        .slice(0, 30);
      

      
      // Combine parsed items with quantity-based suggestions
      const combinedItems = new Map();
      
      // Add parsed items first
      Object.entries(parsedItems).forEach(([id, qty]) => {
        const item = Object.values(ITEMS).find(item => item.id === id);
        if (item) combinedItems.set(item.name, qty);
      });
      
      // Add quantity-based suggestions for remaining numbers
      const usedQuantities = new Set(Object.values(parsedItems));
      const unusedNumbers = allNumbers.filter(n => !usedQuantities.has(n));
      
      unusedNumbers.slice(0, Math.min(35 - combinedItems.size, 25)).forEach((qty, i) => {
        const itemName = COMMON_ITEMS[combinedItems.size + i];
        if (itemName && !combinedItems.has(itemName)) {
          combinedItems.set(itemName, qty);
        }
      });
      
      const totalFound = combinedItems.size;
      let suggestions;
      if (totalFound > 0) {
        suggestions = `Found ${totalFound} potential items. Edit the names below:\n\n` + 
          Array.from(combinedItems.entries()).map(([name, qty]) => `${name}: ${qty}`).join('\n') +
          '\n\n(Tip: Change item names to match your actual inventory)';
      } else {
        // Fallback: use quantities even if no items matched
        const fallbackItems = allNumbers.slice(0, 10).map((qty, i) => 
          `${COMMON_ITEMS[i] || `Item ${i + 1}`}: ${qty}`
        ).join('\n');
        suggestions = allNumbers.length > 0 
          ? `Found ${allNumbers.length} potential items. Edit the names below:\n\n${fallbackItems}\n\n(Tip: Change item names to match your actual inventory)`
          : `detected 0 out of 15 maybe\n\nManually enter your items like:\nIron Ore: 1800\nOrichalcum Ore: 635\nStarmetal Ore: 86\nSteel Ingot: 72`;
      }
      
      setOCREditText(suggestions);
      setShowOCREdit(true);
    } catch (error) {
      console.error('OCR Error:', error);
      const isElectronCheck = typeof window !== 'undefined' && window.electronAPI;
      const errorMsg = isElectronCheck 
        ? 'Electron OCR failed. Try manual entry instead.'
        : 'Screen capture failed. Try manual entry instead.';
      setOCREditText(errorMsg + '\n\nManually enter your items like:\nIron Ore: 1800\nOrichalcum Ore: 635\nStarmetal Ore: 86\nSteel Ingot: 72');
      setShowOCREdit(true);
    } finally {
      setIsProcessingOCR(false);
    }
  }, []);

  return (

    <div className="bg-gray-900 text-gray-300 min-h-screen font-sans" style={{background: 'radial-gradient(ellipse at top, #232526 0%, #414345 100%)'}}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
        <header className="mb-4 text-center">
          <img src="logo.png" alt="Logo" className="mx-auto mb-2 h-16 w-auto" />
          <h1 className="text-s font-bold tracking-wider" style={{fontFamily: 'UnifrakturCook, cursive', color: '#e2b857', textShadow: '2px 2px 8px #000, 0 0 8px #e2b85799', letterSpacing: 2, fontSize: '14px'}}>New World Crafting Calculator</h1>
          <p className="text-xs text-gray-200 mt-1">A comprehensive crafting calculator for Amazon's New World MMO with automatic inventory detection via OCR.</p>
        </header>

        <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-xl border border-yellow-900/40 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
              ⚙️ Settings
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-1.5 rounded text-sm bg-gray-700 text-white hover:bg-gray-600 transition font-medium"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setShowAbout(true)}
                className="px-3 py-1.5 rounded text-sm bg-blue-700 text-white hover:bg-blue-600 transition font-medium"
              >
                ℹ️ About
              </button>
              {typeof window !== 'undefined' && window.electronAPI && (
                <button
                  onClick={() => window.electronAPI.exitApp()}
                  className="px-3 py-1.5 rounded text-sm bg-red-700 text-white hover:bg-red-600 transition font-medium"
                >
                  ❌ Exit
                </button>
              )}
              <button
                onClick={() => {
                  setShowAdvanced(!showAdvanced);
                  localStorage.setItem('showAdvanced', JSON.stringify(!showAdvanced));
                }}
                className="px-3 py-1.5 rounded text-sm bg-yellow-700 text-white hover:bg-yellow-600 transition font-medium"
              >
                {showAdvanced ? 'Simple' : 'Advanced'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-yellow-300 mb-1 font-medium">Presets</label>
              <div className="flex gap-1">
                <select
                  value={selectedPreset}
                  onChange={(e) => {
                    const presetName = e.target.value;
                    setSelectedPreset(presetName);
                    
                    if (presetName) {
                      const allPresets = [...PRESETS, ...customPresets];
                      const preset = allPresets.find(p => p.name === presetName);
                      if (preset?.items) {
                        if (preset.items.length === 1) {
                          // Single item preset
                          setSelectedItemId(preset.items[0].id);
                          setQuantity(preset.items[0].qty);
                          setMultiItems([]);
                        } else {
                          // Multi-item preset
                          setMultiItems(preset.items);
                          setSelectedItemId('');
                          setQuantity(0);
                        }
                        
                        if (preset.collapsedNodes) {
                          const nodeSet = new Set(preset.collapsedNodes);
                          setCollapsedNodes(nodeSet);
                          localStorage.setItem('collapsedNodes', JSON.stringify(preset.collapsedNodes));
                        }
                        
                        localStorage.setItem('multiItems', JSON.stringify(preset.items.length > 1 ? preset.items : []));
                      }
                    }
                  }}
                  className="flex-1 bg-gray-700 border border-yellow-900/40 rounded py-1 px-2 text-yellow-100 text-sm"
                >
                  <option value="">Select...</option>
                  {PRESETS.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                  {customPresets.length > 0 && <option disabled>--- Custom ---</option>}
                  {customPresets.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCreatePreset(true)}
                  className="px-2 py-1 bg-green-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-green-600"
                  title="Create Preset"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    const currentPreset = `${ITEMS[selectedItemId]?.name} x${quantity}`;
                    const matchingPreset = customPresets.find(p => 
                      p.items[0]?.id === selectedItemId && p.items[0]?.qty === quantity
                    );
                    if (matchingPreset) {
                      if (confirm(`Delete preset "${matchingPreset.name}"?`)) {
                        const updatedPresets = customPresets.filter(p => p.name !== matchingPreset.name);
                        setCustomPresets(updatedPresets);
                        localStorage.setItem('customPresets', JSON.stringify(updatedPresets));
                      }
                    } else {
                      alert(`No preset found for current selection: ${currentPreset}`);
                    }
                  }}
                  className="px-2 py-1 bg-red-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-red-600"
                  title="Delete Current Selection Preset"
                >
                  -
                </button>
              </div>
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
              <div className="space-y-2">
                <input
                  type="number"
                  value={quantity}
                  min="1"
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-gray-700 border border-yellow-900/40 rounded py-1 px-2 text-yellow-100 text-sm"
                />
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setQuantity(q => q + 10)}
                    className="px-2 py-1 bg-yellow-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-yellow-600"
                    title="+10"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setQuantity(q => q + 100)}
                    className="px-2 py-1 bg-yellow-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-yellow-600"
                    title="+100"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setQuantity(q => q + 1000)}
                    className="px-2 py-1 bg-yellow-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-yellow-600"
                    title="+1000"
                  >
                    +1000
                  </button>
                  <button
                    onClick={() => setQuantity(1)}
                    className="px-2 py-1 bg-red-700 border border-yellow-900/40 rounded text-xs text-yellow-100 hover:bg-red-600"
                    title="Reset to 1"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showAdvanced && (
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
                      className={`px-3 py-1 text-sm font-medium transition hidden ${
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
                    onClick={async () => {
                      const materials = netRequirementsWithInventory.filter(m => m.quantity > 0);
                      const text = materials.map(m => `${m.item.name}: ${Math.ceil(m.quantity)}`).join('\n');
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(text);
                        } else {
                          // Fallback for older browsers
                          const textArea = document.createElement('textarea');
                          textArea.value = text;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                        }
                      } catch (err) {
                        console.error('Copy failed:', err);
                        alert('Copy failed. Text:\n\n' + text);
                      }
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
                  {manualMode && (
                    <button
                      onClick={() => {
                        setShowManualEntry(true);
                      }}
                      className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 transition font-medium"
                    >
                      📝 Import
                    </button>
                  )}
                  {(window.location.hostname === 'localhost' || window.location.protocol === 'https:' || window.location.protocol === 'file:' || typeof window !== 'undefined' && window.electronAPI) && (
                    <button
                      onClick={captureAndProcessScreenshot}
                      disabled={isProcessingOCR}
                      className={`px-2 py-1 rounded text-xs transition font-medium ${
                        isProcessingOCR 
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                      title="Screenshot OCR (HTTPS/localhost only)"
                    >
                      {isProcessingOCR ? '⏳' : '📷'}
                    </button>
                  )}
                  {manualMode && (
                    <button
                      onClick={() => setShowManualEntry(true)}
                      className="px-2 py-1 rounded text-xs bg-yellow-600 text-white hover:bg-yellow-700 transition font-medium"
                      title="Manual Entry"
                    >
                      ✏️ Manual
                    </button>
                  )}
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
                <span className="text-red-300">Clear the text below and manually type your items:</span><br/>
                <span className="text-yellow-300">Item Name: Quantity</span><br/>
                <span className="text-green-300">Iron Ore: 1800<br/>Steel Ingot: 266<br/>Charcoal: 88</span>
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

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-lg w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-yellow-300 mb-2">Interface Options</h4>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-300">Show Manual Entry Button</span>
                    <input
                      type="checkbox"
                      checked={manualMode}
                      onChange={(e) => {
                        setManualMode(e.target.checked);
                        localStorage.setItem('manualMode', JSON.stringify(e.target.checked));
                      }}
                      className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-300 mb-2">Data Management</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const data = JSON.stringify({ inventory, bonuses, selectedItemId, quantity, customPresets }, null, 2);
                          const blob = new Blob([data], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'crafting-data.json';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                      >
                        💾 Export Data
                      </button>
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.json';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                try {
                                  const data = JSON.parse(e.target?.result as string);
                                  if (data.inventory) setInventory(data.inventory);
                                  if (data.bonuses) setBonuses(data.bonuses);
                                  if (data.selectedItemId) setSelectedItemId(data.selectedItemId);
                                  if (data.quantity) setQuantity(data.quantity);
                                  if (data.customPresets) {
                                    setCustomPresets(data.customPresets);
                                    localStorage.setItem('customPresets', JSON.stringify(data.customPresets));
                                  }
                                  alert('Data imported successfully!');
                                } catch { alert('Invalid file format'); }
                              };
                              reader.readAsText(file);
                            }
                          };
                          input.click();
                        }}
                        className="px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 transition font-medium"
                      >
                        📁 Import Data
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (confirm('Delete all custom presets? This cannot be undone.')) {
                            setCustomPresets([]);
                            localStorage.setItem('customPresets', JSON.stringify([]));
                            alert('Custom presets deleted.');
                          }
                        }}
                        className="px-3 py-1 rounded text-xs bg-orange-600 text-white hover:bg-orange-700 transition font-medium"
                      >
                        🗑️ Delete Presets
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Erase ALL data including inventory, bonuses, and presets? This cannot be undone.')) {
                            setInventory({});
                            setBonuses(DEFAULT_BONUSES);
                            setCustomPresets([]);
                            setSelectedItemId(FINAL_ITEMS[0].id);
                            setQuantity(10);
                            localStorage.clear();
                            alert('All data erased.');
                          }
                        }}
                        className="px-3 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition font-medium"
                      >
                        🗑️ Erase All Data
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-300 mb-2">Global Hotkeys</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div><kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+Alt+I</kbd> - Toggle Calculator</div>
                    <div><kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Ctrl+Alt+O</kbd> - Start OCR Detection</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-300 mb-2">Version</h4>
                  <div className="text-sm text-gray-300">v0.7.4</div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showAbout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">About</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <img src="logo.png" alt="Logo" className="mx-auto mb-4 h-16 w-auto" />
                  <h4 className="text-yellow-300 font-bold text-lg">New World Crafting Calculator</h4>
                  <p className="text-gray-300 text-sm mt-2">Version 0.7.3</p>
                </div>
                <div className="text-sm text-gray-300">
                  <p>A comprehensive crafting calculator for Amazon's New World MMO with automatic inventory detection via OCR.</p>
                  <p className="mt-2">Created by <span className="text-yellow-300">Involvex</span></p>
                  <div className="mt-4 space-y-2">
                    <div>
                      <a 
                        href="https://github.com/involvex/newworld-dailycraft-calc" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        💻 GitHub Repository
                      </a>
                    </div>
                    <div>
                      <a 
                        href="https://involvex.github.io/newworld-dailycraft-calc/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 underline"
                      >
                        🌐 Live Web App
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAbout(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showCreatePreset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Create Preset</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-300 mb-2">Preset Name</label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="My Custom Preset"
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm"
                  />
                </div>
                <div className="text-sm text-gray-300">
                  <p>Current Selection:</p>
                  {multiItems.length > 0 ? (
                    <div className="text-yellow-300">
                      {multiItems.map((item, i) => (
                        <div key={i}>{ITEMS[item.id]?.name} x{item.qty}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-yellow-300">{ITEMS[selectedItemId]?.name} x{quantity}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    if (presetName.trim()) {
                      const trimmedName = presetName.trim();
                      const existingIndex = customPresets.findIndex(p => p.name === trimmedName);
                      
                      if (existingIndex !== -1) {
                        if (confirm(`Preset "${trimmedName}" already exists. Overwrite?`)) {
                          const newPreset = {
                            name: trimmedName,
                            items: [{ id: selectedItemId, qty: quantity }],
                            collapsedNodes: [...collapsedNodes]
                          };
                          const updatedPresets = [...customPresets];
                          updatedPresets[existingIndex] = newPreset;
                          setCustomPresets(updatedPresets);
                          localStorage.setItem('customPresets', JSON.stringify(updatedPresets));
                          setShowCreatePreset(false);
                          setPresetName('');
                        }
                      } else {
                        const newPreset = {
                          name: trimmedName,
                          items: multiItems.length > 0 ? multiItems : [{ id: selectedItemId, qty: quantity }],
                          collapsedNodes: [...collapsedNodes]
                        };
                        const updatedPresets = [...customPresets, newPreset];
                        setCustomPresets(updatedPresets);
                        localStorage.setItem('customPresets', JSON.stringify(updatedPresets));
                        setShowCreatePreset(false);
                        setPresetName('');
                      }
                    }
                  }}
                  disabled={!presetName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-500"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreatePreset(false);
                    setPresetName('');
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
          <p><img src="logo.png" alt="Logo" className="mx-auto mb-2 h-16 w-auto" /></p>
          <p>Created by Involvex</p>
          <p>Data from <a href="https://nw-buddy.de" className="text-blue-500 hover:underline">nw-buddy.de</a></p>
        </footer>
      </div>
    </div>
  );
};

export default App;
