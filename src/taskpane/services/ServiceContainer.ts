import { HttpClient } from './HttpClient';
import { BrowserStorage } from './BrowserStorage';
import { AuthRepository } from './repositories/AuthRepository';
import { DocumentRepository } from './repositories/DocumentRepository';
import { AuthService } from './AuthService';
import { DocumentService } from './DocumentService';

class ServiceContainer {
  private static instance: ServiceContainer;
  
  public readonly httpClient: HttpClient;
  public readonly storage: BrowserStorage;
  public readonly authRepository: AuthRepository;
  public readonly documentRepository: DocumentRepository;
  public readonly authService: AuthService;
  public readonly documentService: DocumentService;

  private constructor() {
    this.httpClient = new HttpClient();
    this.storage = new BrowserStorage();
    this.authRepository = new AuthRepository(this.httpClient);
    this.documentRepository = new DocumentRepository(this.httpClient);
    
    this.authService = new AuthService(this.authRepository, this.storage);
    this.documentService = new DocumentService(this.documentRepository);
    
    // Configure interceptors
    this.httpClient.getInstance().interceptors.request.use((config) => {
      try {
        const authData = this.storage.getItem('docuid_auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed && parsed.sessionToken) {
            const token = `Bearer ${parsed.sessionToken}`;
            console.log(`[HttpClient] Setting Auth header for ${config.url}`, token);
            // Use safe header setting for Axios 1.x
            if (config.headers && typeof config.headers.set === 'function') {
              config.headers.set('Authorization', token);
            } else {
              (config.headers as any).Authorization = token;
            }
          }
        }
      } catch (error) {
        console.error('Error in Auth interceptor:', error);
      }
      return config;
    });
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

const container = ServiceContainer.getInstance();
export const authService = container.authService;
export const documentService = container.documentService;
export const storage = container.storage;

