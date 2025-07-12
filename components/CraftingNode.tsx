
import React from 'react';
import { CraftingNodeData } from '../types';

interface CraftingNodeProps {
  node: CraftingNodeData;
  getIconUrl: (itemId: string, tier: number) => string;
  isRoot?: boolean;
  isLast?: boolean;
  collapsedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  selectedIngredients?: Record<string, string>;
  onIngredientChange?: (itemId: string, ingredient: string) => void;
  viewMode?: 'net' | 'gross';
  summaryData?: any[];
  onNodeContextMenu?: (node: CraftingNodeData, event: React.MouseEvent) => void;
}

const CraftingNode: React.FC<CraftingNodeProps> = ({ node, getIconUrl, isRoot = false, isLast = false, collapsedNodes, onToggle, selectedIngredients = {}, onIngredientChange, viewMode = 'net', summaryData = [], onNodeContextMenu }) => {
  const hasChildren = node.children?.length > 0;
  const isExpanded = !collapsedNodes.has(node.id);

  const toggleExpansion = () => {
    if (hasChildren) {
      onToggle(node.id);
    }
  };
  
  // For intermediate items, show the number of crafts. For raw materials (leaf nodes), show total quantity.
  let displayQuantity = hasChildren ? node.quantity : Math.ceil(node.totalQuantity);
  
  // Override with summary data for leaf nodes in gross mode
  if (!hasChildren && viewMode === 'gross' && summaryData.length > 0) {
    const summaryItem = summaryData.find(item => item.item?.id === node.item?.id);
    if (summaryItem) {
      displayQuantity = Math.ceil(summaryItem.quantity);
    }
  }

  return (
    <div
      className={`relative ${isRoot ? '' : 'pl-5'}`}
      onContextMenu={onNodeContextMenu ? (e) => onNodeContextMenu(node, e) : undefined}
    >
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
                aria-label={isExpanded ? `Collapse ${node.item?.name || 'item'}` : `Expand ${node.item?.name || 'item'}`}
            >
                <div className={`h-px w-2 ${isExpanded ? '' : 'rotate-90'} absolute bg-gray-300 transition-transform`}></div>
                <div className="h-2 w-px bg-gray-300"></div>
            </button>
        )}
        {!isRoot && !hasChildren && (
             <div className="absolute -left-1 top-[1.5rem] z-10 h-2 w-2 rounded-full bg-gray-600 border border-gray-500"></div>
        )}

        <div className="flex items-center space-x-3">
            <div 
              className={`flex-shrink-0 h-10 w-10 rounded-full bg-gray-900 border-2 ${
                node.item?.type?.includes('Legendary') ? 'border-yellow-400' : 'border-gray-600'
              } ${
                node.item?.id === 'GEMSTONE_DUST' ? 'cursor-pointer hover:border-yellow-500' : ''
              }`}
              onClick={() => {
                if (node.item?.id === 'GEMSTONE_DUST' && onIngredientChange) {
                  const options = ['PRISTINE_AMBER', 'PRISTINE_DIAMOND', 'PRISTINE_EMERALD'];
                  const current = selectedIngredients[node.item.id] || 'PRISTINE_AMBER';
                  const currentIndex = options.indexOf(current);
                  const nextIndex = (currentIndex + 1) % options.length;
                  onIngredientChange(node.item.id, options[nextIndex]);
                }
              }}
            >
                <img
                  src={getIconUrl(node.item?.id || '', node.item?.tier || 0)}
                  alt={node.item?.name || ''}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI2IiBmaWxsPSIjMzc0MTUxIi8+CiAgPHBhdGggZD0iTTI0IDE2QzI0LjU1MjMgMTYgMjUgMTYuNDQ3NyAyNSAxN1YyM0gzMUMzMS41NTIzIDIzIDMyIDIzLjQ0NzcgMzIgMjRDMzIgMjQuNTUyMyAzMS41NTIzIDI1IDMxIDI1SDI1VjMxQzI1IDMxLjU1MjMgMjQuNTUyMyAzMiAyNCAzMkMyMy40NDc3IDMyIDIzIDMxLjU1MjMgMjMgMzFWMjVIMTdDMTYuNDQ3NyAyNSAxNiAyNC41NTIzIDE2IDI0QzE2IDIzLjQ0NzcgMTYuNDQ3NyAyMyAxNyAyM0gyM1YxN0MyMyAxNi40NDc3IDIzLjQ0NzcgMTYgMjQgMTZaIiBmaWxsPSIjOUNBM0FGIi8+CiAgPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjAiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjwvc3ZnPg==';
                    if (e.currentTarget.src !== fallback) {
                      console.warn('Failed to load item icon:', e.currentTarget.src);
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallback;
                    }
                  }}
                  data-debug-url={getIconUrl(node.item?.id || '', node.item?.tier || 0)}
                />
            </div>
            
            <div className="flex flex-col">
                <p className="font-bold text-white">
                    {(isRoot ? Math.ceil(node.totalQuantity) : displayQuantity).toLocaleString()} x {node.item?.name || 'Unknown Item'}
                    {node.item?.id === 'GEMSTONE_DUST' && selectedIngredients[node.item.id] && (
                      <span className="text-xs text-yellow-400 ml-2">
                        ({selectedIngredients[node.item.id].replace('PRISTINE_', '').toLowerCase()})
                      </span>
                    )}
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
          {node.children?.map((child, index) => (
            <CraftingNode
              key={child.id}
              node={child}
              getIconUrl={getIconUrl}
              isLast={index === (node.children?.length || 0) - 1}
              collapsedNodes={collapsedNodes}
              onToggle={onToggle}
              selectedIngredients={selectedIngredients}
              onIngredientChange={onIngredientChange}
              viewMode={viewMode}
              summaryData={summaryData}
              onNodeContextMenu={onNodeContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CraftingNode;
