import axios from "axios";
import { logger } from "./Logger";
import { BIOMETRIC_ROUTES, API_CONFIG } from "../../config/apiRoutes";
import { User, StoredAuth } from "../common/types";

export class AuthService {
  private static readonly STORAGE_KEY = "docuid_auth";
  private static readonly authLogger = logger.createContextLogger("AuthService");

  /**
   * Authenticate user with phone number via biometric verification
   */
  static async login(phoneNumber: string): Promise<void> {
    try {
      this.authLogger.info("Starting biometric authentication", {
        phoneNumber:
          phoneNumber.substring(0, 3) + "***" + phoneNumber.substring(phoneNumber.length - 3),
      });

      // --- DUMMY CREDENTIALS FOR DEMO ---
      if (phoneNumber === "+919999999999" || phoneNumber === "9999999999") {
        this.authLogger.info("Using dummy credentials for demo mode");
        
        const dummyUser: User = {
          id: 999999,
          name: "Demo User",
          email: "demo@docuid.net",
          mobile: "9999999999",
          country_code: "91",
          address: "Demo Location",
          latitude: 0,
          longitude: 0,
          imei: "demo-device-imei"
        };

        const authData: StoredAuth = {
          phone: phoneNumber,
          sessionToken: "demo-session-token",
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          user: dummyUser,
        };

        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));

        this.authLogger.info("Authentication successful (Demo)", {
          userId: dummyUser.id,
          userName: dummyUser.name,
        });

        this.authLogger.logAuthEvent("LOGIN_SUCCESS", dummyUser.id.toString());
        return;
      }
      // ----------------------------------

      // Initiate biometric authentication request
      await this.requestBiometricAuth(phoneNumber);

      // Poll for authentication result
      const authResult = await this.pollAuthResult(phoneNumber);

      if (!authResult.sessionToken) {
        throw new Error("No session token received from server");
      }

      // Store authentication data
      const authData: StoredAuth = {
        phone: phoneNumber,
        sessionToken: authResult.sessionToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        user: authResult.user,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));

      this.authLogger.info("Authentication successful", {
        userId: authData.user?.id,
        userName: authData.user?.name,
      });

      this.authLogger.logAuthEvent("LOGIN_SUCCESS", authData.user?.id?.toString());
    } catch (error) {
      this.authLogger.error("Authentication failed", error as Error);
      throw error;
    }
  }

  /**
   * Request biometric authentication from DocuID API
   */
  private static async requestBiometricAuth(phoneNumber: string): Promise<void> {
    const startTime = Date.now();
    try {
      this.authLogger.logApiRequest("POST", BIOMETRIC_ROUTES.AUTH_REQUEST);

      const response = await axios.post(
        BIOMETRIC_ROUTES.AUTH_REQUEST,
        {
          mobile: phoneNumber,
          requestFrom: "DocuID",
        },
        {
          headers: {
            "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
            "x-api-key": API_CONFIG.HEADERS.API_KEY,
          },
          withCredentials: API_CONFIG.WITH_CREDENTIALS,
        }
      );

      const responseTime = Date.now() - startTime;
      this.authLogger.logApiResponse(
        "POST",
        BIOMETRIC_ROUTES.AUTH_REQUEST,
        response.status,
        responseTime
      );

      if (!response.data?.data?.status) {
        throw new Error("Failed to initiate biometric authentication");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error("Phone number not found. Please register with iVALT first.");
      }
      throw error;
    }
  }

  /**
   * Poll for biometric authentication result
   */
  private static async pollAuthResult(
    phoneNumber: string
  ): Promise<{ sessionToken: string; user: User }> {
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const startTime = Date.now();
      try {
        const response = await axios.post(
          BIOMETRIC_ROUTES.AUTH_RESULT,
          { mobile: phoneNumber },
          {
            headers: {
              "Content-Type": API_CONFIG.HEADERS.CONTENT_TYPE,
              "x-api-key": API_CONFIG.HEADERS.API_KEY,
            },
            withCredentials: API_CONFIG.WITH_CREDENTIALS,
          }
        );

        if (response.status === 200 && response.data?.data?.details) {
          return {
            sessionToken: response.data.data.sessionToken || response.data.sessionToken,
            user: response.data.data.details,
          };
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const detail = error.response?.data?.error?.detail;

          if (status === 401 && detail?.includes("Denied")) {
            throw new Error("Biometric authentication was denied. Please try again.");
          }

          if (status === 422 && detail?.includes("pending")) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue;
          }
        }

        this.authLogger.warn(`Polling attempt ${attempt + 1} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error("Authentication timed out. Please try again.");
  }

  /**
   * Get stored authentication data
   */
  static getStoredAuth(): StoredAuth | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const authData: StoredAuth = JSON.parse(stored);

      if (Date.now() > authData.expiresAt) {
        this.logout();
        return null;
      }

      return authData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current session token
   */
  static getSessionToken(): string | null {
    return this.getStoredAuth()?.sessionToken || null;
  }

  /**
   * Logout and clear stored authentication
   */
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.authLogger.info("User logged out");
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    return this.getStoredAuth() !== null;
  }
}
