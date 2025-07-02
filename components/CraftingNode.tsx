
import React from 'react';
import { CraftingNodeData } from '../types';

interface CraftingNodeProps {
  node: CraftingNodeData;
  getIconUrl: (itemId: string, tier: number) => string;
  isRoot?: boolean;
  isLast?: boolean;
  collapsedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
}

const CraftingNode: React.FC<CraftingNodeProps> = ({ node, getIconUrl, isRoot = false, isLast = false, collapsedNodes, onToggle }) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = !collapsedNodes.has(node.id);

  const toggleExpansion = () => {
    if (hasChildren) {
      onToggle(node.id);
    }
  };
  
  // For intermediate items, show the number of crafts. For raw materials (leaf nodes), show total quantity.
  const displayQuantity = hasChildren ? node.quantity : Math.ceil(node.totalQuantity);

  return (
    <div className={`relative ${isRoot ? '' : 'pl-5'}`}>
      {!isRoot && (
        <>
          {/* Vertical line connecting to parent */}
          <div className={`absolute left-0 top-0 w-px bg-gray-600 ${isLast ? 'h-[1.625rem]' : 'h-full'}`}></div>
          {/* Horizontal line */}
          <div className="absolute left-0 top-[1.625rem] h-px w-5 bg-gray-600"></div>
        </>
      )}

      <div className="flex items-start pt-2">
         {/* Connector Circle & Toggle */}
        {!isRoot && hasChildren && (
            <button 
                onClick={toggleExpansion} 
                className="absolute -left-[0.4rem] top-[1.3rem] z-10 flex h-[1.1rem] w-[1.1rem] items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-500 cursor-pointer"
                aria-label={isExpanded ? `Collapse ${node.item.name}` : `Expand ${node.item.name}`}
            >
                <div className={`h-px w-2 ${isExpanded ? '' : 'rotate-90'} absolute bg-gray-300 transition-transform`}></div>
                <div className="h-2 w-px bg-gray-300"></div>
            </button>
        )}
        {!isRoot && !hasChildren && (
             <div className="absolute -left-1 top-[1.5rem] z-10 h-2 w-2 rounded-full bg-gray-600 border border-gray-500"></div>
        )}

        <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-gray-900 border-2 ${node.item.type.includes('Legendary') ? 'border-yellow-400' : 'border-gray-600'}`}>
                <img
                  src={getIconUrl(node.item.id, node.item.tier)}
                  alt={node.item.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const fallback = '/fallback-icon.png';
                    if (e.currentTarget.src !== window.location.origin + fallback && !e.currentTarget.src.endsWith(fallback)) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallback;
                    }
                  }}
                  data-debug-url={getIconUrl(node.item.id, node.item.tier)}
                />
            </div>
            
            <div className="flex flex-col">
                <p className="font-bold text-white">
                    {(isRoot ? Math.ceil(node.totalQuantity) : displayQuantity).toLocaleString()} x {node.item.name}
                </p>
                {node.yieldBonus > 0 && (
                    <span className="text-sm font-semibold text-green-400">
                        +{Math.round(node.yieldBonus * 100)}%
                    </span>
                )}
            </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 pl-5">
          {node.children.map((child, index) => (
            <CraftingNode
              key={child.id}
              node={child}
              getIconUrl={getIconUrl}
              isLast={index === node.children.length - 1}
              collapsedNodes={collapsedNodes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CraftingNode;
