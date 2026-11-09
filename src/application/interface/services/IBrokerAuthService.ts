export interface IBrokerAuthService {
  generateAndStoreAccessToken(): Promise<string>;
  getOrRefreshToken(force?: boolean): Promise<string>;
}
