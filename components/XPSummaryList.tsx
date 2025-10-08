import React from "react";
import { XPSummary } from "../types";

interface XPSummaryListProps {
  xpGains: XPSummary[];
  title?: string;
}

const XPSummaryList: React.FC<XPSummaryListProps> = ({ xpGains }) => {
  if (!xpGains || xpGains.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No XP data available for this crafting tree.</p>
      </div>
    );
  }

  const totalTradeskillXP = xpGains.reduce(
    (sum, xp) => sum + xp.tradeskillXP,
    0
  );
  const totalStandingXP = xpGains.reduce((sum, xp) => sum + xp.standingXP, 0);
  const totalCrafts = xpGains.reduce((sum, xp) => sum + xp.totalCrafts, 0);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Smelting: "⚒️",
      Weaving: "🧶",
      Tanning: "🧳",
      Woodworking: "🪵",
      Stonecutting: "💎"
    };
    return icons[category] || "🔨";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Smelting: "text-orange-400",
      Weaving: "text-purple-400",
      Tanning: "text-amber-400",
      Woodworking: "text-green-400",
      Stonecutting: "text-blue-400"
    };
    return colors[category] || "text-gray-400";
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      {/* Summary Header */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/30">
        <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center">
          <span className="mr-2">⭐</span>
          Experience Summary
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-2xl font-bold text-yellow-400">
              {formatNumber(totalTradeskillXP)}
            </p>
            <p className="text-sm text-gray-300">Total Tradeskill XP</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">
              {formatNumber(totalStandingXP)}
            </p>
            <p className="text-sm text-gray-300">Total Standing XP</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-lg">
            <p className="text-2xl font-bold text-green-400">
              {formatNumber(totalCrafts)}
            </p>
            <p className="text-sm text-gray-300">Total Crafts</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h5 className="text-md font-semibold text-gray-300 mb-3">
          Breakdown by Category:
        </h5>
        {xpGains.map((xp, index) => (
          <div
            key={index}
            className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/30"
          >
            <div className="flex items-center justify-between mb-2">
              <h6
                className={`font-medium flex items-center ${getCategoryColor(xp.category)}`}
              >
                <span className="mr-2">{getCategoryIcon(xp.category)}</span>
                {xp.category}
              </h6>
              <span className="text-sm text-gray-400">
                {formatNumber(xp.totalCrafts)} crafts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Tradeskill XP:</span>
                <span className="text-yellow-400 font-medium">
                  {formatNumber(xp.tradeskillXP)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Standing XP:</span>
                <span className="text-blue-400 font-medium">
                  {formatNumber(xp.standingXP)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/20">
        <p className="text-xs text-gray-400 text-center">
          💡 XP values are calculated based on base recipe XP without any
          crafting XP bonuses from gear or consumables
        </p>
      </div>
    </div>
  );
};

export default XPSummaryList;
