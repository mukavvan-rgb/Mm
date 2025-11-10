export enum TradeStatus {
  OPEN = 'open',
  CLOSED_PROFIT = 'closed-profit',
  CLOSED_LOSS = 'closed-loss',
}

export interface Trade {
  id: number;
  coinSlugOrAddress: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  quantity: number;
  notes: string;
  date: string; // ISO 8601 format
  status: TradeStatus;
  // This data is fetched from the API and is not stored in the DB
  livePrice?: number;
  pnl?: number;
  pnlPercent?: number;
  pairInfo?: DexScreenerPairInfo;
}

export interface DexScreenerPair {
    schemaVersion: string;
    pair: {
        chainId: string;
        dexId: string;
        url: string;
        pairAddress: string;
        baseToken: {
            address: string;
            name: string;
            symbol: string;
        };
        quoteToken: {
            symbol: string;
        };
        priceNative: string;
        priceUsd?: string;
        txns: {
            m5: { buys: number; sells: number };
            h1: { buys: number; sells: number };
            h6: { buys: number; sells: number };
            h24: { buys: number; sells: number };
        };
        volume: {
            m5: number;
            h1: number;
            h6: number;
            h24: number;
        };
        priceChange: {
            m5: number;
            h1: number;
            h6: number;
            h24: number;
        };
        liquidity?: {
            usd?: number;
            base: number;
            quote: number;
        };
        fdv?: number;
        pairCreatedAt: number;
    };
}

export interface DexScreenerPairInfo {
    priceUsd: number;
    volume24h: number;
    liquidityUsd?: number;
    priceChange24h: number;
    url: string;
    dexId: string;
    chainId: string;
    baseTokenSymbol: string;
    quoteTokenSymbol: string;
    pairAddress: string;
    baseTokenName: string;
    baseTokenAddress: string;
}

export interface DexScreenerApiResponse {
    schemaVersion: string;
    pairs: DexScreenerPair['pair'][];
}

export interface TokenScannerResult extends DexScreenerPairInfo {}
