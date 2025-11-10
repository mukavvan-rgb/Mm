import { useState, useEffect, useCallback } from 'react';
import type { Trade } from '../types';
import { TradeStatus } from '../types';
import { dbService } from '../services/db';
import { dexscreenerService } from '../services/dexscreener';
import { calculatePnl } from '../utils/calculations';

const PRICE_UPDATE_INTERVAL_SEC = 30 * 1000; // 30 seconds

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateTradePrices = useCallback(async (currentTrades: Trade[]) => {
    const openTrades = currentTrades.filter(t => t.status === TradeStatus.OPEN);
    if (openTrades.length === 0) return;

    const addresses = openTrades.map(t => t.coinSlugOrAddress);
    try {
      const priceDataMap = await dexscreenerService.fetchPairsData(addresses);
      
      setTrades(prevTrades => {
        return prevTrades.map(trade => {
          if (trade.status !== TradeStatus.OPEN) return trade;

          const priceInfo = priceDataMap.get(trade.coinSlugOrAddress);
          if (priceInfo) {
            const { pnl, pnlPercent } = calculatePnl(trade, priceInfo.priceUsd);
            let newStatus = trade.status;
            
            if(priceInfo.priceUsd >= trade.targetPrice) {
                newStatus = TradeStatus.CLOSED_PROFIT;
            } else if (priceInfo.priceUsd <= trade.stopLoss) {
                newStatus = TradeStatus.CLOSED_LOSS;
            }

            return { 
                ...trade, 
                livePrice: priceInfo.priceUsd, 
                pnl,
                pnlPercent,
                pairInfo: priceInfo,
                status: newStatus, // Auto-close trade
            };
          }
          return trade; // Return original trade if no price info
        });
      });

    } catch (e) {
      console.error("Error updating trade prices:", e);
      // Not setting a user-facing error for background updates
    }
  }, []);

  const refreshPrices = useCallback(async () => {
      setIsUpdatingPrices(true);
      await updateTradePrices(trades);
      setIsUpdatingPrices(false);
  }, [trades, updateTradePrices]);

  useEffect(() => {
    const loadTrades = async () => {
      try {
        setIsLoading(true);
        const storedTrades = await dbService.getAllTrades();
        setTrades(storedTrades.map(t => ({...t})));
        await updateTradePrices(storedTrades);
      } catch (e) {
        setError("Failed to load trades from the database.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const intervalId = setInterval(() => {
        // Use a functional update to ensure we have the latest trades state
        setTrades(currentTrades => {
            updateTradePrices(currentTrades);
            return currentTrades; // This update pattern is tricky, it might be better to just re-read from the state variable inside the interval.
        });
    }, PRICE_UPDATE_INTERVAL_SEC);
    
    return () => clearInterval(intervalId);
  }, [updateTradePrices]);

  const addTrade = async (tradeData: Omit<Trade, 'id'>) => {
    try {
      const newTrade = { ...tradeData, status: TradeStatus.OPEN };
      const id = await dbService.addTrade(newTrade);
      const fullNewTrade = { ...newTrade, id };
      setTrades(prev => [...prev, fullNewTrade]);
      await updateTradePrices([fullNewTrade]);
    } catch (e) {
      setError("Failed to add trade.");
      console.error(e);
    }
  };

  const updateTrade = async (tradeData: Trade) => {
    try {
      await dbService.updateTrade(tradeData);
      setTrades(prev => prev.map(t => t.id === tradeData.id ? tradeData : t));
      if (tradeData.status === TradeStatus.OPEN) {
        await updateTradePrices([tradeData]);
      }
    } catch (e) {
      setError("Failed to update trade.");
      console.error(e);
    }
  };

  const deleteTrade = async (id: number) => {
    try {
      await dbService.deleteTrade(id);
      setTrades(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setError("Failed to delete trade.");
      console.error(e);
    }
  };

  const bulkAddTrades = async (newTrades: Omit<Trade, 'id'>[]) => {
      try {
          const tradesToAdd = newTrades.map(t => ({...t, status: TradeStatus.OPEN as TradeStatus}));
          await dbService.bulkAddTrades(tradesToAdd);
          
          // Reload all trades from DB to get the new items with their generated IDs
          const allTrades = await dbService.getAllTrades();
          setTrades(allTrades);
          await updateTradePrices(allTrades);

      } catch (e) {
          setError("Failed to import trades.");
          console.error(e);
          throw e; // re-throw to be caught in component
      }
  };

  const bulkUpdateTrades = async (tradesToUpdate: Trade[]) => {
    try {
      await dbService.bulkUpdateTrades(tradesToUpdate);
      const updatedIds = new Set(tradesToUpdate.map(t => t.id));
      setTrades(prev => prev.map(t => {
        const updatedTrade = tradesToUpdate.find(ut => ut.id === t.id);
        return updatedTrade || t;
      }));
    } catch (e) {
      setError("Failed to update selected trades.");
      console.error(e);
    }
  };

  const bulkDeleteTrades = async (ids: number[]) => {
    try {
      await dbService.bulkDeleteTrades(ids);
      setTrades(prev => prev.filter(t => !ids.includes(t.id)));
    } catch (e) {
      setError("Failed to delete selected trades.");
      console.error(e);
    }
  };

  return { trades, addTrade, updateTrade, deleteTrade, isLoading, error, bulkAddTrades, bulkUpdateTrades, bulkDeleteTrades, isUpdatingPrices, refreshPrices };
}
