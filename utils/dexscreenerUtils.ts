import type { DexScreenerApiResponse, DexScreenerPairInfo } from '../types';

/**
 * Selects the best trading pair from a list of pairs returned by the Dexscreener API.
 * The "best" pair is determined by prioritizing pairs with USD liquidity and then by the highest 24-hour trading volume.
 * @param pairs An array of pair objects from the Dexscreener API response.
 * @returns The formatted best pair info, or null if no suitable pair is found.
 */
export const getBestPair = (pairs: DexScreenerApiResponse['pairs']): DexScreenerPairInfo | null => {
    if (!pairs || pairs.length === 0) return null;

    // Prioritize pairs with USD liquidity and highest volume
    const sortedPairs = [...pairs].sort((a, b) => {
        const aLiquidity = a.liquidity?.usd ?? 0;
        const bLiquidity = b.liquidity?.usd ?? 0;
        const aVolume = a.volume.h24;
        const bVolume = b.volume.h24;

        if (aLiquidity > 0 && bLiquidity === 0) return -1;
        if (bLiquidity > 0 && aLiquidity === 0) return 1;

        return bVolume - aVolume;
    });

    const best = sortedPairs[0];
    if (!best.priceUsd) return null;

    return {
        priceUsd: parseFloat(best.priceUsd),
        volume24h: best.volume.h24,
        liquidityUsd: best.liquidity?.usd,
        priceChange24h: best.priceChange.h24,
        url: best.url,
        dexId: best.dexId,
        chainId: best.chainId,
        baseTokenSymbol: best.baseToken.symbol,
        quoteTokenSymbol: best.quoteToken.symbol,
        pairAddress: best.pairAddress,
        baseTokenName: best.baseToken.name,
        baseTokenAddress: best.baseToken.address,
    };
};
