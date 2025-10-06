import axios from "axios";

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
  // Use proxy in development, direct API in production
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'development'
    ? '' // Use relative URLs for webpack proxy
    : "https://api.docuid.net";

  /**
   * Authenticate user with phone number via biometric verification
   */
  static async login(phoneNumber: string): Promise<void> {
    try {
      console.log('Starting biometric authentication', {
        phoneNumber: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
        originalFormat: phoneNumber,
        hasPlus: phoneNumber.startsWith('+')
      });

      // Initiate biometric authentication request
      console.log('Requesting biometric authentication');
      await this.requestBiometricAuth(phoneNumber);

      // Poll for authentication result
      console.log('Starting polling for authentication result');
      const authResult = await this.pollAuthResult(phoneNumber);
      console.log('Polling completed', { hasResult: !!authResult });

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

      console.log('LOGIN_SUCCESS', {
        userId: authResult.user?.id?.toString(),
        phone: phoneNumber.substring(0, 3) + '***',
        userName: authResult.user?.name
      });

    } catch (error) {
      console.error('Authentication failed', error);
      throw error;
    }
  }

  /**
   * Request biometric authentication from DocuID API
   */
  private static async requestBiometricAuth(phoneNumber: string): Promise<void> {
    try {
      const startTime = Date.now();

      console.log('API Request: POST /api/docuid/biometric/auth-request', {
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
      console.log(`API Response: POST /api/docuid/biometric/auth-request - ${response.status} (${responseTime}ms)`);

      console.log(response.data.data.status)

      if (!response.data.data.status) {
        console.warn('Biometric auth request returned unsuccessful response', response.data);
        throw new Error("Failed to initiate biometric authentication");
      }

      console.log('Biometric authentication request sent successfully');
    } catch (error) {
      let startTime = Date.now();
      if (axios.isAxiosError(error)) {
        const responseTime = Date.now() - startTime;
        console.log(`API Response: POST /api/docuid/biometric/auth-request - ${error.response?.status || 0} (${responseTime}ms)`);

        if (error.response?.status === 404) {
          console.warn('Phone number not registered with iVALT', { status: 404 });
          throw new Error("Phone number not found. Please register with iVALT first.");
        }
        console.error('Biometric auth request failed', {
          status: error.response?.status,
          data: error.response?.data
        });
        throw new Error(error.response?.data?.error?.detail || "Failed to initiate authentication");
      }
      console.error('Biometric auth request error', error);
      throw error;
    }
  }

  /**
   * Poll for biometric authentication result
   */
  private static async pollAuthResult(phoneNumber: string): Promise<AuthResult> {
    const maxAttempts = 60; // 60 attempts = ~2 minutes (with 2s intervals)
    const pollInterval = 2000; // 2 seconds

    console.log('🚀 POLLING: Starting authentication polling');
    console.log(`Starting authentication polling for ${maxAttempts} attempts (${maxAttempts * pollInterval / 1000}s timeout)`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);
      const startTime = Date.now();
      try {

        console.log('API Request: POST /api/docuid/biometric/auth-result', {
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
        console.log(`API Response: POST /api/docuid/biometric/auth-result - ${response.status} (${responseTime}ms)`);
        console.log(`API Response details: ${response.status}`, {
          statusText: response.statusText,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : []
        });

        // Success - user authenticated
        if (response.status === 200 && response.data.data?.details) {
          console.log(`Authentication successful after ${attempt + 1} attempts`, {
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

          console.log(`API Response: POST /api/docuid/biometric/auth-result - ${status || 0} (${responseTime}ms)`);
          console.log(`API Error details: ${status}`, {
            errorDetail,
            fullResponse: error.response?.data,
            statusText: error.response?.statusText
          });

          if (status === 401 && errorDetail?.includes("Denied")) {
            console.warn(`Authentication denied by user after ${attempt + 1} attempts`);
            throw new Error("Biometric authentication was denied. Please try again.");
          }

          if (status === 404) {
            console.warn('User not found during polling', { status: 404 });
            throw new Error("User not found. Please check your phone number.");
          }

          if (status === 422 && errorDetail?.includes("pending")) {
            // Authentication still pending, continue polling
            console.log(`Authentication pending, attempt ${attempt + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            continue;
          }

          // Handle other status codes - might indicate pending state
          // if (status === 422 && !errorDetail?.includes("pending")) {
          //   // If it's 422 but not explicitly pending, treat as error
          //   console.error(`Polling failed with unexpected 422 error`, {
          //     status,
          //     errorDetail,
          //     attempt: attempt + 1
          //   });
          //   throw new Error(errorDetail || "Authentication failed");
          // }

          // For other unexpected errors, log but continue polling
          console.warn(`Unexpected response during polling, continuing...`, {
            status,
            errorDetail,
            attempt: attempt + 1
          });
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        console.error(`Polling error on attempt ${attempt + 1}`, error);
        throw error;
      }
    }

    console.error(`Authentication polling timed out after ${maxAttempts} attempts`);
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
        console.log('No stored authentication data found');
        return null;
      }

      const authData: StoredAuth = JSON.parse(stored);

      // Check if token is expired
      if (Date.now() > authData.expiresAt) {
        console.log('Stored authentication token expired, logging out');
        this.logout();
        return null;
      }

      console.log('Retrieved stored authentication data', {
        hasUser: !!authData.user,
        expiresIn: Math.round((authData.expiresAt - Date.now()) / 1000 / 60) + ' minutes'
      });

      return authData;
    } catch (error) {
      console.error('Failed to retrieve stored authentication data', error);
      return null;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const isAuth = this.getStoredAuth() !== null;
    console.log('Authentication check', { isAuthenticated: isAuth });
    return isAuth;
  }

  /**
   * Logout and clear stored authentication
   */
  static logout(): void {
    const storedAuth = this.getStoredAuth();

    if (storedAuth) {
      console.log('LOGOUT', { userId: storedAuth.user?.id?.toString() });
    }

    localStorage.removeItem(this.STORAGE_KEY);
    console.log('User logged out successfully');
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
