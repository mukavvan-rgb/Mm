
import * as XLSX from 'xlsx';
import type { Trade } from '../types';
import { CSV_TEMPLATE_HEADERS } from './csvTemplate';

function triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

/**
 * Escapes a value for CSV format, handling quotes, commas, and newlines.
 * @param value The value to escape.
 * @returns The escaped string.
 */
function escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    // If the string contains a comma, a double quote, or a newline, wrap it in double quotes.
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Within a quoted string, any double quote must be escaped by another double quote.
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Generates the CSV content string from a list of trades or template data.
 * @param data - The array of data to be formatted.
 * @returns The CSV content as a string.
 */
function generateCsvContent(data: Record<string, any>[]): string {
    const rows = data.map(item =>
        CSV_TEMPLATE_HEADERS.map(header => escapeCsvValue(item[header]))
    );

    const csvContent = [CSV_TEMPLATE_HEADERS.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csvContent;
}

export function exportToCsv(trades: Trade[], filename: string) {
    const dataToExport = trades.map(t => ({
        date: new Date(t.date).toISOString(),
        coinSlugOrAddress: t.coinSlugOrAddress,
        entryPrice: t.entryPrice,
        quantity: t.quantity,
        targetPrice: t.targetPrice,
        stopLoss: t.stopLoss,
        status: t.status,
        notes: t.notes
    }));

    const csvContent = generateCsvContent(dataToExport);
    // Add UTF-8 BOM for Excel compatibility
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
}

export function downloadCsvTemplate() {
    const exampleTrade = [{
        date: new Date().toISOString(),
        coinSlugOrAddress: '0xDeAdBeef...',
        entryPrice: 100,
        quantity: 1.5,
        targetPrice: 120,
        stopLoss: 90,
        status: 'open',
        notes: 'Example trade, you can add notes with commas here'
    }];
    const csvContent = generateCsvContent(exampleTrade);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, 'whalestracker_template.csv');
}

export function exportToXlsx(trades: Trade[], filename: string) {
    // Data for XLSX mirrors the CSV for data interchange consistency
    const data = trades.map(t => ({
        date: new Date(t.date).toISOString(),
        coinSlugOrAddress: t.coinSlugOrAddress,
        entryPrice: t.entryPrice,
        quantity: t.quantity,
        targetPrice: t.targetPrice,
        stopLoss: t.stopLoss,
        status: t.status,
        notes: t.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: CSV_TEMPLATE_HEADERS });

    worksheet['!cols'] = [
        { wch: 28 }, // date
        { wch: 42 }, // coinSlugOrAddress
        { wch: 12 }, // entryPrice
        { wch: 12 }, // quantity
        { wch: 12 }, // targetPrice
        { wch: 12 }, // stopLoss
        { wch: 15 }, // status
        { wch: 40 }, // notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades');
    
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    triggerDownload(blob, filename);
}