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

export const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, onSave, trade }) => {
  const [formData, setFormData] = useState({
    coinSlugOrAddress: '',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
      setFormData({
        coinSlugOrAddress: trade.coinSlugOrAddress,
        entryPrice: String(trade.entryPrice),
        targetPrice: String(trade.targetPrice),
        stopLoss: String(trade.stopLoss),
        quantity: String(trade.quantity),
        notes: trade.notes,
        date: new Date(trade.date).toISOString().split('T')[0],
      });
      // Pre-fill scanner for editing
      setScanQuery(trade.coinSlugOrAddress);
    } else {
      // Reset form for new trade
       setFormData({
        coinSlugOrAddress: '',
        entryPrice: '',
        targetPrice: '',
        stopLoss: '',
        quantity: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [trade, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validate = (): boolean => {
      const newErrors: Record<string, string> = {};
      if (!formData.coinSlugOrAddress.trim()) newErrors.coinSlugOrAddress = t('tokenRequired');
      if (isNaN(parseFloat(formData.entryPrice)) || parseFloat(formData.entryPrice) <= 0) newErrors.entryPrice = t('entryPriceRequired');
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
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trade ? t('editTradeTitle') : t('addTradeTitle')}>
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

        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('tokenAddressLabel')}
              name="coinSlugOrAddress"
              value={formData.coinSlugOrAddress}
              onChange={handleChange}
              placeholder={t('tokenAddressPlaceholder')}
              error={errors.coinSlugOrAddress}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('entryPriceLabel')}
                  name="entryPrice"
                  type="number"
                  value={formData.entryPrice}
                  onChange={handleChange}
                  placeholder="e.g., 150.25"
                  error={errors.entryPrice}
                  required
                />
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
                <Input
                  label={t('stopLossLabel')}
                  name="stopLoss"
                  type="number"
                  value={formData.stopLoss}
                  onChange={handleChange}
                  placeholder="e.g., 140.00"
                  error={errors.stopLoss}
                  required
                />
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
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
              <Button type="submit">{t('saveTrade')}</Button>
            </div>
        </form>
      </div>
    </Modal>
  );
};