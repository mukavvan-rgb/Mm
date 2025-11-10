import React, { useState, useEffect } from 'react';
import type { Trade, TradeStatus, TokenScannerResult } from '../types';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { TokenPreviewCard } from './TokenPreviewCard';
import { fetchTokenAutoFill } from '../services/tokenScanner';
import { useDebounce } from '../hooks/useDebounce';
import { useInterval } from '../hooks/useInterval';
import { t } from '../utils/i18n';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id'>) => void;
  trade: Trade | null;
}

const SCANNER_REFRESH_INTERVAL = 30 * 1000; // 30 seconds
const TOTAL_SUPPLY = 1_000_000_000;

export const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, onSave, trade }) => {
  const [formData, setFormData] = useState({
    coinSlugOrAddress: '',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    marketCapAtEntry: '',
    targetMarketCap: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stopLossPercent, setStopLossPercent] = useState('');
  const [entryMode, setEntryMode] = useState<'price' | 'marketCap'>('price');
  
  // State for token scanner
  const [scanQuery, setScanQuery] = useState('');
  const debouncedScanQuery = useDebounce(scanQuery, 500);
  const [scanResult, setScanResult] = useState<TokenScannerResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Clear scanner state on open/close
  useEffect(() => {
    if (isOpen) {
      setScanQuery('');
      setScanResult(null);
      setIsScanning(false);
      setScanError(null);
    }
  }, [isOpen]);

  // Effect to fetch token info when debounced query changes
  useEffect(() => {
    const performScan = async () => {
      if (!debouncedScanQuery) {
        setScanResult(null);
        setScanError(null);
        return;
      }
      setIsScanning(true);
      setScanError(null);
      setScanResult(null);
      try {
        const result = await fetchTokenAutoFill(debouncedScanQuery);
        if (result) {
          setScanResult(result);
        } else {
          setScanError(t('scanTokenNotFound'));
        }
      } catch (e) {
        setScanError(t('scanTokenError'));
      } finally {
        setIsScanning(false);
      }
    };
    performScan();
  }, [debouncedScanQuery]);

  // Interval to refresh scanner preview data
  useInterval(async () => {
    if (scanResult) {
      const updatedResult = await fetchTokenAutoFill(scanResult.baseTokenAddress);
      if (updatedResult) {
        setScanResult(updatedResult);
      }
    }
  }, SCANNER_REFRESH_INTERVAL);

  useEffect(() => {
    if (trade) {
      setEntryMode('price');
      setFormData({
        coinSlugOrAddress: trade.coinSlugOrAddress,
        entryPrice: String(trade.entryPrice),
        targetPrice: String(trade.targetPrice),
        stopLoss: String(trade.stopLoss),
        quantity: String(trade.quantity),
        notes: trade.notes,
        date: new Date(trade.date).toISOString().split('T')[0],
        marketCapAtEntry: String(trade.marketCapAtEntry || ''),
        targetMarketCap: String(trade.targetMarketCap || ''),
      });
      // Pre-fill scanner for editing
      setScanQuery(trade.coinSlugOrAddress);
      setStopLossPercent('');
    } else {
      // Reset form for new trade
       setEntryMode('price');
       setFormData({
        coinSlugOrAddress: '',
        entryPrice: '',
        targetPrice: '',
        stopLoss: '',
        quantity: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        marketCapAtEntry: '',
        targetMarketCap: '',
      });
      setStopLossPercent('');
    }
  }, [trade, isOpen]);

  useEffect(() => {
    if (entryMode === 'marketCap') {
        const mc = parseFloat(formData.marketCapAtEntry);
        if (!isNaN(mc) && mc > 0) {
            const calculatedPrice = mc / TOTAL_SUPPLY;
            setFormData(prev => ({ ...prev, entryPrice: calculatedPrice.toFixed(18).replace(/\.?0+$/, "") }));
        } else {
            setFormData(prev => ({...prev, entryPrice: ''}));
        }
    }
  }, [formData.marketCapAtEntry, entryMode]);

  useEffect(() => {
    const entryPriceNum = parseFloat(formData.entryPrice);
    const percentNum = parseFloat(stopLossPercent);
    if (!isNaN(entryPriceNum) && entryPriceNum > 0 && !isNaN(percentNum) && percentNum > 0) {
        const slPrice = entryPriceNum * (1 - (percentNum / 100));
        setFormData(prev => ({ ...prev, stopLoss: slPrice > 0 ? String(slPrice) : '0' }));
    }
  }, [formData.entryPrice, stopLossPercent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'stopLoss') {
        setStopLossPercent('');
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStopLossPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setStopLossPercent(e.target.value);
  }

  const validate = (): boolean => {
      const newErrors: Record<string, string> = {};
      if (!formData.coinSlugOrAddress.trim()) newErrors.coinSlugOrAddress = t('tokenRequired');
      if (isNaN(parseFloat(formData.entryPrice)) || parseFloat(formData.entryPrice) <= 0) newErrors.entryPrice = t('entryPriceRequired');
      if (entryMode === 'marketCap' && (isNaN(parseFloat(formData.marketCapAtEntry)) || parseFloat(formData.marketCapAtEntry) <= 0)) {
        newErrors.marketCapAtEntry = t('marketCapRequired');
      }
      if (isNaN(parseFloat(formData.targetPrice)) || parseFloat(formData.targetPrice) <= 0) newErrors.targetPrice = t('targetPriceRequired');
      if (isNaN(parseFloat(formData.stopLoss)) || parseFloat(formData.stopLoss) <= 0) newErrors.stopLoss = t('stopLossRequired');
      if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) newErrors.quantity = t('quantityRequired');
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  }
  
  const handleAutoFill = (result: TokenScannerResult) => {
      setFormData(prev => ({
          ...prev,
          coinSlugOrAddress: result.baseTokenAddress,
          entryPrice: String(result.priceUsd),
          marketCapAtEntry: String(result.fdv || ''),
      }));
      setScanQuery(result.baseTokenAddress);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    onSave({
      ...formData,
      entryPrice: parseFloat(formData.entryPrice),
      targetPrice: parseFloat(formData.targetPrice),
      stopLoss: parseFloat(formData.stopLoss),
      quantity: parseFloat(formData.quantity),
      date: new Date(formData.date).toISOString(),
      status: trade?.status ?? 'open' as TradeStatus,
      marketCapAtEntry: formData.marketCapAtEntry ? parseFloat(formData.marketCapAtEntry) : undefined,
      targetMarketCap: formData.targetMarketCap ? parseFloat(formData.targetMarketCap) : undefined,
    });
  };

  const modalFooter = (
    <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
        <Button type="submit" form="add-trade-form">{t('saveTrade')}</Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trade ? t('editTradeTitle') : t('addTradeTitle')} footer={modalFooter}>
      <div className="space-y-4">
        {/* --- Token Scanner --- */}
        <div>
          <label htmlFor="token-scanner" className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text mb-1">
            {t('scanTokenLabel')}
          </label>
          <div className="relative">
             <input
                id="token-scanner"
                type="text"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                placeholder={t('scanTokenPlaceholder')}
                className="w-full bg-background-light dark:bg-background border border-border-light dark:border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {isScanning && (
                <div className="absolute inset-y-0 end-0 flex items-center pe-3">
                  <Spinner className="w-4 h-4" />
                </div>
              )}
          </div>
        </div>

        {scanError && <p className="text-center text-sm text-negative bg-negative/10 p-2 rounded-md">{scanError}</p>}
        {scanResult && <TokenPreviewCard result={scanResult} onAddToTrade={handleAutoFill} />}
        
        <hr className="border-border-light dark:border-border" />

        <form onSubmit={handleSubmit} id="add-trade-form" className="space-y-4">
            <Input
              label={t('tokenAddressLabel')}
              name="coinSlugOrAddress"
              value={formData.coinSlugOrAddress}
              onChange={handleChange}
              placeholder={t('tokenAddressPlaceholder')}
              error={errors.coinSlugOrAddress}
              required
            />
            
            <div className="p-1 rounded-lg bg-background-light dark:bg-background border border-border-light dark:border-border flex items-center">
                <button type="button" onClick={() => setEntryMode('price')} className={`flex-1 text-center text-sm font-medium p-2 rounded-md transition-colors ${entryMode === 'price' ? 'bg-accent text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>{t('entryByPrice')}</button>
                <button type="button" onClick={() => setEntryMode('marketCap')} className={`flex-1 text-center text-sm font-medium p-2 rounded-md transition-colors ${entryMode === 'marketCap' ? 'bg-accent text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>{t('entryByMarketCap')}</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input
                    label={t('entryPriceLabel')}
                    name="entryPrice"
                    type="number"
                    step="any"
                    value={formData.entryPrice}
                    onChange={handleChange}
                    placeholder={entryMode === 'marketCap' ? t('calculatedPricePlaceholder') : 'e.g., 0.015'}
                    error={errors.entryPrice}
                    required
                    disabled={entryMode === 'marketCap'}
                    readOnly={entryMode === 'marketCap'}
                />
                 <Input
                    label={t('marketCapAtEntryLabel')}
                    name="marketCapAtEntry"
                    type="number"
                    value={formData.marketCapAtEntry}
                    onChange={handleChange}
                    placeholder={entryMode === 'price' ? t('marketCapOptionalPlaceholder') : 'e.g., 1500000'}
                    error={errors.marketCapAtEntry}
                    required={entryMode === 'marketCap'}
                />
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('quantityLabel')}
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g., 10.5"
                  error={errors.quantity}
                  required
                />
                <Input
                    label={t('targetMarketCapLabel')}
                    name="targetMarketCap"
                    type="number"
                    value={formData.targetMarketCap}
                    onChange={handleChange}
                    placeholder="e.g., 10000000"
                />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('targetPriceLabel')}
                  name="targetPrice"
                  type="number"
                  value={formData.targetPrice}
                  onChange={handleChange}
                  placeholder="e.g., 180.00"
                  error={errors.targetPrice}
                  required
                />
                <div>
                    <label htmlFor="stopLoss" className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text mb-1">
                        {t('stopLossLabel')}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="stopLoss"
                            name="stopLoss"
                            type="number"
                            step="any"
                            value={formData.stopLoss}
                            onChange={handleChange}
                            placeholder="e.g., 140.00"
                            required
                            className={`w-full bg-background-light dark:bg-background border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent ${errors.stopLoss ? 'border-negative' : 'border-border-light dark:border-border'}`}
                        />
                        <div className="relative">
                            <input
                                type="number"
                                value={stopLossPercent}
                                onChange={handleStopLossPercentChange}
                                placeholder="5"
                                className="w-20 bg-background-light dark:bg-background border rounded-md ps-3 pe-6 py-2 focus:outline-none focus:ring-2 focus:ring-accent border-border-light dark:border-border"
                                aria-label={t('stopLossPercentLabel')}
                            />
                            <span className="absolute inset-y-0 end-0 flex items-center pe-2 text-secondary-text-light dark:text-secondary-text">
                                %
                            </span>
                        </div>
                    </div>
                    {errors.stopLoss && <p className="mt-1 text-xs text-negative">{errors.stopLoss}</p>}
                </div>
            </div>
             <Input
                  label={t('dateLabel')}
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text mb-1">{t('notesLabel')}</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-background-light dark:bg-background border border-border-light dark:border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={t('notesPlaceholder')}
                />
            </div>
        </form>
      </div>
    </Modal>
  );
};