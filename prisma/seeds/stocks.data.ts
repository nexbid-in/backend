export interface InitialStockItem {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  type: "EQUITY" | "INDEX";
  isTradable: boolean;
  isActive: boolean;
}

export const initialStocks: InitialStockItem[] = [
  // ==========================================
  // 1. BENCHMARK & SECTORAL INDICES (Non-Tradable)
  // ==========================================
  { symbol: "NIFTY 50", name: "Nifty 50 Benchmark Index", exchange: "NSE", sector: "Broad Market Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "BANKNIFTY", name: "Nifty Bank Index", exchange: "NSE", sector: "Banking Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "NIFTY IT", name: "Nifty IT Index", exchange: "NSE", sector: "IT Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "NIFTY AUTO", name: "Nifty Auto Index", exchange: "NSE", sector: "Automobile Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "NIFTY PHARMA", name: "Nifty Pharma Index", exchange: "NSE", sector: "Pharma Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "NIFTY METAL", name: "Nifty Metal Index", exchange: "NSE", sector: "Metals Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "NIFTY FMCG", name: "Nifty FMCG Index", exchange: "NSE", sector: "FMCG Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "NIFTY MIDCAP 50", name: "Nifty Midcap 50 Index", exchange: "NSE", sector: "Midcap Index", type: "INDEX", isTradable: false, isActive: true },
  { symbol: "SENSEX", name: "BSE SENSEX Benchmark Index", exchange: "BSE", sector: "Broad Market Index", type: "INDEX", isTradable: false, isActive: true },

  // ==========================================
  // 2. BANKING & FINANCIAL SERVICES
  // ==========================================
  { symbol: "HDFCBANK", name: "HDFC Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ICICIBANK", name: "ICICI Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "AXISBANK", name: "Axis Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BANKBARODA", name: "Bank of Baroda", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PNB", name: "Punjab National Bank", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "CANBK", name: "Canara Bank", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "FEDERALBNK", name: "The Federal Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BANDHANBNK", name: "Bandhan Bank Limited", exchange: "NSE", sector: "Banking", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Limited", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Limited", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment & Fin", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance Limited", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SHRIRAMFIN", name: "Shriram Finance Limited", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "JIOFIN", name: "Jio Financial Services Limited", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SBICARD", name: "SBI Cards and Payment Services", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance Company", exchange: "NSE", sector: "Insurance", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SBILIFE", name: "SBI Life Insurance Company", exchange: "NSE", sector: "Insurance", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ICICIPRULI", name: "ICICI Prudential Life Insurance", exchange: "NSE", sector: "Insurance", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PFC", name: "Power Finance Corporation", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "RECLTD", name: "REC Limited", exchange: "NSE", sector: "Financial Services", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 3. INFORMATION TECHNOLOGY
  // ==========================================
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "INFY", name: "Infosys Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HCLTECH", name: "HCL Technologies Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "WIPRO", name: "Wipro Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TECHM", name: "Tech Mahindra Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "LTIM", name: "LTIMindtree Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PERSISTENT", name: "Persistent Systems Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "COFORGE", name: "Coforge Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MPHASIS", name: "Mphasis Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "KPITTECH", name: "KPIT Technologies Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TATAELXSI", name: "Tata Elxsi Limited", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "LTTS", name: "L&T Technology Services Ltd", exchange: "NSE", sector: "Information Technology", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 4. OIL, GAS, POWER & ENERGY
  // ==========================================
  { symbol: "RELIANCE", name: "Reliance Industries Limited", exchange: "NSE", sector: "Oil & Gas", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation", exchange: "NSE", sector: "Oil & Gas", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "NTPC", name: "NTPC Limited", exchange: "NSE", sector: "Power", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India", exchange: "NSE", sector: "Power", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BPCL", name: "Bharat Petroleum Corporation", exchange: "NSE", sector: "Oil & Gas", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "IOC", name: "Indian Oil Corporation Limited", exchange: "NSE", sector: "Oil & Gas", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "GAIL", name: "GAIL (India) Limited", exchange: "NSE", sector: "Oil & Gas", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "COALINDIA", name: "Coal India Limited", exchange: "NSE", sector: "Mining & Energy", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TATAPOWER", name: "Tata Power Company Limited", exchange: "NSE", sector: "Power", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ADANIENT", name: "Adani Enterprises Limited", exchange: "NSE", sector: "Diversified Energy", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ADANIGREEN", name: "Adani Green Energy Limited", exchange: "NSE", sector: "Power", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ADANIPOWER", name: "Adani Power Limited", exchange: "NSE", sector: "Power", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "NHPC", name: "NHPC Limited", exchange: "NSE", sector: "Power", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "OIL", name: "Oil India Limited", exchange: "NSE", sector: "Oil & Gas", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PETRONET", name: "Petronet LNG Limited", exchange: "NSE", sector: "Oil & Gas", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "IEX", name: "Indian Energy Exchange Limited", exchange: "NSE", sector: "Financial Infrastructure", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 5. AUTOMOTIVE & AUTO COMPONENTS
  // ==========================================
  { symbol: "TATAMOTORS", name: "Tata Motors Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MARUTI", name: "Maruti Suzuki India Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "M&M", name: "Mahindra & Mahindra Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "EICHERMOT", name: "Eicher Motors Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TVSMOTOR", name: "TVS Motor Company Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ASHOKLEY", name: "Ashok Leyland Limited", exchange: "NSE", sector: "Automobile", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BHARATFORG", name: "Bharat Forge Limited", exchange: "NSE", sector: "Auto Ancillary", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MOTHERSON", name: "Samvardhana Motherson Int Ltd", exchange: "NSE", sector: "Auto Ancillary", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BALKRISIND", name: "Balkrishna Industries Limited", exchange: "NSE", sector: "Auto Ancillary", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MRF", name: "MRF Limited", exchange: "NSE", sector: "Auto Ancillary", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "APOLLOTYRE", name: "Apollo Tyres Limited", exchange: "NSE", sector: "Auto Ancillary", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 6. CONSUMER GOODS & FMCG
  // ==========================================
  { symbol: "ITC", name: "ITC Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "NESTLEIND", name: "Nestle India Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BRITANNIA", name: "Britannia Industries Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TATACONSUM", name: "Tata Consumer Products Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "DABUR", name: "Dabur India Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MARICO", name: "Marico Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "GODREJCP", name: "Godrej Consumer Products Ltd", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "COLPAL", name: "Colgate Palmolive (India) Ltd", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "VBL", name: "Varun Beverages Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "EMAMILTD", name: "Emami Limited", exchange: "NSE", sector: "FMCG", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "UBL", name: "United Breweries Limited", exchange: "NSE", sector: "Beverages", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "RADICO", name: "Radico Khaitan Limited", exchange: "NSE", sector: "Beverages", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 7. METALS & MINING
  // ==========================================
  { symbol: "TATASTEEL", name: "Tata Steel Limited", exchange: "NSE", sector: "Metals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "JSWSTEEL", name: "JSW Steel Limited", exchange: "NSE", sector: "Metals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HINDALCO", name: "Hindalco Industries Limited", exchange: "NSE", sector: "Metals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "VEDL", name: "Vedanta Limited", exchange: "NSE", sector: "Mining & Metals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "JINDALSTEL", name: "Jindal Steel & Power Limited", exchange: "NSE", sector: "Metals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "NMDC", name: "NMDC Limited", exchange: "NSE", sector: "Mining", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SAIL", name: "Steel Authority of India Ltd", exchange: "NSE", sector: "Metals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "NATIONALUM", name: "National Aluminium Company Ltd", exchange: "NSE", sector: "Metals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HINDZINC", name: "Hindustan Zinc Limited", exchange: "NSE", sector: "Metals", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 8. PHARMACEUTICALS & HEALTHCARE
  // ==========================================
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "CIPLA", name: "Cipla Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise Ltd", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "LUPIN", name: "Lupin Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals Ltd", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MANKIND", name: "Mankind Pharma Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ZYDUSLIFE", name: "Zydus Lifesciences Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MAXHEALTH", name: "Max Healthcare Institute Ltd", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BIOCON", name: "Biocon Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "GLENMARK", name: "Glenmark Pharmaceuticals Ltd", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ALKEM", name: "Alkem Laboratories Limited", exchange: "NSE", sector: "Healthcare", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 9. INFRASTRUCTURE, CAPITAL GOODS & CEMENT
  // ==========================================
  { symbol: "LT", name: "Larsen & Toubro Limited", exchange: "NSE", sector: "Infrastructure", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SIEMENS", name: "Siemens Limited", exchange: "NSE", sector: "Capital Goods", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ABB", name: "ABB India Limited", exchange: "NSE", sector: "Capital Goods", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BEL", name: "Bharat Electronics Limited", exchange: "NSE", sector: "Aerospace & Defense", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HAL", name: "Hindustan Aeronautics Limited", exchange: "NSE", sector: "Aerospace & Defense", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BHEL", name: "Bharat Heavy Electricals Ltd", exchange: "NSE", sector: "Capital Goods", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "CUMMINSIND", name: "Cummins India Limited", exchange: "NSE", sector: "Capital Goods", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "POLYCAB", name: "Polycab India Limited", exchange: "NSE", sector: "Electricals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "HAVELLS", name: "Havells India Limited", exchange: "NSE", sector: "Consumer Durables", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "VOLTAS", name: "Voltas Limited", exchange: "NSE", sector: "Consumer Durables", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "KEI", name: "KEI Industries Limited", exchange: "NSE", sector: "Electricals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Limited", exchange: "NSE", sector: "Cement", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "GRASIM", name: "Grasim Industries Limited", exchange: "NSE", sector: "Cement & Diversified", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "AMBUJACEM", name: "Ambuja Cements Limited", exchange: "NSE", sector: "Cement", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ACC", name: "ACC Limited", exchange: "NSE", sector: "Cement", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SHREECEM", name: "Shree Cement Limited", exchange: "NSE", sector: "Cement", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "DALBHARAT", name: "Dalmia Bharat Limited", exchange: "NSE", sector: "Cement", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 10. CHEMICALS, PAINTS & FERTILIZERS
  // ==========================================
  { symbol: "ASIANPAINT", name: "Asian Paints Limited", exchange: "NSE", sector: "Paints", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "BERGEPAINT", name: "Berger Paints India Limited", exchange: "NSE", sector: "Paints", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PIDILITIND", name: "Pidilite Industries Limited", exchange: "NSE", sector: "Chemicals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SRF", name: "SRF Limited", exchange: "NSE", sector: "Chemicals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "AARTIIND", name: "Aarti Industries Limited", exchange: "NSE", sector: "Chemicals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "DEEPAKNTR", name: "Deepak Nitrite Limited", exchange: "NSE", sector: "Chemicals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TATACHEM", name: "Tata Chemicals Limited", exchange: "NSE", sector: "Chemicals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "UPL", name: "UPL Limited", exchange: "NSE", sector: "Agro Chemicals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PIIND", name: "PI Industries Limited", exchange: "NSE", sector: "Agro Chemicals", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "COROMANDEL", name: "Coromandel International Ltd", exchange: "NSE", sector: "Fertilizers", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 11. TELECOM, MEDIA & ENTERTAINMENT
  // ==========================================
  { symbol: "BHARTIARTL", name: "Bharti Airtel Limited", exchange: "NSE", sector: "Telecommunication", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "IDEA", name: "Vodafone Idea Limited", exchange: "NSE", sector: "Telecommunication", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TATACOMM", name: "Tata Communications Limited", exchange: "NSE", sector: "Telecommunication", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "SUNTV", name: "Sun TV Network Limited", exchange: "NSE", sector: "Media & Entertainment", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ZEEL", name: "Zee Entertainment Enterprises", exchange: "NSE", sector: "Media & Entertainment", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PVRINOX", name: "PVR INOX Limited", exchange: "NSE", sector: "Media & Entertainment", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 12. NEW-AGE TECH & PLATFORMS
  // ==========================================
  { symbol: "ZOMATO", name: "Zomato Limited", exchange: "NSE", sector: "Consumer Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PAYTM", name: "One97 Communications Limited", exchange: "NSE", sector: "Fintech", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "NYKAA", name: "FSN E-Commerce Ventures Ltd", exchange: "NSE", sector: "E-Commerce", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "POLICYBZR", name: "PB Fintech Limited", exchange: "NSE", sector: "Fintech", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "DELHIVERY", name: "Delhivery Limited", exchange: "NSE", sector: "Logistics", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "MAPMYINDIA", name: "C.E. Info Systems Limited", exchange: "NSE", sector: "Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "NAUKRI", name: "Info Edge (India) Limited", exchange: "NSE", sector: "Consumer Technology", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "CARTRADE", name: "CarTrade Tech Limited", exchange: "NSE", sector: "Consumer Technology", type: "EQUITY", isTradable: true, isActive: true },

  // ==========================================
  // 13. RETAIL, FASHION, AVIATION & HOSPITALITY
  // ==========================================
  { symbol: "DMART", name: "Avenue Supermarts Limited", exchange: "NSE", sector: "Retail", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TRENT", name: "Trent Limited", exchange: "NSE", sector: "Retail", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "TITAN", name: "Titan Company Limited", exchange: "NSE", sector: "Consumer Durables", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "PAGEIND", name: "Page Industries Limited", exchange: "NSE", sector: "Textiles & Apparel", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "RAYMOND", name: "Raymond Limited", exchange: "NSE", sector: "Textiles & Apparel", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "INDIGO", name: "InterGlobe Aviation Limited", exchange: "NSE", sector: "Aviation", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "INDHOTEL", name: "The Indian Hotels Company Ltd", exchange: "NSE", sector: "Hotels & Hospitality", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "IRCTC", name: "Indian Railway Catering & Tourism", exchange: "NSE", sector: "Hospitality & Travel", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "CONCOR", name: "Container Corporation of India", exchange: "NSE", sector: "Logistics", type: "EQUITY", isTradable: true, isActive: true },
  { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone", exchange: "NSE", sector: "Infrastructure & Logistics", type: "EQUITY", isTradable: true, isActive: true },
];
