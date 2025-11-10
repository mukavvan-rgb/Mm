import React from 'react';
import { Button } from './ui/Button';
// FIX: Removed unused import of XCircleIcon to resolve error, as the icon is not exported from './Icons'.
import { TrashIcon } from './Icons';
import { t } from '../utils/i18n';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onCloseSelected: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, onClearSelection, onDeleteSelected, onCloseSelected }) => {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-card-light dark:bg-card border-t border-border-light dark:border-border shadow-lg z-30 animate-slide-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-lg">{selectedCount} {t('selected')}</span>
          <Button variant="secondary" onClick={onClearSelection}>{t('deselectAll')}</Button>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={onCloseSelected}>
            {t('closeSelected')}
          </Button>
          <Button
            onClick={onDeleteSelected}
            className="bg-negative border-transparent text-white hover:bg-negative/90"
          >
            <TrashIcon className="w-4 h-4 ms-2" />
            {t('delete')}
          </Button>
        </div>
      </div>
       <style jsx>{`
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
