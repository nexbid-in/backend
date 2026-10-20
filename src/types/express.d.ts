import { AuthTokenServiceDTO } from "../application/dto/internal/AuthTokenServiceDTO";

declare module "express-serve-static-core" {
  export interface Request {
    user?: AuthTokenServiceDTO;
  }
}
