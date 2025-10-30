import axios, { AxiosInstance } from 'axios';
import { AuthService } from './auth.js';
import { AppStoreConnectConfig } from '../types/index.js';

export class AppStoreConnectClient {
  private axiosInstance: AxiosInstance;
  private authService: AuthService;

  constructor(config: AppStoreConnectConfig) {
    this.authService = new AuthService(config);
    
    this.axiosInstance = axios.create({
      baseURL: 'https://api.appstoreconnect.apple.com/v1',
    });
  }

  async request<T = any>(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', url: string, data?: any, params?: Record<string, any>): Promise<T> {
    const token = await this.authService.generateToken();
    
    const response = await this.axiosInstance.request<T>({
      method,
      url,
      data,
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', url, undefined, params);
  }

  async post<T = any>(url: string, data: any): Promise<T> {
    return this.request<T>('POST', url, data);
  }

  async put<T = any>(url: string, data: any): Promise<T> {
    return this.request<T>('PUT', url, data);
  }

  async delete<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>('DELETE', url, data);
  }

  async patch<T = any>(url: string, data: any): Promise<T> {
    return this.request<T>('PATCH', url, data);
  }

  async downloadFromUrl(url: string): Promise<any> {
    const token = await this.authService.generateToken();
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return {
      data: response.data,
      contentType: response.headers['content-type'],
      size: response.headers['content-length']
    };
  }

  async downloadFile(url: string): Promise<string | Buffer> {
    const token = await this.authService.generateToken();
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });

    const contentType = response.headers['content-type'] || '';
    
    // If it's a text-based file, return as string
    if (contentType.includes('text/') || contentType.includes('application/json') || 
        contentType.includes('application/xml') || url.includes('.log') || url.includes('.txt')) {
      return Buffer.from(response.data).toString('utf-8');
    }
    
    // Otherwise return as Buffer for binary files
    return Buffer.from(response.data);
  }
}
