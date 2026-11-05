export interface IBrokerAuthService {
  /**
   * Executes the automated authentication pipeline and persists the resulting
   * broker access token to cache/storage.
   */
  generateAndStoreAccessToken(): Promise<string>;

  /**
   * Retrieves the active access token from cache, or mints a new one if missing or forced.
   */
  getOrRefreshToken(force?: boolean): Promise<string>;
}
