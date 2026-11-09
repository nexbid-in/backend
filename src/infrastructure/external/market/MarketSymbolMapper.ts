const INDEX_MAP: Record<string, string> = {
  "NIFTY 50": "NSE:NIFTY50-INDEX",
  "NIFTY50": "NSE:NIFTY50-INDEX",
  "NIFTY": "NSE:NIFTY50-INDEX",
  "BANKNIFTY": "NSE:NIFTYBANK-INDEX",
  "NIFTY BANK": "NSE:NIFTYBANK-INDEX",
  "NIFTY IT": "NSE:NIFTYIT-INDEX",
  "NIFTYIT": "NSE:NIFTYIT-INDEX",
  "NIFTY AUTO": "NSE:NIFTYAUTO-INDEX",
  "NIFTYAUTO": "NSE:NIFTYAUTO-INDEX",
  "NIFTY PHARMA": "NSE:NIFTYPHARMA-INDEX",
  "NIFTYPHARMA": "NSE:NIFTYPHARMA-INDEX",
  "NIFTY METAL": "NSE:NIFTYMETAL-INDEX",
  "NIFTYMETAL": "NSE:NIFTYMETAL-INDEX",
  "NIFTY FMCG": "NSE:NIFTYFMCG-INDEX",
  "NIFTYFMCG": "NSE:NIFTYFMCG-INDEX",
  "NIFTY MIDCAP 50": "NSE:NIFTYMIDCAP50-INDEX",
  "NIFTYMIDCAP50": "NSE:NIFTYMIDCAP50-INDEX",
  "SENSEX": "BSE:SENSEX-INDEX",
};

const REVERSE_INDEX_MAP: Record<string, string> = {
  "NSE:NIFTY50-INDEX": "NIFTY 50",
  "NSE:NIFTYBANK-INDEX": "BANKNIFTY",
  "NSE:NIFTYIT-INDEX": "NIFTY IT",
  "NSE:NIFTYAUTO-INDEX": "NIFTY AUTO",
  "NSE:NIFTYPHARMA-INDEX": "NIFTY PHARMA",
  "NSE:NIFTYMETAL-INDEX": "NIFTY METAL",
  "NSE:NIFTYFMCG-INDEX": "NIFTY FMCG",
  "NSE:NIFTYMIDCAP50-INDEX": "NIFTY MIDCAP 50",
  "BSE:SENSEX-INDEX": "SENSEX",
};

const EQUITY_ALIAS_MAP: Record<string, string> = {
  TATAMOTORS: "NSE:TMCV-EQ",
  TMCV: "NSE:TMCV-EQ",
  TMPV: "NSE:TMPV-EQ",
  TATAMTRDVR: "NSE:TMPV-EQ",
  TATAMOTORSPASSENGER: "NSE:TMPV-EQ",
  ZOMATO: "NSE:ETERNAL-EQ",
  ETERNAL: "NSE:ETERNAL-EQ",
  ICICIPRULI: "NSE:ICICILIFE-EQ",
  ICICILIFE: "NSE:ICICILIFE-EQ",
  LTIM: "NSE:LTM-EQ",
  LTM: "NSE:LTM-EQ",
};

const REVERSE_EQUITY_ALIAS_MAP: Record<string, string> = {
  "NSE:TMCV-EQ": "TATAMOTORS",
  "NSE:TMPV-EQ": "TMPV",
  "NSE:ETERNAL-EQ": "ZOMATO",
  "NSE:ICICILIFE-EQ": "ICICIPRULI",
  "NSE:LTM-EQ": "LTIM",
};

export class MarketSymbolMapper {
  static toFyersSymbol(symbol: string): string {
    const raw = symbol.toUpperCase().trim();

    if (INDEX_MAP[raw]) {
      return INDEX_MAP[raw];
    }

    const spaceless = raw.replace(/\s+/g, "");
    if (INDEX_MAP[spaceless]) {
      return INDEX_MAP[spaceless];
    }

    if (EQUITY_ALIAS_MAP[spaceless]) {
      return EQUITY_ALIAS_MAP[spaceless];
    }

    if (raw.startsWith("NSE:") || raw.startsWith("BSE:")) {
      const cleanBase = raw.replace(/^(NSE|BSE):/, "").replace(/-EQ$/, "").replace(/-INDEX$/, "");
      if (INDEX_MAP[cleanBase]) {
        return INDEX_MAP[cleanBase];
      }
      if (EQUITY_ALIAS_MAP[cleanBase]) {
        return EQUITY_ALIAS_MAP[cleanBase];
      }
      return raw;
    }

    return `NSE:${spaceless}-EQ`;
  }

  static fromFyersSymbol(fyersSymbol: string): string {
    if (REVERSE_INDEX_MAP[fyersSymbol]) {
      return REVERSE_INDEX_MAP[fyersSymbol];
    }

    if (REVERSE_EQUITY_ALIAS_MAP[fyersSymbol]) {
      return REVERSE_EQUITY_ALIAS_MAP[fyersSymbol];
    }

    return fyersSymbol
      .replace(/^(NSE|BSE):/, "")
      .replace(/-EQ$/, "")
      .replace(/-INDEX$/, "");
  }
}