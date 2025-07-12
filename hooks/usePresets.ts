import { useState } from 'react';
import { ITEMS } from '../data/items';

interface Preset {
  name: string;
  items: { id: string; qty: number }[];
  collapsedNodes?: string[];
}

interface UsePresetsProps {
  multiItems: any[];
  selectedItemId: string;
  quantity: number;
  collapsedNodes: Set<string>;
  setCollapsedNodes: (nodes: Set<string>) => void;
  setMultiItems: (items: any[]) => void;
  setSelectedItemId: (itemId: string) => void;
  setQuantity: (quantity: number) => void;
  restoreCollapsedNodes: (nodes: string[] | Set<string>) => void;
  selectedPreset: string; // Add selectedPreset to props
  setSelectedPreset: (presetName: string) => void; // Add setSelectedPreset to props
  setInventory: (inventory: Record<string, number>) => void; // Add setInventory to props
}

const PRESETS: Preset[] = [
  { name: 'Daily Cooldowns (10)', items: [{ id: 'PRISMATIC_INGOT', qty: 10 }, { id: 'PRISMATIC_CLOTH', qty: 10 }, { id: 'PRISMATIC_LEATHER', qty: 10 }, { id: 'PRISMATIC_PLANKS', qty: 10 },{ id: 'ASMODEUM', qty: 10 }, { id: 'PHOENIXWEAVE', qty: 10 }, { id: 'RUNIC_LEATHER', qty: 10 }, { id: 'GLITTERING_EBONY', qty: 10 }] },
  { name: 'Prismatic Set (10)', items: [{ id: 'PRISMATIC_INGOT', qty: 10 }, { id: 'PRISMATIC_CLOTH', qty: 10 }, { id: 'PRISMATIC_LEATHER', qty: 10 }, { id: 'PRISMATIC_PLANKS', qty: 10 }] },
];

const getInitial = <T,>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};

export default function usePresets({
  multiItems,
  selectedItemId,
  quantity,
  collapsedNodes,
  setCollapsedNodes,
  setMultiItems,
  setSelectedItemId,
  setQuantity,
  restoreCollapsedNodes,
  selectedPreset, // Destructure from props
  setSelectedPreset, // Destructure from props
  setInventory, // Destructure from props
}: UsePresetsProps) {
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => getInitial('customPresets', []));
  const [showCreatePreset, setShowCreatePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  // selectedPreset state is now managed in App.tsx

  // Select a preset and restore state
  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName); // Use the setSelectedPreset passed from App.tsx
    if (presetName) {
      const allPresets: Preset[] = [...PRESETS, ...customPresets];
      const preset = allPresets.find(p => p.name === presetName);
      if (preset?.items) {
        if (preset.items.length === 1) {
          setSelectedItemId(preset.items[0].id);
          setQuantity(preset.items[0].qty);
          setMultiItems([]);
          localStorage.setItem('selectedItemId', JSON.stringify(preset.items[0].id));
          localStorage.setItem('quantity', JSON.stringify(preset.items[0].qty));
        } else {
          setMultiItems([...preset.items]); // Ensure a new array reference to trigger re-render
          setSelectedItemId('');
          setQuantity(preset.items[0]?.qty || 10);
        }

        // Restore collapsedNodes if present in the preset
        if (
          Object.prototype.hasOwnProperty.call(preset, 'collapsedNodes') &&
          Array.isArray(preset.collapsedNodes)
        ) {
          restoreCollapsedNodes(preset.collapsedNodes);
        } else {
          restoreCollapsedNodes([]);
        }
        localStorage.setItem('multiItems', JSON.stringify(preset.items.length > 1 ? preset.items : []));
      }
    }
  };

  // Create or overwrite a preset
  const handlePresetCreate = (name: string) => {
    if (!name.trim()) return;
    const trimmedName = name.trim();
    const existingIndex = customPresets.findIndex(p => p.name === trimmedName);
    const newPreset: Preset = {
      name: trimmedName,
      items: multiItems.length > 0 ? multiItems : [{ id: selectedItemId, qty: quantity }],
      collapsedNodes: [...collapsedNodes]
    };
    let updatedPresets;
    if (existingIndex !== -1) {
      updatedPresets = [...customPresets];
      updatedPresets[existingIndex] = newPreset;
    } else {
      updatedPresets = [...customPresets, newPreset];
    }
    setCustomPresets(updatedPresets);
    localStorage.setItem('customPresets', JSON.stringify(updatedPresets));
    setShowCreatePreset(false);
    setPresetName('');
  };

  // Delete a preset
  const handlePresetDelete = (name: string) => {
    const updatedPresets = customPresets.filter(p => p.name !== name);
    setCustomPresets(updatedPresets);
    localStorage.setItem('customPresets', JSON.stringify(updatedPresets));
  };

  return {
    PRESETS,
    customPresets,
    setCustomPresets,
    selectedPreset, // Now returned from props
    setSelectedPreset, // Now returned from props
    showCreatePreset,
    setShowCreatePreset,
    presetName,
    setPresetName,
    handlePresetSelect,
    handlePresetCreate,
    handlePresetDelete,
  };
}
