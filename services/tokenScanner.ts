// services/tokenScanner.ts
import type { DexScreenerApiResponse, TokenScannerResult } from '../types';
import { getBestPair } from '../utils/dexscreenerUtils';

const API_BASE = 'https://api.dexscreener.com/latest/dex';
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache for scanner

interface CacheEntry {
    data: TokenScannerResult;
    timestamp: number;
}

// ذاكرة التخزين المؤقت للنتائج لتجنب الطلبات المتكررة
// Cache for results to avoid repeated requests
const scannerCache = new Map<string, CacheEntry>();

/**
 * Fetches token data from Dexscreener using a token or pair address.
 * It first tries the /tokens endpoint. If that fails or returns no pairs, it tries the /pairs endpoint as a fallback.
 * يجلب بيانات العملة من Dexscreener باستخدام عنوان العملة أو زوج التداول، مع وجود آلية احتياطية
 * @param query The token or pair address string.
 * @returns A promise that resolves to the best pair info or null if not found.
 */
export async function fetchTokenAutoFill(query: string): Promise<TokenScannerResult | null> {
    const cleanedQuery = query.trim();
    if (!cleanedQuery) return null;

    // التحقق من الكاش أولاً
    // Check cache first
    const cached = scannerCache.get(cleanedQuery);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
    }

    try {
        // --- Strategy 1: Search by token address ---
        // ---  الاستراتيجية ١: البحث بعنوان العملة ---
        let response = await fetch(`${API_BASE}/tokens/${cleanedQuery}`);
        if (response.ok) {
            const data: DexScreenerApiResponse = await response.json();
            const bestPair = getBestPair(data.pairs || []);
            if (bestPair) {
                scannerCache.set(cleanedQuery, { data: bestPair, timestamp: Date.now() });
                return bestPair;
            }
        }
        
        // --- Strategy 2: Search by pair address (fallback) ---
        // --- الاستراتيجية ٢: البحث بعنوان زوج التداول (احتياطي) ---
        response = await fetch(`${API_BASE}/pairs/${cleanedQuery}`);
        if (response.ok) {
            const data: DexScreenerApiResponse = await response.json();
            const bestPair = getBestPair(data.pairs || []);
            if (bestPair) {
                scannerCache.set(cleanedQuery, { data: bestPair, timestamp: Date.now() });
                return bestPair;
            }
        }
        
        // If both specific searches fail, return null.
        return null;

    } catch (error) {
        console.error('Failed to fetch token data from Dexscreener:', error);
        return null;
    }
}
