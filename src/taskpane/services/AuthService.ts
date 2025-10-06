import axios from "axios";
import { Logger } from "./Logger";

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
    latitude?: number;
    longitude?: number;
    imei?: string;
  };
  message?: string;
  timestamp?: string;
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
    latitude?: number;
    longitude?: number;
    imei?: string;
  };
  message?: string;
  timestamp?: string;
}

export class AuthService {
  private static readonly STORAGE_KEY = "docuid_auth";
  private static readonly logger = Logger.getInstance().createContextLogger('AuthService');
  // Use proxy in development, direct API in production
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'development'
    ? '' // Use relative URLs for webpack proxy
    : "https://api.docuid.net";

  /**
   * Authenticate user with phone number via biometric verification
   */
  static async login(phoneNumber: string): Promise<void> {
    try {
      this.logger.info('Starting biometric authentication', {
        phoneNumber: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
        originalFormat: phoneNumber,
        hasPlus: phoneNumber.startsWith('+')
      });

      // Initiate biometric authentication request
      this.logger.debug('Requesting biometric authentication');
      await this.requestBiometricAuth(phoneNumber);

      // Poll for authentication result
      this.logger.debug('Starting polling for authentication result');
      const authResult = await this.pollAuthResult(phoneNumber);
      this.logger.debug('Polling completed', { hasResult: !!authResult });

      // Store authentication data
      const authData: StoredAuth = {
        phone: phoneNumber,
        sessionToken: authResult.sessionToken || this.generateSessionToken(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        user: authResult.user,
        message: authResult.message,
        timestamp: authResult.timestamp,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));

      this.logger.logAuthEvent('LOGIN_SUCCESS', authResult.user?.id?.toString(), {
        phone: phoneNumber.substring(0, 3) + '***',
        userName: authResult.user?.name
      });

    } catch (error) {
      this.logger.error('Authentication failed', error as Error);
      throw error;
    }
  }

  /**
   * Request biometric authentication from DocuID API
   */
  private static async requestBiometricAuth(phoneNumber: string): Promise<void> {
    try {
      const startTime = Date.now();

      this.logger.logApiRequest('POST', '/api/docuid/biometric/auth-request', {
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
      this.logger.logApiResponse('POST', '/api/docuid/biometric/auth-request', response.status, responseTime);

      this.logger.debug('Auth request response status', { status: response.data.data.status });

      if (!response.data.data.status) {
        this.logger.warn('Biometric auth request returned unsuccessful response', response.data);
        throw new Error("Failed to initiate biometric authentication");
      }

      this.logger.info('Biometric authentication request sent successfully');
    } catch (error) {
      let startTime = Date.now();
      if (axios.isAxiosError(error)) {
        const responseTime = Date.now() - startTime;
        this.logger.logApiResponse('POST', '/api/docuid/biometric/auth-request', error.response?.status || 0, responseTime);

        if (error.response?.status === 404) {
          this.logger.warn('Phone number not registered with iVALT', { status: 404 });
          throw new Error("Phone number not found. Please register with iVALT first.");
        }
        this.logger.error('Biometric auth request failed', undefined, {
          status: error.response?.status,
          data: error.response?.data
        });
        throw new Error(error.response?.data?.error?.detail || "Failed to initiate authentication");
      }
      this.logger.error('Biometric auth request error', error as Error);
      throw error;
    }
  }

  /**
   * Poll for biometric authentication result
   */
  private static async pollAuthResult(phoneNumber: string): Promise<AuthResult> {
    const maxAttempts = 60; // 60 attempts = ~2 minutes (with 2s intervals)
    const pollInterval = 2000; // 2 seconds

    this.logger.info('Starting authentication polling', {
      maxAttempts,
      timeoutSeconds: maxAttempts * pollInterval / 1000
    });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      this.logger.debug(`Polling attempt ${attempt + 1}/${maxAttempts}`);
      const startTime = Date.now();
      try {

        this.logger.logApiRequest('pollAuthResult', 'POST', '/api/docuid/biometric/auth-result');
        const response = await axios.post(`${this.API_BASE_URL}/api/docuid/biometric/auth-result`, {
          mobile: phoneNumber
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': "PKIqfASvBfaKQxsg6DVn92ANw7bLsWXSalEsg5Bz"
          }
        });

        const responseTime = Date.now() - startTime;
        this.logger.logApiResponse('POST', '/api/docuid/biometric/auth-result', response.status, responseTime);
        this.logger.debug('API Response details', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        });

        // Success - user authenticated
        if (response.status === 200 && response.data.data?.details) {
          this.logger.info(`Authentication successful after ${attempt + 1} attempts`, {
            userId: response.data.data.details.id,
            userName: response.data.data.details.name
          });
          return {
            sessionToken: this.generateSessionToken(),
            user: {
              ...response.data.data.details,
              latitude: response.data.data.details.latitude,
              longitude: response.data.data.details.longitude,
              imei: response.data.data.details.imei
            },
            message: response.data.message,
            timestamp: new Date().toISOString()
          };
        }

      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const errorDetail = error.response?.data?.error?.detail;
          const responseTime = Date.now() - startTime;

          this.logger.logApiResponse('POST', '/api/docuid/biometric/auth-result', status || 0, responseTime);
          this.logger.debug('API Error details', {
            status,
            errorDetail,
            fullResponse: error.response?.data,
            statusText: error.response?.statusText
          });

          if (status === 401 && errorDetail?.includes("Denied")) {
            this.logger.warn(`Authentication denied by user after ${attempt + 1} attempts`);
            throw new Error("Biometric authentication was denied. Please try again.");
          }

          if (status === 404) {
            this.logger.warn('User not found during polling', { status: 404 });
            throw new Error("User not found. Please check your phone number.");
          }

          if (status === 422 && errorDetail?.includes("pending")) {
            // Authentication still pending, continue polling
            this.logger.debug(`Authentication pending, attempt ${attempt + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          }

          // For other unexpected errors, log but continue polling
          this.logger.warn(`Unexpected response during polling, continuing...`, {
            status,
            errorDetail,
            attempt: attempt + 1
          });
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        this.logger.error(`Polling error on attempt ${attempt + 1}`, error as Error);
        throw error;
      }
    }

    this.logger.error(`Authentication polling timed out after ${maxAttempts} attempts`);
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
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        this.logger.debug('No stored authentication data found');
        return null;
      }

      const authData: StoredAuth = JSON.parse(stored);

      // Check if token is expired
      if (Date.now() > authData.expiresAt) {
        this.logger.info('Stored authentication token expired, logging out');
        this.logout();
        return null;
      }

      this.logger.debug('Retrieved stored authentication data', {
        hasUser: !!authData.user,
        expiresIn: Math.round((authData.expiresAt - Date.now()) / 1000 / 60) + ' minutes'
      });

      return authData;
    } catch (error) {
      this.logger.error('Failed to retrieve stored authentication data', error as Error);
      return null;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const isAuth = this.getStoredAuth() !== null;
    this.logger.debug('Authentication check', { isAuthenticated: isAuth });
    return isAuth;
  }

  /**
   * Logout and clear stored authentication
   */
  static logout(): void {
    const storedAuth = this.getStoredAuth();

    if (storedAuth) {
      this.logger.logAuthEvent('LOGOUT', storedAuth.user?.id?.toString(), {
        phone: storedAuth.phone?.substring(0, 3) + '***',
        userName: storedAuth.user?.name
      });
    }

    localStorage.removeItem(this.STORAGE_KEY);
    this.logger.info('User logged out successfully');
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
