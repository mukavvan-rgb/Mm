import type { Trade } from '../types';
import { TradeStatus } from '../types';
import { CSV_TEMPLATE_HEADERS } from './csvTemplate';

// Normalize headers for case-insensitive and space-insensitive matching.
const REQUIRED_HEADERS = CSV_TEMPLATE_HEADERS.map(h => h.toLowerCase().replace(/\s+/g, ''));

/**
 * Parses a CSV line, handling quoted fields.
 * This is a simple implementation and may not cover all edge cases of RFC 4180.
 * @param text The line to parse.
 * @returns An array of strings representing the fields.
 */
function parseCsvLine(text: string): string[] {
    const results = [];
    let startValue = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            let value = text.substring(startValue, i).trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/""/g, '"');
            }
            results.push(value);
            startValue = i + 1;
        }
    }
    // Add the last value
    let value = text.substring(startValue).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
    }
    results.push(value);
    return results;
}

/**
 * Parses a CSV file to extract trade data.
 * @param file The CSV file to parse.
 * @returns A promise that resolves to an array of trade objects.
 * @rejects An error if the file is empty, has incorrect headers, or fails to be read.
 */
export function parseCsv(file: File): Promise<Omit<Trade, 'id'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      if (!csv) {
        return reject(new Error('File is empty or could not be read.'));
      }
      
      const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        return reject(new Error('CSV must have a header row and at least one data row.'));
      }

      // Headers from the file, normalized
      const fileHeaders = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));

      // Check for missing required headers
      const missingHeaders = REQUIRED_HEADERS.filter(rh => !fileHeaders.includes(rh));
      if (missingHeaders.length > 0) {
        return reject(new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}. Please use the template.`));
      }
      
      // Map header names to their index in the row
      const headerIndexMap: { [key: string]: number } = {};
      fileHeaders.forEach((h, i) => {
          headerIndexMap[h] = i;
      });
      
      const trades: Omit<Trade, 'id'>[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const data = parseCsvLine(lines[i]);
        try {
            const entryPrice = parseFloat(data[headerIndexMap['entryprice']]);
            const targetPrice = parseFloat(data[headerIndexMap['targetprice']]);
            const stopLoss = parseFloat(data[headerIndexMap['stoploss']]);
            const quantity = parseFloat(data[headerIndexMap['quantity']]);
            const dateStr = data[headerIndexMap['date']];
            const date = new Date(dateStr);
            
            // All numeric and date fields must be valid
            if (!dateStr || isNaN(date.getTime()) || isNaN(entryPrice) || isNaN(targetPrice) || isNaN(stopLoss) || isNaN(quantity)) {
                errors.push(`Skipping invalid or incomplete data in row ${i + 1}.`);
                continue;
            }

            const statusStr = data[headerIndexMap['status']]?.toLowerCase();
            let status: TradeStatus;
            // Status must be one of the allowed values
            if (statusStr === 'closed-profit' || statusStr === 'closed-loss' || statusStr === 'open') {
                status = statusStr as TradeStatus;
            } else {
                errors.push(`Skipping row ${i + 1} due to invalid status: "${statusStr}". Must be 'open', 'closed-profit', or 'closed-loss'.`);
                continue;
            }

            trades.push({
                coinSlugOrAddress: data[headerIndexMap['coinslugoraddress']].trim(),
                entryPrice,
                targetPrice,
                stopLoss,
                quantity,
                date: date.toISOString(),
                notes: data[headerIndexMap['notes']], // Notes are now required
                status,
            });
        } catch (e) {
          errors.push(`Error parsing row ${i + 1}.`);
        }
      }

      if (trades.length === 0 && lines.length > 1) {
          return reject(new Error('No valid trades could be parsed from the file. Please check the data format and content.'));
      }

      if (errors.length > 0) {
        console.warn('CSV parsing warnings:', errors);
      }
      
      resolve(trades);
    };
    reader.onerror = () => reject(new Error('An error occurred while reading the file.'));
    reader.readAsText(file);
  });
}
