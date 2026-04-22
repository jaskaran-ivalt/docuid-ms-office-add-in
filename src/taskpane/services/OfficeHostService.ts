/**
 * OfficeHostService
 *
 * Detects the current Office host application at runtime and provides
 * host-specific configuration and helpers for Word, Excel, and PowerPoint.
 */

/* global Office */

export type OfficeHost = "Word" | "Excel" | "PowerPoint" | "Unknown";

export class OfficeHostService {
  private static cachedHost: OfficeHost | null = null;

  /**
   * Detect and return the current Office host application.
   * Falls back to "Unknown" when running outside Office (browser mode).
   */
  static getHost(): OfficeHost {
    if (this.cachedHost !== null) {
      return this.cachedHost;
    }

    try {
      if (typeof Office === "undefined" || !Office.context) {
        this.cachedHost = "Unknown";
        return this.cachedHost;
      }

      const host = Office.context.host as Office.HostType;

      if (host === Office.HostType.Word) {
        this.cachedHost = "Word";
      } else if (host === Office.HostType.Excel) {
        this.cachedHost = "Excel";
      } else if (host === Office.HostType.PowerPoint) {
        this.cachedHost = "PowerPoint";
      } else {
        this.cachedHost = "Unknown";
      }
    } catch {
      this.cachedHost = "Unknown";
    }

    return this.cachedHost;
  }

  /**
   * Reset cached host (useful for testing).
   */
  static resetCache(): void {
    this.cachedHost = null;
  }

  /**
   * Human-readable label for the current host.
   */
  static getHostLabel(): string {
    const host = this.getHost();
    const labels: Record<OfficeHost, string> = {
      Word: "Microsoft Word",
      Excel: "Microsoft Excel",
      PowerPoint: "Microsoft PowerPoint",
      Unknown: "Office",
    };
    return labels[host];
  }

  /**
   * Returns the document route key for the current host.
   * Used by DocuIdApiService to pick the correct endpoint.
   */
  static getDocumentRouteKey(): "WORD_FILES" | "EXCEL_FILES" | "POWERPOINT_FILES" {
    const host = this.getHost();
    const keys: Record<OfficeHost, "WORD_FILES" | "EXCEL_FILES" | "POWERPOINT_FILES"> = {
      Word: "WORD_FILES",
      Excel: "EXCEL_FILES",
      PowerPoint: "POWERPOINT_FILES",
      Unknown: "WORD_FILES", // safe default
    };
    return keys[host];
  }

  /**
   * Returns the accepted file extensions for the current host.
   */
  static getAcceptedExtensions(): string[] {
    const host = this.getHost();
    const extensions: Record<OfficeHost, string[]> = {
      Word: ["docx", "doc", "docm"],
      Excel: ["xlsx", "xls", "xlsm", "csv"],
      PowerPoint: ["pptx", "ppt", "pptm"],
      Unknown: ["docx", "xlsx", "pptx"],
    };
    return extensions[host];
  }
}
