
import React from 'react';
import type { Trade } from '../types';
import { TradeCard } from './TradeCard';
import { t } from '../utils/i18n';

interface TradeListProps {
  openTrades: Trade[];
  closedTrades: Trade[];
  selectedTradeIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: (tradeIds: number[]) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: number) => void;
}

const TradeSection: React.FC<{
    titleKey: 'openTradesTitle' | 'closedTradesTitle';
    trades: Trade[];
    selectedTradeIds: Set<number>;
    onToggleSelect: (id: number) => void;
    onToggleSelectAll: (tradeIds: number[]) => void;
    onEdit: (trade: Trade) => void;
    onDelete: (id: number) => void;
}> = ({ titleKey, trades, selectedTradeIds, onToggleSelect, onToggleSelectAll, onEdit, onDelete }) => {
    const allInSectionSelected = trades.length > 0 && trades.every(t => selectedTradeIds.has(t.id));
    const title = t(titleKey);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{title} ({trades.length})</h2>
                {trades.length > 0 && (
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onToggleSelectAll(trades.map(t => t.id))}>
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent pointer-events-none"
                            checked={allInSectionSelected}
                            readOnly
                        />
                        <label className="text-sm select-none cursor-pointer">{t('selectAll')}</label>
                    </div>
                )}
            </div>
            {trades.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trades.map(trade => (
                        <TradeCard
                            key={trade.id}
                            trade={trade}
                            isSelected={selectedTradeIds.has(trade.id)}
                            onToggleSelect={onToggleSelect}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-secondary-text-light dark:text-secondary-text text-center py-8">
                    {titleKey === 'openTradesTitle' ? t('noOpenTrades') : t('noClosedTrades')}
                </p>
            )}
        </div>
    );
};


export const TradeList: React.FC<TradeListProps> = ({ openTrades, closedTrades, selectedTradeIds, onToggleSelect, onToggleSelectAll, onEdit, onDelete }) => {
  return (
    <div className="space-y-8">
      <TradeSection
        titleKey="openTradesTitle"
        trades={openTrades}
        selectedTradeIds={selectedTradeIds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <TradeSection
        titleKey="closedTradesTitle"
        trades={closedTrades}
        selectedTradeIds={selectedTradeIds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};