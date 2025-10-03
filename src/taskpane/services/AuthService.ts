import axios from "axios";
import { logger } from "./Logger";

interface AuthResponse {
  success: boolean;
  sessionToken?: string;
  message?: string;
}

interface AuthResult {
  sessionToken?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    mobile: string;
    country_code: string;
    address: string;
  };
}

interface StoredAuth {
  phone: string;
  sessionToken: string;
  expiresAt: number;
  user?: {
    id: number;
    name: string;
    email: string;
    mobile: string;
    country_code: string;
    address: string;
  };
}

export class AuthService {
  private static readonly STORAGE_KEY = "docuid_auth";
  // Use proxy in development, direct API in production
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'development'
    ? '' // Use relative URLs for webpack proxy
    : "https://api.docuid.net";

  /**
   * Authenticate user with phone number via biometric verification
   */
  static async login(phoneNumber: string): Promise<void> {
    const authLogger = logger.createContextLogger('AuthService.login');

    try {
      authLogger.info('Starting biometric authentication', {
        phoneNumber: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
        originalFormat: phoneNumber,
        hasPlus: phoneNumber.startsWith('+')
      });

      // Initiate biometric authentication request
      authLogger.debug('Requesting biometric authentication');
      await this.requestBiometricAuth(phoneNumber);

      // Poll for authentication result
      authLogger.debug('Starting polling for authentication result');
      const authResult = await this.pollAuthResult(phoneNumber);
      authLogger.debug('Polling completed', { hasResult: !!authResult });

      // Store authentication data
      const authData: StoredAuth = {
        phone: phoneNumber,
        sessionToken: authResult.sessionToken || this.generateSessionToken(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        user: authResult.user,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));

      authLogger.logAuthEvent('LOGIN_SUCCESS', authResult.user?.id, {
        phone: phoneNumber.substring(0, 3) + '***',
        userName: authResult.user?.name
      });

    } catch (error) {
      authLogger.error('Authentication failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Request biometric authentication from DocuID API
   */
  private static async requestBiometricAuth(phoneNumber: string): Promise<void> {
    const apiLogger = logger.createContextLogger('AuthService.API');

    try {
      const startTime = Date.now();

      apiLogger.logApiRequest('POST', '/api/docuid/biometric/auth-request', {
        mobile: phoneNumber.substring(0, 3) + '***',
        requestFrom: "DocuID"
      });

      const response = await axios.post(`${this.API_BASE_URL}/api/docuid/biometric/auth-request`, {
        mobile: phoneNumber,
        requestFrom: "DocuID"
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': "PKIqfASvBfaKQxsg6DVn92ANw7bLsWXSalEsg5Bz"
        }
      });

      const responseTime = Date.now() - startTime;
      apiLogger.logApiResponse('POST', '/api/docuid/biometric/auth-request', response.status, responseTime);

      if (!response.data.success) {
        apiLogger.warn('Biometric auth request returned unsuccessful response', response.data);
        throw new Error("Failed to initiate biometric authentication");
      }

      apiLogger.info('Biometric authentication request sent successfully');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseTime = Date.now() - (error.config?.metadata?.startTime || Date.now());
        apiLogger.logApiResponse('POST', '/api/docuid/biometric/auth-request', error.response?.status || 0, responseTime);

        if (error.response?.status === 404) {
          apiLogger.warn('Phone number not registered with iVALT', { status: 404 });
          throw new Error("Phone number not found. Please register with iVALT first.");
        }
        apiLogger.error('Biometric auth request failed', undefined, {
          status: error.response?.status,
          data: error.response?.data
        });
        throw new Error(error.response?.data?.error?.detail || "Failed to initiate authentication");
      }
      apiLogger.error('Biometric auth request error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Poll for biometric authentication result
   */
  private static async pollAuthResult(phoneNumber: string): Promise<AuthResult> {
    const pollLogger = logger.createContextLogger('AuthService.Poll');
    const maxAttempts = 60; // 60 attempts = ~2 minutes (with 2s intervals)
    const pollInterval = 2000; // 2 seconds

    console.log('🚀 POLLING: Starting authentication polling');
    pollLogger.info(`Starting authentication polling for ${maxAttempts} attempts (${maxAttempts * pollInterval / 1000}s timeout)`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      pollLogger.debug(`Polling attempt ${attempt + 1}/${maxAttempts}`);
      try {
        const startTime = Date.now();

        pollLogger.logApiRequest('POST', '/api/docuid/biometric/auth-result', {
          mobile: phoneNumber.substring(0, 3) + '***',
          attempt: attempt + 1
        });

        const response = await axios.post(`${this.API_BASE_URL}/api/docuid/biometric/auth-result`, {
          mobile: phoneNumber
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': "PKIqfASvBfaKQxsg6DVn92ANw7bLsWXSalEsg5Bz"
          }
        });

        const responseTime = Date.now() - startTime;
        pollLogger.logApiResponse('POST', '/api/docuid/biometric/auth-result', response.status, responseTime);
        pollLogger.debug(`API Response details: ${response.status}`, {
          statusText: response.statusText,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        });

        // Success - user authenticated
        if (response.status === 200 && response.data.data?.details) {
          pollLogger.info(`Authentication successful after ${attempt + 1} attempts`, {
            userId: response.data.data.details.id,
            userName: response.data.data.details.name
          });
          return {
            sessionToken: this.generateSessionToken(),
            user: response.data.data.details
          };
        }

      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const errorDetail = error.response?.data?.error?.detail;
          const responseTime = Date.now() - (error.config?.metadata?.startTime || Date.now());

          pollLogger.logApiResponse('POST', '/api/docuid/biometric/auth-result', status || 0, responseTime);
          pollLogger.debug(`API Error details: ${status}`, {
            errorDetail,
            fullResponse: error.response?.data,
            statusText: error.response?.statusText
          });

          if (status === 401 && errorDetail?.includes("Denied")) {
            pollLogger.warn(`Authentication denied by user after ${attempt + 1} attempts`);
            throw new Error("Biometric authentication was denied. Please try again.");
          }

          if (status === 404) {
            pollLogger.warn('User not found during polling', { status: 404 });
            throw new Error("User not found. Please check your phone number.");
          }

          if (status === 422 && errorDetail?.includes("pending")) {
            // Authentication still pending, continue polling
            pollLogger.debug(`Authentication pending, attempt ${attempt + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          }

          // Handle other status codes - might indicate pending state
          if (status === 422 && !errorDetail?.includes("pending")) {
            // If it's 422 but not explicitly pending, treat as error
            pollLogger.error(`Polling failed with unexpected 422 error`, undefined, {
              status,
              errorDetail,
              attempt: attempt + 1
            });
            throw new Error(errorDetail || "Authentication failed");
          }

          // For other unexpected errors, log but continue polling
          pollLogger.warn(`Unexpected response during polling, continuing...`, {
            status,
            errorDetail,
            attempt: attempt + 1
          });
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        pollLogger.error(`Polling error on attempt ${attempt + 1}`, error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    }

    pollLogger.error(`Authentication polling timed out after ${maxAttempts} attempts`);
    throw new Error("Authentication timed out. Please try again.");
  }

  /**
   * Get stored user information
   */
  static getStoredUser(): StoredAuth['user'] | null {
    const auth = this.getStoredAuth();
    return auth?.user || null;
  }

  /**
   * Get stored authentication data
   */
  static getStoredAuth(): StoredAuth | null {
    const storageLogger = logger.createContextLogger('AuthService.Storage');

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        storageLogger.debug('No stored authentication data found');
        return null;
      }

      const authData: StoredAuth = JSON.parse(stored);

      // Check if token is expired
      if (Date.now() > authData.expiresAt) {
        storageLogger.info('Stored authentication token expired, logging out');
        this.logout();
        return null;
      }

      storageLogger.debug('Retrieved stored authentication data', {
        hasUser: !!authData.user,
        expiresIn: Math.round((authData.expiresAt - Date.now()) / 1000 / 60) + ' minutes'
      });

      return authData;
    } catch (error) {
      storageLogger.error('Failed to retrieve stored authentication data', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const isAuth = this.getStoredAuth() !== null;
    logger.createContextLogger('AuthService').debug('Authentication check', { isAuthenticated: isAuth });
    return isAuth;
  }

  /**
   * Logout and clear stored authentication
   */
  static logout(): void {
    const logoutLogger = logger.createContextLogger('AuthService.Logout');
    const storedAuth = this.getStoredAuth();

    if (storedAuth) {
      logoutLogger.logAuthEvent('LOGOUT', storedAuth.user?.id);
    }

    localStorage.removeItem(this.STORAGE_KEY);
    logoutLogger.info('User logged out successfully');
  }

  /**
   * Generate a mock session token for development
   */
  private static generateSessionToken(): string {
    return "mock_token_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get current session token
   */
  static getSessionToken(): string | null {
    const auth = this.getStoredAuth();
    return auth?.sessionToken || null;
  }

  /**
   * Refresh authentication token (for future implementation)
   */
  static async refreshToken(): Promise<void> {
    // Implementation for token refresh
    // This would call the API to refresh the session token
    throw new Error("Token refresh not implemented yet");
  }
}
