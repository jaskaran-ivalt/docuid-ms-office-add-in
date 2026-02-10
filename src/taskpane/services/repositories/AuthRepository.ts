import { IHttpClient } from '../interfaces';

export interface AuthRequestPayload {
  mobile: string;
  requestFrom: string;
}

export interface AuthResultResponse {
  data: {
    status: boolean;
    details?: {
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
  };
  message: string;
}

export class AuthRepository {
  private readonly apiKey = "PKIqfASvBfaKQxsg6DVn92ANw7bLsWXSalEsg5Bz";

  constructor(private httpClient: IHttpClient) {}

  async requestBiometric(mobile: string): Promise<boolean> {
    const response = await this.httpClient.post<any>('/api/docuid/biometric/auth-request', {
      mobile,
      requestFrom: "DocuID",
    }, {
      headers: { 'x-api-key': this.apiKey }
    });
    return !!response.data?.data?.status;
  }

  async pollResult(mobile: string): Promise<AuthResultResponse | null> {
    const response = await this.httpClient.post<AuthResultResponse>('/api/docuid/biometric/auth-result', {
      mobile,
    }, {
      headers: { 'x-api-key': this.apiKey }
    });
    
    // 200 means success or pending depending on payload, but status 422 usually indicates pending in current logic
    return response.data;
  }
}
