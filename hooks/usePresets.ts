import { useState } from "react";
import { Preset } from "../types";

interface UsePresetsProps {
  _multiItems: any[];
  _selectedItemId: string;
  _quantity: number;
  _collapsedNodes: Set<string>;
  setMultiItems: (items: any[]) => void;
  setSelectedItemId: (itemId: string) => void;
  setQuantity: (quantity: number) => void;
  restoreCollapsedNodes: (nodes: string[] | Set<string>) => void;
  selectedPreset: string; // Add selectedPreset to props
  setSelectedPreset: (presetName: string) => void; // Add setSelectedPreset to props
}

const PRESETS: Preset[] = [
  {
    name: "Daily Cooldowns (10)",
    items: [
      { id: "Ingott53", qty: 10 },
      { id: "PRISMATIC_CLOTH", qty: 10 },
      { id: "PRISMATIC_LEATHER", qty: 10 },
      { id: "PRISMATIC_PLANKS", qty: 10 },
      { id: "ASMODEUM", qty: 10 }
    ]
  },
  {
    name: "Prismatic Set (10)",
    items: [
      { id: "PRISMATIC_CLOTH", qty: 10 },
      { id: "PRISMATIC_LEATHER", qty: 10 },
      { id: "PRISMATIC_PLANKS", qty: 10 }
    ]
  }
];

const getInitial = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export default function usePresets({
  _multiItems,
  _selectedItemId,
  _quantity,
  _collapsedNodes,
  setMultiItems,
  setSelectedItemId,
  setQuantity,
  restoreCollapsedNodes,
  selectedPreset, // Destructure from props
  setSelectedPreset // Destructure from props
}: UsePresetsProps) {
  const [customPresets, setCustomPresets] = useState<Preset[]>(() =>
    getInitial("customPresets", [])
  );
  const [showCreatePreset, setShowCreatePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
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
          localStorage.setItem(
            "selectedItemId",
            JSON.stringify(preset.items[0].id)
          );
          localStorage.setItem("quantity", JSON.stringify(preset.items[0].qty));
        } else {
          setMultiItems([...preset.items]); // Ensure a new array reference to trigger re-render
          setSelectedItemId("");
          setQuantity(preset.items[0]?.qty || 10);
        }

        // Restore collapsedNodes if present in the preset
        if (
          Object.prototype.hasOwnProperty.call(preset, "collapsedNodes") &&
          Array.isArray(preset.collapsedNodes)
        ) {
          restoreCollapsedNodes(preset.collapsedNodes);
        } else {
          restoreCollapsedNodes([]);
        }
        localStorage.setItem(
          "multiItems",
          JSON.stringify(preset.items.length > 1 ? preset.items : [])
        );
      }
    }
  };

  // Create or overwrite a preset
  const handlePresetCreate = (name: string) => {
    if (!name.trim()) return;

    // Validate that there's something to save
    if (_multiItems.length === 0 && !_selectedItemId) {
      alert(
        "Please select an item or add items to your list before creating a preset."
      );
      return;
    }

    const trimmedName = name.trim();
    const existingIndex = customPresets.findIndex(p => p.name === trimmedName);

    // Prepare items array with validation
    let items: { id: string; qty: number }[];
    if (_multiItems.length > 0) {
      items = _multiItems.filter(item => item.id && item.qty > 0); // Filter out invalid items
    } else if (_selectedItemId) {
      items = [{ id: _selectedItemId, qty: _quantity }];
    } else {
      alert(
        "Please select an item or add items to your list before creating a preset."
      );
      return;
    }

    // Ensure we have valid items
    if (items.length === 0) {
      alert("No valid items found. Please check your selections.");
      return;
    }

    const newPreset: Preset = {
      name: trimmedName,
      items: items,
      collapsedNodes: [..._collapsedNodes]
    };

    let updatedPresets;
    if (existingIndex !== -1) {
      updatedPresets = [...customPresets];
      updatedPresets[existingIndex] = newPreset;
    } else {
      updatedPresets = [...customPresets, newPreset];
    }
    setCustomPresets(updatedPresets);
    localStorage.setItem("customPresets", JSON.stringify(updatedPresets));
    setShowCreatePreset(false);
    setPresetName("");
  };

  // Delete a preset
  const handlePresetDelete = (name: string) => {
    const updatedPresets = customPresets.filter(p => p.name !== name);
    setCustomPresets(updatedPresets);
    localStorage.setItem("customPresets", JSON.stringify(updatedPresets));
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
    handlePresetDelete
  };
}
