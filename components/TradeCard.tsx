import React from 'react';
import type { Trade } from '../types';
import { TradeStatus } from '../types';
import { EditIcon, TrashIcon, ExternalLinkIcon } from './Icons';
import { Spinner } from './ui/Spinner';
import { t } from '../utils/i18n';

interface TradeCardProps {
  trade: Trade;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: number) => void;
}

const PnlTag: React.FC<{ pnl?: number; pnlPercent?: number }> = ({ pnl, pnlPercent }) => {
    if (pnl === undefined || pnlPercent === undefined) return <Spinner className="w-4 h-4" />;
    
    const isPositive = pnl > 0;
    const isNegative = pnl < 0;
    const colorClass = isPositive ? 'bg-positive/20 text-positive' : isNegative ? 'bg-negative/20 text-negative' : 'bg-gray-500/20 text-secondary-text';
    
    return (
        <span className={`px-2 py-1 text-sm font-semibold rounded-md ${colorClass}`}>
            {pnl.toFixed(2)} USD ({pnlPercent.toFixed(2)}%)
        </span>
    );
};

const formatMarketCap = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1_000_000_000) {
        return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
        return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
};

export const TradeCard: React.FC<TradeCardProps> = ({ trade, isSelected, onToggleSelect, onEdit, onDelete }) => {
    const { 
        id, status, pairInfo, entryPrice, stopLoss, targetPrice, 
        livePrice, pnl, pnlPercent, date, notes, quantity,
        marketCapAtEntry, targetMarketCap
    } = trade;

    const getStatusInfo = () => {
        switch (status) {
            case TradeStatus.OPEN:
                return { text: t('statusOpen'), color: 'bg-blue-500' };
            case TradeStatus.CLOSED_PROFIT:
                return { text: t('statusProfit'), color: 'bg-positive' };
            case TradeStatus.CLOSED_LOSS:
                return { text: t('statusLoss'), color: 'bg-negative' };
            default:
                return { text: t('statusUnknown'), color: 'bg-gray-500' };
        }
    };
    
    const statusInfo = getStatusInfo();
    const costBasis = entryPrice * quantity;

    return (
        <div className={`relative bg-card-light dark:bg-card rounded-lg shadow-lg border overflow-hidden flex flex-col transition-all duration-200 ${isSelected ? 'border-accent ring-2 ring-accent' : 'dark:border-border border-border-light'}`}>
            <div className="absolute top-2 end-2 z-10 bg-card-light dark:bg-card rounded-full">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(id)}
                    className="h-5 w-5 rounded-full border-gray-300 dark:border-gray-600 text-accent focus:ring-accent"
                    aria-label={`Select trade ${id}`}
                />
            </div>
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <h3 className="font-bold text-lg text-primary-text-light dark:text-primary-text">
                                {pairInfo?.baseTokenSymbol ?? t('loading')} / {pairInfo?.quoteTokenSymbol}
                            </h3>
                            <a 
                                href={pairInfo?.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-accent hover:underline flex items-center gap-1"
                            >
                                {t('viewOnDexScreener')} <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                    <div className={`px-3 py-1 text-xs font-bold text-white rounded-full ${statusInfo.color}`}>{statusInfo.text}</div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                     <div className="flex justify-between">
                        <span className="text-secondary-text-light dark:text-secondary-text">{t('pnl')}</span>
                        {status === TradeStatus.OPEN 
                            ? <PnlTag pnl={pnl} pnlPercent={pnlPercent} />
                            : <span className="font-semibold">{pnl !== undefined ? `${pnl.toFixed(2)} USD` : 'N/A'}</span>
                        }
                    </div>

                    <div className="border-t border-border-light/50 dark:border-border/50 pt-2 space-y-1">
                        <div className="flex justify-between">
                            <span className="text-secondary-text-light dark:text-secondary-text">{t('livePrice')}</span>
                            <span className="font-semibold">{livePrice !== undefined ? `$${livePrice}` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary-text-light dark:text-secondary-text">{t('entryCost')}</span>
                            <span className="font-semibold">${entryPrice} / ${costBasis.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-positive">
                            <span className="text-secondary-text-light dark:text-secondary-text">{t('target')}</span>
                            <span className="font-semibold">${targetPrice}</span>
                        </div>
                        <div className="flex justify-between text-negative">
                            <span className="text-secondary-text-light dark:text-secondary-text">{t('stopLoss')}</span>
                            <span className="font-semibold">${stopLoss}</span>
                        </div>
                    </div>

                    {(pairInfo?.fdv || marketCapAtEntry || targetMarketCap) && (
                        <div className="border-t border-border-light/50 dark:border-border/50 pt-2 space-y-1">
                            <div className="flex justify-between">
                                <span className="text-secondary-text-light dark:text-secondary-text">{t('liveMcap')}</span>
                                <span className="font-semibold">{formatMarketCap(pairInfo?.fdv)}</span>
                            </div>
                            {marketCapAtEntry && (
                               <div className="flex justify-between">
                                    <span className="text-secondary-text-light dark:text-secondary-text">{t('entryMcap')}</span>
                                    <span className="font-semibold">{formatMarketCap(marketCapAtEntry)}</span>
                                </div>
                            )}
                            {targetMarketCap && (
                                <div className="flex justify-between text-positive">
                                    <span className="text-secondary-text-light dark:text-secondary-text">{t('targetMcap')}</span>
                                    <span className="font-semibold">{formatMarketCap(targetMarketCap)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {notes && (
                    <div className="mt-4">
                        <p className="text-xs text-secondary-text-light dark:text-secondary-text bg-background-light/50 dark:bg-background/50 p-2 rounded-md">{notes}</p>
                    </div>
                )}
            </div>
            
            <div className="bg-background-light/50 dark:bg-black/20 p-2 flex justify-between items-center text-xs text-secondary-text-light dark:text-secondary-text">
                 <span>{new Date(date).toLocaleDateString()}</span>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(trade)} className="p-1 hover:text-accent" aria-label={t('editTradeTitle')}>
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(id)} className="p-1 hover:text-negative" aria-label={t('delete')}>
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};