import { InstrumentType } from "../../../domain/entities/Stock";

export type StockPersistenceDTO = {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  type: InstrumentType;
  isActive: boolean;
  isTradable: boolean;
  createdAt: Date;
  updatedAt: Date;
};
