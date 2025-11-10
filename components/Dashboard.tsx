
import React, { useMemo } from 'react';
import type { Trade } from '../types';
import { TradeStatus } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowUpRightIcon, ArrowDownRightIcon, MinusIcon, RefreshIcon } from './Icons';
import { Button } from './ui/Button';
import { t } from '../utils/i18n';

interface DashboardProps {
  trades: Trade[];
  onRefreshPrices: () => void;
  isRefreshing: boolean;
}

const StatCard: React.FC<{ title: string; value: string | number; change?: number; helpText: string; }> = ({ title, value, change, helpText }) => {
    const isPositive = change !== undefined && change > 0;
    const isNegative = change !== undefined && change < 0;
    const changeColor = isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-secondary-text';

    return (
        <div className="bg-card-light dark:bg-card p-4 rounded-lg shadow-md flex-1">
            <h3 className="text-sm font-medium text-secondary-text-light dark:text-secondary-text">{title}</h3>
            <div className="flex items-baseline space-x-2 mt-1">
                <p className="text-2xl font-semibold text-primary-text-light dark:text-primary-text">{value}</p>
                {change !== undefined && (
                    <div className={`flex items-center text-sm font-semibold ${changeColor}`}>
                        {isPositive && <ArrowUpRightIcon className="w-4 h-4" />}
                        {isNegative && <ArrowDownRightIcon className="w-4 h-4" />}
                        {change === 0 && <MinusIcon className="w-4 h-4" />}
                        <span>{Math.abs(change).toFixed(2)}%</span>
                    </div>
                )}
            </div>
            <p className="text-xs text-secondary-text-light dark:text-secondary-text mt-1">{helpText}</p>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ trades, onRefreshPrices, isRefreshing }) => {
    const stats = useMemo(() => {
        const closedTrades = trades.filter(t => t.status !== TradeStatus.OPEN);
        const openTrades = trades.filter(t => t.status === TradeStatus.OPEN);

        const totalPnl = trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
        const totalInvestment = trades.reduce((acc, t) => acc + t.entryPrice * t.quantity, 0);
        const totalQuantity = trades.reduce((acc, t) => acc + t.quantity, 0);
        const totalPnlPercent = totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;
        
        const avgEntryPrice = totalQuantity > 0 ? totalInvestment / totalQuantity : 0;

        const wins = closedTrades.filter(t => t.status === TradeStatus.CLOSED_PROFIT).length;
        const losses = closedTrades.filter(t => t.status === TradeStatus.CLOSED_LOSS).length;
        const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
        
        return { totalPnl, totalPnlPercent, winRate, openTradesCount: openTrades.length, closedTradesCount: closedTrades.length, avgEntryPrice };
    }, [trades]);

    const equityCurveData = useMemo(() => {
        const closedTradesSorted = trades
            .filter(t => t.status !== TradeStatus.OPEN && t.pnl !== undefined)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let cumulativePnl = 0;
        const historicalData = closedTradesSorted.map((trade, index) => {
            cumulativePnl += trade.pnl!;
            return {
                name: `${t('trade')} ${index + 1}`,
                date: new Date(trade.date).toLocaleDateString(),
                equity: cumulativePnl
            };
        });

        const data = [{ name: t('start'), date: t('initial'), equity: 0 }, ...historicalData];

        const openTrades = trades.filter(t => t.status === TradeStatus.OPEN && t.pnl !== undefined);
        if (openTrades.length > 0) {
            const lastRealizedPnl = data.length > 0 ? data[data.length - 1].equity : 0;
            const unrealizedPnl = openTrades.reduce((acc, trade) => acc + trade.pnl!, 0);
            const currentEquity = lastRealizedPnl + unrealizedPnl;
            
            data.push({
                name: t('current'),
                date: new Date().toLocaleDateString(),
                equity: currentEquity,
            });
        }
        
        return data;
    }, [trades]);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{t('dashboard')}</h2>
              <Button variant="secondary" onClick={onRefreshPrices} disabled={isRefreshing}>
                  <RefreshIcon className={`w-4 h-4 sm:me-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                      {isRefreshing ? t('refreshing') : t('refreshPrices')}
                  </span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    title={t('totalPnl')} 
                    value={`$${stats.totalPnl.toFixed(2)}`} 
                    change={stats.totalPnlPercent}
                    helpText={t('pnlHelpText')}
                />
                <StatCard 
                    title={t('winRate')} 
                    value={`${stats.winRate.toFixed(1)}%`}
                    helpText={`${stats.closedTradesCount} ${t('winRateHelpText')}`}
                />
                 <StatCard 
                    title={t('openTrades')} 
                    value={stats.openTradesCount}
                    helpText={t('openTradesHelpText')}
                />
                 <StatCard 
                    title={t('avgEntryPrice')} 
                    value={`$${stats.avgEntryPrice.toFixed(2)}`}
                    helpText={t('avgEntryPriceHelpText')}
                />
            </div>

            <div className="bg-card-light dark:bg-card p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">{t('equityCurve')}</h3>
                <div style={{ width: '100%', height: 300 }}>
                    {equityCurveData.length > 1 ? (
                        <ResponsiveContainer>
                            <AreaChart data={equityCurveData} margin={{ top: 10, right: 0, left: 30, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201, 209, 217, 0.2)" />
                                <XAxis dataKey="name" stroke="#8B949E" fontSize={12} reversed={true} />
                                <YAxis yAxisId="right" orientation="right" stroke="#8B949E" fontSize={12} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#161B22', 
                                        borderColor: '#30363D',
                                        color: '#C9D1D9'
                                    }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length > 0 && payload[0].payload.date) {
                                            return payload[0].payload.date;
                                        }
                                        return label;
                                    }}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, t('equity')]}
                                />
                                <Area yAxisId="right" type="monotone" dataKey="equity" stroke="#00D1FF" fillOpacity={1} fill="url(#colorEquity)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-secondary-text-light dark:text-secondary-text">
                            <div>
                                <p className="font-semibold">{t('equityCurveEmptyTitle')}</p>
                                <p className="text-sm mt-1">{t('equityCurveEmptyDesc')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};