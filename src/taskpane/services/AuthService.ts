import axios from "axios";

interface AuthResponse {
  success: boolean;
  sessionToken?: string;
  message?: string;
}

interface StoredAuth {
  phone: string;
  sessionToken: string;
  expiresAt: number;
}

export class AuthService {
  private static readonly STORAGE_KEY = "docuid_auth";
  private static readonly API_BASE_URL = "https://api.docuid.net"; // Replace with actual API URL

  /**
   * Authenticate user with phone number via biometric verification
   */
  static async login(phoneNumber: string): Promise<void> {
    try {
      // For development, simulate successful authentication
      // In production, this would call the actual docuid.net API
      await this.simulateLogin(phoneNumber);

      // Store authentication data
      const authData: StoredAuth = {
        phone: phoneNumber,
        sessionToken: this.generateSessionToken(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      throw new Error("Authentication failed. Please try again.");
    }
  }

  /**
   * Simulate the authentication process for development
   */
  private static async simulateLogin(phoneNumber: string): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate different response scenarios for testing
    if (phoneNumber.includes("invalid")) {
      throw new Error("Invalid phone number");
    }

    if (phoneNumber.includes("error")) {
      throw new Error("Server error occurred");
    }

    return {
      success: true,
      sessionToken: this.generateSessionToken(),
      message: "Authentication successful",
    };
  }

  /**
   * Production API call (commented for development)
   */
  /*
  private static async callAuthAPI(phoneNumber: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.API_BASE_URL}/api/auth/login`, {
        phoneNumber: phoneNumber,
        biometricRequest: true
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Authentication failed');
      }
      throw error;
    }
  }
  */

  /**
   * Get stored authentication data
   */
  static getStoredAuth(): StoredAuth | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const authData: StoredAuth = JSON.parse(stored);

      // Check if token is expired
      if (Date.now() > authData.expiresAt) {
        this.logout();
        return null;
      }

      return authData;
    } catch {
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
