/**
 * OfficeHostService
 *
 * Detects the current Office host application at runtime and provides
 * host-specific configuration and helpers for Word, Excel, and PowerPoint.
 */

/* global Office */

export type OfficeHost = 'Word' | 'Excel' | 'PowerPoint' | 'Unknown';

export class OfficeHostService {
  private static cachedHost: OfficeHost | null = null;

  /**
   * Detect and return the current Office host application.
   * Falls back to "Unknown" when running outside Office (browser mode).
   */
  static getHost(): OfficeHost {
    if (OfficeHostService.cachedHost !== null) {
      return OfficeHostService.cachedHost;
    }

    try {
      if (typeof Office === 'undefined' || !Office.context) {
        OfficeHostService.cachedHost = 'Unknown';
        return OfficeHostService.cachedHost;
      }

      const host = Office.context.host as Office.HostType;

      if (host === Office.HostType.Word) {
        OfficeHostService.cachedHost = 'Word';
      } else if (host === Office.HostType.Excel) {
        OfficeHostService.cachedHost = 'Excel';
      } else if (host === Office.HostType.PowerPoint) {
        OfficeHostService.cachedHost = 'PowerPoint';
      } else {
        // Don't cache Unknown — Office context may not be ready yet,
        // so retry detection on the next call.
        return 'Unknown';
      }
    } catch {
      return 'Unknown';
    }

    return OfficeHostService.cachedHost;
  }

  /**
   * Reset cached host (useful for testing).
   */
  static resetCache(): void {
    OfficeHostService.cachedHost = null;
  }

  /**
   * Human-readable label for the current host.
   */
  static getHostLabel(): string {
    const host = OfficeHostService.getHost();
    const labels: Record<OfficeHost, string> = {
      Word: 'Microsoft Word',
      Excel: 'Microsoft Excel',
      PowerPoint: 'Microsoft PowerPoint',
      Unknown: 'Office',
    };
    return labels[host];
  }

  /**
   * Returns the document route key for the current host.
   * Used by DocuIdApiService to pick the correct endpoint.
   */
  static getDocumentRouteKey(): 'WORD_FILES' | 'EXCEL_FILES' | 'POWERPOINT_FILES' {
    const host = OfficeHostService.getHost();
    const keys: Record<OfficeHost, 'WORD_FILES' | 'EXCEL_FILES' | 'POWERPOINT_FILES'> = {
      Word: 'WORD_FILES',
      Excel: 'EXCEL_FILES',
      PowerPoint: 'POWERPOINT_FILES',
      Unknown: 'WORD_FILES', // safe default
    };
    return keys[host];
  }

  /**
   * Returns the accepted file extensions for the current host.
   */
  static getAcceptedExtensions(): string[] {
    const host = OfficeHostService.getHost();
    const extensions: Record<OfficeHost, string[]> = {
      Word: ['docx', 'doc', 'docm'],
      Excel: ['xlsx', 'xls', 'xlsm', 'csv'],
      PowerPoint: ['pptx', 'ppt', 'pptm'],
      Unknown: ['docx', 'xlsx', 'pptx'],
    };
    return extensions[host];
  }
}
