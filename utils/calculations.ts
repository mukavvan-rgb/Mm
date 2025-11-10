
import type { Trade } from '../types';

/**
 * Calculates the Profit and Loss (P&L) for a given trade based on a live price.
 * @param trade The trade object, containing entry price and quantity.
 * @param livePrice The current market price of the asset.
 * @returns An object containing the P&L in USD and the P&L as a percentage.
 */
export const calculatePnl = (trade: Trade, livePrice: number): { pnl: number, pnlPercent: number } => {
  const costBasis = trade.entryPrice * trade.quantity;
  const currentValue = livePrice * trade.quantity;
  const pnl = currentValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  return { pnl, pnlPercent };
};
