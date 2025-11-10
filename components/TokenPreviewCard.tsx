import React from 'react';
import type { TokenScannerResult } from '../types';
import { ExternalLinkIcon } from './Icons';
import { Button } from './ui/Button';
import { t } from '../utils/i18n';

interface TokenPreviewCardProps {
  result: TokenScannerResult;
  onAddToTrade: (result: TokenScannerResult) => void;
}

export const TokenPreviewCard: React.FC<TokenPreviewCardProps> = ({ result, onAddToTrade }) => {
  const { 
    priceUsd, volume24h, liquidityUsd, priceChange24h, url, 
    baseTokenSymbol, baseTokenName, quoteTokenSymbol 
  } = result;

  const isPositive = priceChange24h > 0;
  const changeColor = isPositive ? 'text-positive' : 'text-negative';
  const borderColor = isPositive ? 'border-positive' : 'border-negative';

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  const formatPrice = (value: number) => {
     if (value < 0.01) {
         return `$${value.toPrecision(4)}`;
     }
     return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  }

  return (
    <div className={`p-4 my-2 border-s-4 ${borderColor} bg-background-light dark:bg-background rounded-e-lg`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-lg">{baseTokenName} ({baseTokenSymbol}/{quoteTokenSymbol})</h4>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            {t('viewOnDexScreener')} <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
        <Button size="sm" onClick={() => onAddToTrade(result)}>{t('addToTrade')}</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
        <div>
          <div className="text-secondary-text-light dark:text-secondary-text text-xs">{t('price')}</div>
          <div className="font-semibold text-lg">{formatPrice(priceUsd)}</div>
        </div>
        <div>
          <div className="text-secondary-text-light dark:text-secondary-text text-xs">{t('change24h')}</div>
          <div className={`font-semibold ${changeColor}`}>{priceChange24h.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-secondary-text-light dark:text-secondary-text text-xs">{t('volume24h')}</div>
          <div className="font-semibold">{formatCurrency(volume24h)}</div>
        </div>
        <div>
          <div className="text-secondary-text-light dark:text-secondary-text text-xs">{t('liquidity')}</div>
          <div className="font-semibold">{formatCurrency(liquidityUsd)}</div>
        </div>
      </div>
    </div>
  );
};