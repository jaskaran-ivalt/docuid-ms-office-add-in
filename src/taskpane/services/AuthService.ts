import axios from "axios";
import { Logger } from "./Logger";
import { BIOMETRIC_ROUTES, API_CONFIG } from "../../config/apiRoutes";
import { User, AuthData } from "../types";

interface AuthResult {
  sessionToken?: string;
  user?: User;
  message?: string;
  timestamp?: string;
}

export class AuthService {
  private static readonly STORAGE_KEY = "docuid_auth";
  private static readonly logger = Logger.getInstance().createContextLogger("AuthService");

  /**
   * Authenticate user with phone number via biometric verification
   */
  static async login(phoneNumber: string): Promise<void> {
    try {
      this.logger.info("Starting biometric authentication", { phone: phoneNumber });

      // Initiate biometric authentication request
      await this.requestBiometricAuth(phoneNumber);

      // Poll for authentication result
      const authResult = await this.pollAuthResult(phoneNumber);

      // Store authentication data
      const authData: AuthData & { message?: string; timestamp?: string } = {
        phone: phoneNumber,
        sessionToken: authResult.sessionToken || this.generateSessionToken(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        user: authResult.user,
        message: authResult.message,
        timestamp: authResult.timestamp,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
      this.logger.info("Authentication successful", { userId: authResult.user?.id });
    } catch (error) {
      this.logger.error("Authentication failed", error as Error);
      throw error;
    }
  }

  /**
   * Request biometric authentication from DocuID API
   */
  private static async requestBiometricAuth(phoneNumber: string): Promise<void> {
    try {
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

      if (!response.data?.data?.status) {
        throw new Error("Failed to initiate biometric authentication");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error("Phone number not found. Please register with iVALT first.");
        }
        throw new Error(error.response?.data?.error?.detail || "Failed to initiate authentication");
      }
      throw error;
    }
  }

  /**
   * Poll for biometric authentication result
   */
  private static async pollAuthResult(phoneNumber: string): Promise<AuthResult> {
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
          const details = response.data.data.details;
          const sessionToken = response.data.data.sessionToken || response.data.sessionToken;

          return {
            sessionToken: sessionToken,
            user: {
              id: details.id,
              name: details.name,
              email: details.email,
              phone: phoneNumber,
              mobile: details.mobile,
              countryCode: details.country_code,
              address: details.address,
            },
            message: response.data.message,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const detail = error.response?.data?.error?.detail;

          if (status === 401 && detail?.includes("Denied")) {
            throw new Error("Biometric authentication was denied.");
          }

          if (status === 422 && detail?.includes("pending")) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            continue;
          }
        }
        // Log error and continue polling for resilience
        this.logger.warn("Polling error, retrying...", { attempt: attempt + 1 });
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error("Authentication timed out. Please try again.");
  }

  /**
   * Get stored authentication data
   */
  static getStoredAuth(): (AuthData & { timestamp?: string; message?: string }) | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const authData = JSON.parse(stored);
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
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    return this.getStoredAuth() !== null;
  }

  /**
   * Logout and clear stored authentication
   */
  static logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get current session token
   */
  static getSessionToken(): string | null {
    return this.getStoredAuth()?.sessionToken || null;
  }

  private static generateSessionToken(): string {
    return "token_" + Math.random().toString(36).substr(2, 9);
  }
}
