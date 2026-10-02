import { IAuthTokenServiceInput } from "../application/interface/services/ITokenService";

declare module "express-serve-static-core" {
  export interface Request {
    user?: IAuthTokenServiceInput;
  }
}
