import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, PlusIcon, UploadIcon, InstallIcon, ActionsIcon } from './Icons';
import { Button } from './ui/Button';
import { t } from '../utils/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  onAddTrade: () => void;
  onExport: (format: 'csv' | 'xlsx') => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddTrade, onExport, onImport }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const { canInstall, triggerInstallPrompt } = usePWAInstall();

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

  const toggleTheme = (theme: 'light' | 'dark') => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      localStorage.theme = 'dark';
      root.classList.add('dark');
      setIsDarkMode(true);
    } else {
      localStorage.theme = 'light';
      root.classList.remove('dark');
      setIsDarkMode(false);
    }
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
             {canInstall && (
                <>
                    {/* Mobile Button */}
                    <button
                        onClick={triggerInstallPrompt}
                        className="p-2 rounded-full text-secondary-text-light dark:text-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700 sm:hidden"
                        aria-label={t('installApp')}
                    >
                        <InstallIcon className="w-5 h-5" />
                    </button>
                    {/* Desktop Button */}
                    <Button variant="secondary" onClick={triggerInstallPrompt} className="hidden sm:inline-flex">
                        <InstallIcon className="w-4 h-4 me-2" />
                        {t('installApp')}
                    </Button>
                </>
            )}
            
             {/* Mobile Import Button */}
             <button
                onClick={onImport}
                className="p-2 rounded-full text-secondary-text-light dark:text-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700 sm:hidden"
                aria-label={t('import')}
            >
                <UploadIcon className="w-5 h-5" />
            </button>
             {/* Desktop Import Button */}
             <Button variant="secondary" onClick={onImport} className="hidden sm:inline-flex">
                <UploadIcon className="w-4 h-4 me-2" />
                {t('import')}
             </Button>

             <div className="relative">
                {/* Mobile Actions/Export Button */}
                <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="p-2 rounded-full text-secondary-text-light dark:text-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700 sm:hidden"
                    aria-label={t('export')}
                >
                    <ActionsIcon className="w-5 h-5" />
                </button>
                {/* Desktop Actions/Export Button */}
                <Button variant="secondary" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="hidden sm:inline-flex">
                    <ActionsIcon className="w-4 h-4 me-2" />
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
              <PlusIcon className="w-4 h-4 me-2" />
              {t('addTrade')}
            </Button>
            
            <div className="flex items-center p-1 rounded-full bg-background-light dark:bg-background border border-border-light dark:border-border">
                <button
                    onClick={() => toggleTheme('light')}
                    className={`p-1.5 rounded-full transition-colors ${!isDarkMode ? 'bg-accent text-white' : 'text-secondary-text-light dark:text-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
                    aria-label={t('switchToLightTheme')}
                >
                    <SunIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => toggleTheme('dark')}
                    className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-accent text-white' : 'text-secondary-text-light dark:text-secondary-text hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
                    aria-label={t('switchToDarkTheme')}
                >
                    <MoonIcon className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};