/**
 * Utility functions for the DocuID Office Add-in
 */

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ext;
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(countryCode: string, mobile: string): string {
  if (!mobile) return "";
  const cleanedMobile = mobile.replace(/\D/g, "");
  const code = countryCode ? countryCode.replace("+", "") : "";
  
  if (code && cleanedMobile.startsWith(code)) {
    return `+${code} ${cleanedMobile.slice(code.length)}`;
  } else if (code) {
    return `+${code} ${cleanedMobile}`;
  }
  return `+${cleanedMobile}`;
}

/**
 * Validate IMEI
 */
export function validateIMEI(imei: string): boolean {
  if (!imei || imei === "N/A") return true;
  const imeiRegex = /^\d{15}$/;
  return imeiRegex.test(imei.replace(/\D/g, ""));
}

/**
 * Format location coordinates
 */
export function formatLocation(latitude?: number, longitude?: number): string {
  if (latitude && longitude) {
    return `Latitude ${latitude}, Longitude ${longitude}`;
  }
  return "Location not available";
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, "");
}
