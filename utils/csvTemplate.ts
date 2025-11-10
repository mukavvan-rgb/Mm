// utils/csvTemplate.ts

/**
 * A single source of truth for CSV column headers.
 * This is used for both exporting data and validating imported files,
 * ensuring a consistent data interchange format.
 */
export const CSV_TEMPLATE_HEADERS = [
    'date',
    'coinSlugOrAddress',
    'entryPrice',
    'quantity',
    'targetPrice',
    'stopLoss',
    'status',
    'notes'
];
