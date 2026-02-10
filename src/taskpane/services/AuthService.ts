import { Logger } from "./Logger";
import { IStorage } from "./interfaces";
import { AuthRepository } from "./repositories/AuthRepository";

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  country_code: string;
  address: string;
  latitude?: number;
  longitude?: number;
  imei?: string;
}

export interface StoredAuth {
  phone: string;
  sessionToken: string;
  expiresAt: number;
  user?: User;
  message?: string;
  timestamp?: string;
}

export class AuthService {
  private static readonly STORAGE_KEY = "docuid_auth";
  private readonly logger = Logger.getInstance().createContextLogger("AuthService");

  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: IStorage
  ) {}

  /**
   * Authenticate user with phone number via biometric verification
   */
  async login(phoneNumber: string): Promise<void> {
    try {
      this.logger.info("Starting biometric authentication", { phoneNumber });

      await this.repository.requestBiometric(phoneNumber);
      const authResult = await this.pollAuthResult(phoneNumber);

      const authData: StoredAuth = {
        phone: phoneNumber,
        sessionToken: authResult.sessionToken || this.generateSessionToken(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        user: authResult.user,
        message: authResult.message,
        timestamp: authResult.timestamp,
      };

      this.storage.setItem(AuthService.STORAGE_KEY, JSON.stringify(authData));
      this.logger.logAuthEvent("LOGIN_SUCCESS", authResult.user?.id?.toString());
    } catch (error) {
      this.logger.error("Authentication failed", error as Error);
      throw error;
    }
  }

  private async pollAuthResult(phoneNumber: string): Promise<{ sessionToken?: string; user?: User; message?: string; timestamp?: string }> {
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.repository.pollResult(phoneNumber);
        
        if (response && response.data?.details) {
          return {
            sessionToken: this.generateSessionToken(),
            user: response.data.details,
            message: response.message,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error: any) {
        if (error.response?.status === 422) {
          await new Promise(r => setTimeout(r, pollInterval));
          continue;
        }
        throw error;
      }
      await new Promise(r => setTimeout(r, pollInterval));
    }
    throw new Error("Authentication timed out");
  }

  getStoredAuth(): StoredAuth | null {
    const stored = this.storage.getItem(AuthService.STORAGE_KEY);
    if (!stored) {
      console.log("[AuthService] No stored auth found");
      return null;
    }

    try {
      const authData: StoredAuth = JSON.parse(stored);
      console.log("[AuthService] Found stored auth:", { 
        phone: authData.phone, 
        hasToken: !!authData.sessionToken,
        expiresAt: new Date(authData.expiresAt).toLocaleString()
      });

      if (Date.now() > authData.expiresAt) {
        console.warn("[AuthService] Auth token expired, logging out...");
        this.logout();
        return null;
      }
      return authData;
    } catch (e) {
      console.error("[AuthService] Failed to parse stored auth", e);
      return null;
    }
  }

  logout(): void {
    this.storage.removeItem(AuthService.STORAGE_KEY);
    this.logger.info("User logged out");
  }

  private generateSessionToken(): string {
    return "mock_token_" + Math.random().toString(36).substr(2, 9);
  }

  isAuthenticated(): boolean {
    return this.getStoredAuth() !== null;
  }
}

