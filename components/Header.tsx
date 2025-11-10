
import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, PlusIcon, DownloadIcon, UploadIcon } from './Icons';
import { Button } from './ui/Button';
import { t } from '../utils/i18n';

interface HeaderProps {
  onAddTrade: () => void;
  onExport: (format: 'csv' | 'xlsx') => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddTrade, onExport, onImport }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
      setIsDarkMode(true);
    } else {
      root.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      localStorage.theme = 'light';
      root.classList.remove('dark');
    } else {
      localStorage.theme = 'dark';
      root.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
  };
  
  const handleExportClick = (format: 'csv' | 'xlsx') => {
      onExport(format);
      setIsExportMenuOpen(false);
  }

  return (
    <header className="bg-card-light dark:bg-card border-b border-border-light dark:border-border sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-text-light dark:text-primary-text">
                <span className="text-accent">{t('headerTitleAccent')}</span>{t('headerTitle')}
            </h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
             <Button variant="secondary" onClick={onImport} className="hidden sm:inline-flex">
                <UploadIcon className="w-4 h-4 ms-2" />
                {t('import')}
             </Button>

             <div className="relative">
                <Button variant="secondary" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
                    <DownloadIcon className="w-4 h-4 sm:ms-2" />
                    <span className="hidden sm:inline">{t('export')}</span>
                </Button>
                {isExportMenuOpen && (
                    <div 
                        onMouseLeave={() => setIsExportMenuOpen(false)}
                        className="absolute end-0 mt-2 w-48 bg-card-light dark:bg-card border border-border-light dark:border-border rounded-md shadow-lg z-20"
                    >
                       <button onClick={() => handleExportClick('csv')} className="block w-full text-start px-4 py-2 text-sm text-primary-text-light dark:text-primary-text hover:bg-background-light dark:hover:bg-background">
                           {t('exportAsCsv')}
                       </button>
                        <button onClick={() => handleExportClick('xlsx')} className="block w-full text-start px-4 py-2 text-sm text-primary-text-light dark:text-primary-text hover:bg-background-light dark:hover:bg-background">
                           {t('exportAsXlsx')}
                       </button>
                    </div>
                )}
             </div>

            <Button onClick={onAddTrade} className="hidden sm:flex">
              <PlusIcon className="w-4 h-4 ms-2" />
              {t('addTrade')}
            </Button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-secondary-text-light dark:text-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};