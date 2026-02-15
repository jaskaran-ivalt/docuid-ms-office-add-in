export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  countryCode: string;
  address?: string;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  dateModified: string;
  size: string;
  documentId: number;
  isPasswordProtected: boolean;
  isEncrypted?: boolean;
  description?: string | null;
}

export interface AuthData {
  phone: string;
  sessionToken: string;
  expiresAt: number;
  user?: User;
}
