 import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onRemove: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onExpand, onCollapse, onRemove }) => {
  return (
    <div
      className="fixed bg-gray-800 border border-yellow-900/40 rounded shadow-lg z-50"
      style={{ top: y, left: x }}
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ul className="py-1">
        <li onClick={onExpand} className="px-4 py-2 text-sm text-yellow-100 hover:bg-gray-700 cursor-pointer">Expand Path</li>
        <li onClick={onCollapse} className="px-4 py-2 text-sm text-yellow-100 hover:bg-gray-700 cursor-pointer">Collapse Node</li>
        <li onClick={onRemove} className="px-4 py-2 text-sm text-red-400 hover:bg-gray-700 cursor-pointer">Remove</li>
      </ul>
    </div>
  );
};

export default ContextMenu;
