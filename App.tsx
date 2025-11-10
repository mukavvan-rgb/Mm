
import React, { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TradeList } from './components/TradeList';
import { AddTradeModal } from './components/AddTradeModal';
import { useTrades } from './hooks/useTrades';
import type { Trade } from './types';
import { TradeStatus } from './types';
import { exportToCsv, exportToXlsx } from './utils/export';
import { PlusIcon } from './components/Icons';
import { BulkActionBar } from './components/BulkActionBar';
import { ImportTradesModal } from './components/ImportTradesModal';
import { calculatePnl } from './utils/calculations';
import { t } from './utils/i18n';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const { 
    trades, 
    addTrade, 
    updateTrade, 
    deleteTrade, 
    isLoading,
    error,
    bulkDeleteTrades,
    bulkUpdateTrades,
    bulkAddTrades,
    isUpdatingPrices,
    refreshPrices,
  } = useTrades();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTradeIds, setSelectedTradeIds] = useState(new Set<number>());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleOpenModal = (trade: Trade | null = null) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTrade(null);
    setIsModalOpen(false);
  };

  const handleSaveTrade = async (trade: Omit<Trade, 'id'>) => {
    if (editingTrade) {
      await updateTrade({ ...trade, id: editingTrade.id });
    } else {
      await addTrade(trade);
    }
    handleCloseModal();
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (format === 'csv') {
      exportToCsv(trades, 'trades.csv');
    } else {
      exportToXlsx(trades, 'trades.xlsx');
    }
  };
  
  const handleImportSave = async (newTrades: Omit<Trade, 'id'>[]) => {
      await bulkAddTrades(newTrades);
      setIsImportModalOpen(false);
  };

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedTradeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleToggleSelectAll = useCallback((tradeIds: number[]) => {
      setSelectedTradeIds(prev => {
          const newSet = new Set(prev);
          const allSelectedInSection = tradeIds.every(id => newSet.has(id));
          
          if (allSelectedInSection) {
              tradeIds.forEach(id => newSet.delete(id));
          } else {
              tradeIds.forEach(id => newSet.add(id));
          }
          return newSet;
      });
  }, []);

  const handleClearSelection = () => {
    setSelectedTradeIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (window.confirm(t('deleteConfirm', selectedTradeIds.size))) {
      await bulkDeleteTrades(Array.from(selectedTradeIds));
      handleClearSelection();
    }
  };
  
  const handleBulkClose = async () => {
      const tradesToClose = trades.filter(t => selectedTradeIds.has(t.id) && t.status === TradeStatus.OPEN && t.livePrice !== undefined);
      if (tradesToClose.length === 0) {
          alert(t('noTradesToClose'));
          return;
      }

      if (window.confirm(t('closeConfirm', tradesToClose.length))) {
          const updatedTrades = tradesToClose.map(t => {
              const { pnl } = calculatePnl(t, t.livePrice!);
              return {
                  ...t,
                  status: pnl >= 0 ? TradeStatus.CLOSED_PROFIT : TradeStatus.CLOSED_LOSS,
              };
          });
          await bulkUpdateTrades(updatedTrades);
          handleClearSelection();
      }
  };

  const openTrades = useMemo(() => trades.filter(t => t.status === 'open'), [trades]);
  const closedTrades = useMemo(() => trades.filter(t => t.status !== 'open'), [trades]);

  return (
    <div className={`min-h-screen flex flex-col ${selectedTradeIds.size > 0 ? 'pb-20' : ''}`}>
      <Header 
        onAddTrade={() => handleOpenModal()} 
        onExport={handleExport}
        onImport={() => setIsImportModalOpen(true)}
      />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <Dashboard 
          trades={trades} 
          onRefreshPrices={refreshPrices}
          isRefreshing={isUpdatingPrices}
        />
        
        {isLoading && <p className="text-center text-secondary-text mt-8">{t('loading')}</p>}
        {error && <p className="text-center text-negative mt-8">{t('errorLoading')} {error}</p>}

        {!isLoading && !error && (
            <TradeList 
                openTrades={openTrades} 
                closedTrades={closedTrades}
                onEdit={handleOpenModal} 
                onDelete={deleteTrade}
                selectedTradeIds={selectedTradeIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
            />
        )}

        {isModalOpen && (
          <AddTradeModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveTrade}
            trade={editingTrade}
          />
        )}
      </main>
      <ImportTradesModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSave={handleImportSave}
      />
       <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-6 end-6 bg-accent text-white rounded-full p-4 shadow-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background z-20"
        aria-label={t('addTrade')}
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {selectedTradeIds.size > 0 && (
          <BulkActionBar 
              selectedCount={selectedTradeIds.size}
              onClearSelection={handleClearSelection}
              onDeleteSelected={handleBulkDelete}
              onCloseSelected={handleBulkClose}
          />
      )}
      <Footer />
    </div>
  );
};

export default App;