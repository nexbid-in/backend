import { Position, ProductType } from "../../entities/trading/Position";

export interface IPositionRepository {
  findById(id: string): Promise<Position | null>;
  findByUserAndSymbol(userId: string, symbol: string, productType: ProductType): Promise<Position | null>;
  findOpenPositionsByUserId(userId: string): Promise<Position[]>;
  findAllPositionsByUserId(userId: string): Promise<Position[]>;
  findAllOpenMisPositions(): Promise<Position[]>;
  save(position: Position): Promise<Position>;
  update(position: Position): Promise<Position>;
}

