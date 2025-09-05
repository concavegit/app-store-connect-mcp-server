import axios from 'axios';
import { AuthService } from './auth.js';
export class AppStoreConnectClient {
    axiosInstance;
    authService;
    constructor(config) {
        this.authService = new AuthService(config);
        this.authService.validateConfig();
        this.axiosInstance = axios.create({
            baseURL: 'https://api.appstoreconnect.apple.com/v1',
        });
    }
    async request(method, url, data, params) {
        const token = await this.authService.generateToken();
        const response = await this.axiosInstance.request({
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
    async get(url, params) {
        return this.request('GET', url, undefined, params);
    }
    async post(url, data) {
        return this.request('POST', url, data);
    }
    async put(url, data) {
        return this.request('PUT', url, data);
    }
    async delete(url, data) {
        return this.request('DELETE', url, data);
    }
    async patch(url, data) {
        return this.request('PATCH', url, data);
    }
    async downloadFromUrl(url) {
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
    async downloadFile(url) {
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
