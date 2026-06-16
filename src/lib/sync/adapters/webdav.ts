/**
 * WebDAV 云存储适配器
 * 
 * 支持自建WebDAV服务器，如Nextcloud、ownCloud等
 */

import type { CloudCredentials, SyncPackage } from '../types';
import { BaseCloudAdapter } from '../adapter';

export class WebDavAdapter extends BaseCloudAdapter {
  private baseUrl: string = '';

  constructor() {
    super('webdav');
  }

  async init(credentials: CloudCredentials): Promise<boolean> {
    if (!credentials.endpoint || !credentials.username || !credentials.accessToken) {
      throw new Error('WebDAV requires endpoint, username, and password');
    }

    this.credentials = credentials;
    this.baseUrl = credentials.endpoint.replace(/\/$/, '');
    this.connected = true;
    return true;
  }

  async upload(path: string, data: SyncPackage): Promise<boolean> {
    this.ensureConnected();
    
    try {
      const response = await this.request('PUT', path, JSON.stringify(data));
      return response.ok;
    } catch (error) {
      console.error('WebDAV upload failed:', error);
      return false;
    }
  }

  async download(path: string): Promise<SyncPackage | null> {
    this.ensureConnected();
    
    try {
      const response = await this.request('GET', path);
      if (!response.ok) return null;
      
      const text = await response.text();
      return JSON.parse(text) as SyncPackage;
    } catch (error) {
      console.error('WebDAV download failed:', error);
      return null;
    }
  }

  async list(prefix: string): Promise<string[]> {
    this.ensureConnected();
    
    try {
      const response = await this.request('PROPFIND', prefix, null, {
        'Depth': '1',
        'Content-Type': 'application/xml'
      });
      
      if (!response.ok) return [];
      
      const text = await response.text();
      // 解析WebDAV XML响应
      const files: string[] = [];
      const regex = /<d:href>([^<]+)<\/d:href>/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const filePath = decodeURIComponent(match[1]);
        if (filePath !== prefix && !filePath.endsWith('/')) {
          files.push(filePath);
        }
      }
      
      return files;
    } catch (error) {
      console.error('WebDAV list failed:', error);
      return [];
    }
  }

  async delete(path: string): Promise<boolean> {
    this.ensureConnected();
    
    try {
      const response = await this.request('DELETE', path);
      return response.ok;
    } catch (error) {
      console.error('WebDAV delete failed:', error);
      return false;
    }
  }

  async getInfo(path: string): Promise<{ modified: number; size: number } | null> {
    this.ensureConnected();
    
    try {
      const response = await this.request('HEAD', path);
      if (!response.ok) return null;
      
      const lastModified = response.headers.get('Last-Modified');
      const contentLength = response.headers.get('Content-Length');
      
      return {
        modified: lastModified ? new Date(lastModified).getTime() : Date.now(),
        size: contentLength ? parseInt(contentLength, 10) : 0
      };
    } catch (error) {
      console.error('WebDAV getInfo failed:', error);
      return null;
    }
  }

  private async request(
    method: string,
    path: string,
    body?: string | null,
    headers?: Record<string, string>
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const credentials = this.credentials!;
    
    const auth = btoa(`${credentials.username}:${credentials.accessToken}`);
    
    return fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        ...headers
      },
      body: body || undefined
    });
  }
}
