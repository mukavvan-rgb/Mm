import React, { useState } from 'react';
import type { Trade } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { UploadIcon, DownloadIcon } from './Icons';
import { parseCsv } from '../utils/import';
import { downloadCsvTemplate } from '../utils/export';
import { t } from '../utils/i18n';

interface ImportTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trades: Omit<Trade, 'id'>[]) => void;
}

export const ImportTradesModal: React.FC<ImportTradesModalProps> = ({ isOpen, onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<Omit<Trade, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setIsParsing(true);
      setParsedTrades([]);
      try {
        const trades = await parseCsv(selectedFile);
        setParsedTrades(trades);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file.');
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleSave = () => {
    if (parsedTrades.length > 0) {
      onSave(parsedTrades);
      handleClose();
    }
  };
  
  const handleClose = () => {
      setFile(null);
      setParsedTrades([]);
      setError(null);
      setIsParsing(false);
      onClose();
  }

  const handleDownloadTemplate = () => {
    downloadCsvTemplate();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('importTitle')}>
      <div className="space-y-4">
        <div className="text-sm p-3 bg-background-light dark:bg-background rounded-md border border-border-light dark:border-border space-y-2">
            <p className="font-semibold">{t('importInstructionsTitle')}</p>
             <ol className="list-decimal list-inside text-secondary-text-light dark:text-secondary-text space-y-1">
                <li>{t('importInstruction1')}</li>
                <li>{t('importInstruction2')}</li>
                <li>{t('importInstruction3')}</li>
                <li>{t('importInstruction4')}</li>
            </ol>
             <Button variant="secondary" onClick={handleDownloadTemplate} className="w-full mt-2">
                <DownloadIcon className="w-4 h-4 ms-2" />
                {t('downloadTemplate')}
            </Button>
        </div>
        <div>
          <label htmlFor="csv-upload" className="w-full inline-flex justify-center items-center px-4 py-3 border-2 border-dashed border-border-light dark:border-border rounded-md cursor-pointer hover:bg-background-light dark:hover:bg-background">
            <UploadIcon className="w-5 h-5 ms-2" />
            <span className="font-medium">{file ? file.name : t('selectCsvFile')}</span>
          </label>
          <input id="csv-upload" type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
        </div>
        
        {isParsing && <p className="text-center text-secondary-text">{t('parsingFile')}</p>}
        {error && <p className="text-negative text-sm text-center bg-negative/10 p-2 rounded-md">{error}</p>}

        {parsedTrades.length > 0 && (
          <div className="text-center bg-positive/10 text-positive p-2 rounded-md">
            <h3 className="font-semibold">{parsedTrades.length} {t('importSuccess')}</h3>
            <p className="text-sm">{t('importReady')}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>{t('cancel')}</Button>
          <Button type="button" onClick={handleSave} disabled={parsedTrades.length === 0 || isParsing}>
            {t('importButton')} {parsedTrades.length > 0 ? parsedTrades.length : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
};