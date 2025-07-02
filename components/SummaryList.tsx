import React, { useState } from 'react';
import { RawMaterial } from '../types';

interface ExtendedRawMaterial extends RawMaterial {
  inInventory?: number;
  originalQuantity?: number;
  xp?: number;
  unitXP?: number;
}

interface SummaryListProps {
  materials: ExtendedRawMaterial[];
  getIconUrl: (itemId: string, tier: number) => string;
  title: string;
  inventory?: Record<string, number>;
  onInventoryChange?: (itemId: string, quantity: number) => void;
  showInventory?: boolean;
}

const SummaryList: React.FC<SummaryListProps> = ({ 
  materials, 
  getIconUrl, 
  title, 
  inventory = {}, 
  onInventoryChange, 
  showInventory = false 
}) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

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

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      handleInventorySave(itemId);
    } else if (e.key === 'Escape') {
      setEditingItem(null);
      setTempValue('');
    }
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg mt-8 border border-gray-700/50">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
        <h3 className="text-lg font-bold text-yellow-400">{title}</h3>
        {showInventory && (
          <div className="text-xs text-gray-400">
            Click quantities to set inventory
          </div>
        )}
      </div>
      <div className="space-y-2">
        {materials.map((material) => {
          const { item, quantity, inInventory = 0, originalQuantity, xp, unitXP } = material;
          const inventoryAmount = inventory[item.id] || 0;
          const isEditing = editingItem === item.id;
          const isXpMode = xp !== undefined;
          
          return (
            <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-800/50 rounded-md">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-800 border border-gray-600">
                  <img src={getIconUrl(item.id, item.tier)} alt={item.name} className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-700 mt-4 pt-3 text-right">
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