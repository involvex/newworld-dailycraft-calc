import React, { useState, useCallback } from 'react';
import { RawMaterial } from '../types';

interface ExtendedRawMaterial extends RawMaterial {
  inInventory?: number;
  originalQuantity?: number;
  xp?: number;
  unitXP?: number;
}

interface _SummaryListProps {
  materials: ExtendedRawMaterial[];
  getIconUrl: (_itemId: string, _tier: number) => string;
  title: string;
  inventory?: Record<string, number>;
  onInventoryChange?: (_itemId: string, _quantity: number) => void;
  showInventory?: boolean;
  selectedIngredients?: Record<string, string>;
  onIngredientChange?: (_itemId: string, _ingredient: string) => void;
  showPrices?: boolean;
  priceConfig?: any;
  priceData?: Record<string, any>;
}

const SummaryList = ({ materials, inventory, onInventoryChange, getIconUrl, title, showInventory, selectedIngredients, onIngredientChange, showPrices, priceConfig, priceData: _priceData }) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');

  const copyToClipboard = useCallback(async (text: string) => {
    setCopyStatus('copying');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, []);

  const handleCopyMaterialsList = useCallback(() => {
    const isXpMode = materials.some(m => m.xp !== undefined);
    const text = materials
      .filter(m => m.quantity > 0)
      .map(m => `${m.item.name}: ${Math.ceil(m.quantity).toLocaleString()}${isXpMode ? ' XP' : ''}`)
      .join('\n');
    copyToClipboard(text);
  }, [materials, copyToClipboard]);

  const handleCopyShoppingList = useCallback(() => {
    const shoppingList = materials
      .filter(m => m.quantity > 0)
      .sort((a, b) => b.item.tier - a.item.tier || a.item.name.localeCompare(b.item.name))
      .map(m => `${m.item.name}: ${Math.ceil(m.quantity).toLocaleString()}`)
      .join('\n');
    
    const header = `📝 New World Crafting Materials List\n${'='.repeat(40)}\n`;
    const footer = `\n${'='.repeat(40)}\nTotal Items: ${materials.filter(m => m.quantity > 0).length}`;
    
    copyToClipboard(header + shoppingList + footer);
  }, [materials, copyToClipboard]);

  const handleInventoryEdit = (itemId: string, currentValue: number) => {
    setEditingItem(itemId);
    setTempValue(currentValue.toString());
  };

  const handleInventorySave = (itemId: string) => {
    const value = parseInt(tempValue) || 0;
    onInventoryChange?.(itemId, value);
    setEditingItem(null);
    setTempValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, _itemId: string) => {
    if (e.key === 'Enter') {
      handleInventorySave(_itemId);
    } else if (e.key === 'Escape') {
      setEditingItem(null);
      setTempValue('');
    }
  };

  // Get price for the item if price display is enabled
  const getItemPrice = (itemName: string, quantity: number) => {
    if (!showPrices || !priceConfig?.enabled || !itemName) return null;

    // Try multiple ways to find the price data
    let itemPriceData = null;

    // First try exact lowercase match
    itemPriceData = _priceData[itemName.toLowerCase()];

    // If not found, try finding by item name in the price data keys
    if (!itemPriceData) {
      const priceDataKeys = Object.keys(_priceData);
      const matchingKey = priceDataKeys.find(key =>
        key.toLowerCase() === itemName.toLowerCase()
      );
      if (matchingKey) {
        itemPriceData = _priceData[matchingKey];
      }
    }

    // If still not found, try partial matching
    if (!itemPriceData) {
      const priceDataKeys = Object.keys(_priceData);
      const matchingKey = priceDataKeys.find(key =>
        key.toLowerCase().includes(itemName.toLowerCase()) ||
        itemName.toLowerCase().includes(key.toLowerCase())
      );
      if (matchingKey) {
        itemPriceData = _priceData[matchingKey];
      }
    }

    if (!itemPriceData) return null;

    const price = itemPriceData.price;
    const totalValue = price * quantity;

    return {
      price,
      totalValue,
      priceType: priceConfig.priceType,
      server: itemPriceData.server
    };
  };

  return (
    <div className="p-4 mt-8 bg-gray-900 border rounded-lg sm:p-6 border-gray-700/50">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-yellow-400">{title}</h3>
        <div className="flex items-center gap-2">
          {materials.length > 0 && (
            <>
              <button
                onClick={handleCopyMaterialsList}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  copyStatus === 'success' 
                    ? 'bg-green-600 text-white' 
                    : copyStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                }`}
                title="Copy materials list to clipboard"
                disabled={copyStatus === 'copying'}
              >
                {copyStatus === 'copying' ? '📋...' : copyStatus === 'success' ? '✅' : copyStatus === 'error' ? '❌' : '📋 Copy'}
              </button>
              <button
                onClick={handleCopyShoppingList}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  copyStatus === 'success' 
                    ? 'bg-green-600 text-white' 
                    : copyStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                title="Copy formatted shopping list to clipboard"
                disabled={copyStatus === 'copying'}
              >
                {copyStatus === 'copying' ? '🛒...' : copyStatus === 'success' ? '✅' : copyStatus === 'error' ? '❌' : '🛒 Shopping List'}
              </button>
            </>
          )}
          {showInventory && (
            <div className="text-xs text-gray-400">
              Click quantities to set inventory
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {materials.map((material) => {
          const { item, quantity, inInventory = 0, originalQuantity, xp, unitXP } = material;
          const inventoryAmount = inventory[item.id] || 0;
          const isEditing = editingItem === item.id;
          const isXpMode = xp !== undefined;
          
          return (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800/50">
              <div className="flex items-center space-x-3">
                <div 
                  className={`h-9 w-9 flex-shrink-0 rounded-full bg-gray-800 border border-gray-600 ${
                    item.id === 'GEMSTONE_DUST' ? 'cursor-pointer hover:border-yellow-500' : ''
                  }`}
                  onClick={() => {
                    if (item.id === 'GEMSTONE_DUST' && onIngredientChange) {
                      const options = ['PRISTINE_AMBER', 'PRISTINE_DIAMOND', 'PRISTINE_EMERALD'];
                      const current = selectedIngredients[item.id] || 'PRISTINE_AMBER';
                      const currentIndex = options.indexOf(current);
                      const nextIndex = (currentIndex + 1) % options.length;
                      onIngredientChange(item.id, options[nextIndex]);
                    }
                  }}
                >
                  <img src={getIconUrl(item.id, item.tier)} alt={item.name} className="object-contain w-full h-full" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {item.name}
                    {item.id === 'GEMSTONE_DUST' && selectedIngredients[item.id] && (
                      <span className="ml-2 text-xs text-yellow-400">
                        ({selectedIngredients[item.id].replace('PRISTINE_', '').toLowerCase()})
                      </span>
                    )}
                  </p>
                  {isXpMode && unitXP && unitXP > 0 && (
                    <p className="text-xs text-gray-400">
                      {unitXP.toLocaleString()} XP per craft
                    </p>
                  )}
                  {showInventory && originalQuantity && inInventory !== undefined && (
                    <p className="text-xs text-gray-400">
                      Need: {Math.ceil(originalQuantity).toLocaleString()} | Have: {inInventory.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {showInventory && (
                  <div className="text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onBlur={() => handleInventorySave(item.id)}
                        onKeyDown={(e) => handleKeyPress(e, item.id)}
                        className="w-16 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white text-center"
                        placeholder="0"
                        title={`Set inventory quantity for ${item.name}`}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => handleInventoryEdit(item.id, inventoryAmount)}
                        className="text-xs text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-gray-700"
                      >
                        Inv: {inventoryAmount.toLocaleString()}
                      </button>
                    )}
                  </div>
                )}
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    showInventory && quantity === 0 ? 'text-green-400' : 'text-gray-200'
                  }`}>
                    {Math.ceil(quantity).toLocaleString()}{isXpMode ? ' XP' : ''}
                  </p>
                  {(() => {
                    const itemPrice = getItemPrice(item.name, quantity);
                    return itemPrice && (
                      <div className="text-xs text-gray-400">
                        <div>
                          {priceConfig?.priceType === 'sell' ? '💰' : '🛒'} {itemPrice.price.toLocaleString()} each
                        </div>
                        <div className="text-yellow-400">
                          Total: {(itemPrice.totalValue / 100).toFixed(2)}g
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-3 mt-4 text-right border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Total Unique Materials: <span className="font-bold text-white">{materials.length}</span>
          {showInventory && (
            <span className="ml-4">
              Still Needed: <span className="font-bold text-white">
                {materials.filter(m => m.quantity > 0).length}
              </span>
            </span>
          )}
        </p>
      </div>
    </div>
  );
};



export default SummaryList;
