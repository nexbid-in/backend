import { StockRepository } from "../../infrastructure/repositories/stock/StockRepository";
import { WatchlistRepository } from "../../infrastructure/repositories/watchlist/WatchlistRepository";
import { SearchStocksUseCase } from "../../application/use-cases/watchlist/SearchStockUseCase";
import { GetUserWatchlistUseCase } from "../../application/use-cases/watchlist/GetUserWatchlistUseCase";
import { AddToWatchlistUseCase } from "../../application/use-cases/watchlist/AddToWatchlistUseCase";
import { RemoveFromWatchlistUseCase } from "../../application/use-cases/watchlist/RemoveFromWatchlistUseCase";
import { StockController } from "../../presentation/http/controllers/stock/StockController";
import { WatchlistController } from "../../presentation/http/controllers/watchlist/WatchlistController";

// 1. Repositories
const stockRepository = new StockRepository();
const watchlistRepository = new WatchlistRepository();

// 2. Use Cases
const searchStocksUseCase = new SearchStocksUseCase(stockRepository);
const getUserWatchlistUseCase = new GetUserWatchlistUseCase(watchlistRepository);
const addToWatchlistUseCase = new AddToWatchlistUseCase(watchlistRepository, stockRepository);
const removeFromWatchlistUseCase = new RemoveFromWatchlistUseCase(watchlistRepository);

// 3. Controllers
export const stockController = new StockController(searchStocksUseCase);
export const watchlistController = new WatchlistController(
  getUserWatchlistUseCase,
  addToWatchlistUseCase,
  removeFromWatchlistUseCase
);
