
import React from 'react';
import { t } from '../utils/i18n';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-card-light dark:bg-card border-t border-border-light dark:border-border mt-auto">
            <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-secondary-text-light dark:text-secondary-text">
                <p>{t('footerText', new Date().getFullYear())}</p>
            </div>
        </footer>
    );
};
