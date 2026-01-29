import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductConfig {
  id: string;
  name: string;
  type: string;
  description?: string;
  currency: string;
  overallBudget: number;
  isClosed: boolean;
  enableDashboard: boolean;
  enableExpenses: boolean;
  enableContributions: boolean;
  enableDeposits: boolean;
  enableBudget: boolean;
  enableReports: boolean;
  enableSettlement: boolean;
}

export interface ProductConfigUpdate {
  enableDashboard?: boolean;
  enableExpenses?: boolean;
  enableContributions?: boolean;
  enableDeposits?: boolean;
  enableBudget?: boolean;
  enableReports?: boolean;
  enableSettlement?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductConfigService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('ceremony_tracker_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  async getProductConfig(productId: string): Promise<ProductConfig> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ config: ProductConfig }>(
          `${environment.apiUrl}/product-config/${productId}`,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.config;
    } catch (error) {
      console.error('Get product config error:', error);
      throw error;
    }
  }

  async updateProductConfig(productId: string, config: ProductConfigUpdate): Promise<ProductConfig> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ config: ProductConfig }>(
          `${environment.apiUrl}/product-config/${productId}`,
          config,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.config;
    } catch (error) {
      console.error('Update product config error:', error);
      throw error;
    }
  }
}
