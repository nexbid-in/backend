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
  // Corporate demergers, restructuring & official NSE ticker renames
  // Tata Motors Limited -> TMCV (priced ~404.20 on Fyers)
  TATAMOTORS: "NSE:TMCV-EQ",
  TMCV: "NSE:TMCV-EQ",

  // Tata Motors Passenger Vehicles Ltd -> TMPV (priced ~276.70 on Fyers)
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

    // 1. Direct index map lookup (e.g. "NIFTY 50" -> "NSE:NIFTY50-INDEX")
    if (INDEX_MAP[raw]) {
      return INDEX_MAP[raw];
    }

    // 2. Normalized spaces index lookup (e.g. "NIFTY  50" -> "NSE:NIFTY50-INDEX")
    const spaceless = raw.replace(/\s+/g, "");
    if (INDEX_MAP[spaceless]) {
      return INDEX_MAP[spaceless];
    }

    // 3. Equity alias lookup (e.g. "TATAMOTORS" -> "NSE:TMPV-EQ")
    if (EQUITY_ALIAS_MAP[spaceless]) {
      return EQUITY_ALIAS_MAP[spaceless];
    }

    // 4. Strip exchange prefix and check alias if already prefixed
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

    // 5. Default equity format
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