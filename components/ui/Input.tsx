
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, name, error, ...props }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-secondary-text-light dark:text-secondary-text mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`w-full bg-background-light dark:bg-background border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent ${error ? 'border-negative' : 'border-border-light dark:border-border'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-negative">{error}</p>}
    </div>
  );
};
