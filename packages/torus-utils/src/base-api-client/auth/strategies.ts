/**
 * Base authentication strategy interface for API clients
 */
export interface AuthStrategy {
  /**
   * Authenticate a request by modifying headers or other properties
   */
  authenticate(request: Request): Promise<void>;

  /**
   * Check if the authentication is valid
   */
  isValid(): Promise<boolean>;

  /**
   * Refresh authentication if supported
   */
  refresh?(): Promise<void>;
}

/**
 * Token provider interface for Bearer token authentication
 */
export interface TokenProvider {
  /**
   * Get the current authentication token
   */
  getToken(): Promise<string>;

  /**
   * Check if the token is still valid
   */
  isValid(): Promise<boolean>;

  /**
   * Refresh the token
   */
  refresh(): Promise<void>;
}
