import type { DexScreenerApiResponse, DexScreenerPairInfo } from '../types';
import { getBestPair } from '../utils/dexscreenerUtils';

const API_BASE = 'https://api.dexscreener.com/latest/dex';
const CACHE_TTL_MS = 15 * 1000; // 15 seconds cache

interface CacheEntry {
    data: DexScreenerPairInfo;
    timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();

const cleanPairAddress = (address: string) => address.trim();

export const dexscreenerService = {
    async fetchPairsData(pairAddresses: string[]): Promise<Map<string, DexScreenerPairInfo | null>> {
        const uniqueAddresses = [...new Set(pairAddresses.map(cleanPairAddress))];
        const result = new Map<string, DexScreenerPairInfo | null>();
        const addressesToFetch: string[] = [];

        // Check cache first
        for (const address of uniqueAddresses) {
            const cached = apiCache.get(address);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
                result.set(address, cached.data);
            } else {
                addressesToFetch.push(address);
            }
        }
        
        if (addressesToFetch.length === 0) {
            return result;
        }

        // Dexscreener API allows up to 30 pairs per request
        const CHUNK_SIZE = 30;
        for (let i = 0; i < addressesToFetch.length; i += CHUNK_SIZE) {
            const chunk = addressesToFetch.slice(i, i + CHUNK_SIZE);
            try {
                // FIX: Use the /tokens endpoint since we store and query by token addresses.
                const response = await fetch(`${API_BASE}/tokens/${chunk.join(',')}`);
                if (!response.ok) {
                    // FIX: Add status code to error for better debugging.
                    throw new Error(`Dexscreener API error: ${response.status} ${response.statusText}`);
                }
                const data: DexScreenerApiResponse = await response.json();

                // Group pairs by the original queried address for accurate mapping.
                const pairsByAddress = new Map<string, DexScreenerApiResponse['pairs']>();
                const chunkAddrMap = new Map<string, string>();
                chunk.forEach(addr => chunkAddrMap.set(addr.toLowerCase(), addr));

                if (data.pairs) {
                    data.pairs.forEach(pair => {
                        const baseTokenAddrLower = pair.baseToken.address.toLowerCase();
                        if (chunkAddrMap.has(baseTokenAddrLower)) {
                            const originalAddr = chunkAddrMap.get(baseTokenAddrLower)!;
                            if (!pairsByAddress.has(originalAddr)) {
                                pairsByAddress.set(originalAddr, []);
                            }
                            pairsByAddress.get(originalAddr)!.push(pair);
                        }
                    });
                }

                chunk.forEach(address => {
                    const pairsForAddress = pairsByAddress.get(address);
                    const bestPair = getBestPair(pairsForAddress || []);

                    if (bestPair) {
                        result.set(address, bestPair);
                        apiCache.set(address, { data: bestPair, timestamp: Date.now() });
                    } else {
                        result.set(address, null);
                    }
                });

            } catch (error) {
                console.error('Failed to fetch from Dexscreener:', error);
                chunk.forEach(address => result.set(address, null));
            }
        }
        
        return result;
    }
};
