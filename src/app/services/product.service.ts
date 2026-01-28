import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateProductRequest {
  name: string;
  type: string;
  overallBudget?: number;
  description?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  type: string;
  overallBudget: number;
  description?: string;
  currency: string;
  isClosed: boolean;
  createdAt: string;
  userCount?: number;
  expenseCount?: number;
  totalExpense?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('ceremony_tracker_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ product: ProductResponse }>(
          `${environment.apiUrl}/products`,
          data,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.product;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  async getAllProducts(): Promise<ProductResponse[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ products: ProductResponse[] }>(
          `${environment.apiUrl}/products`,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.products || [];
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  }

  async getProductById(productId: string): Promise<ProductResponse> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ product: ProductResponse }>(
          `${environment.apiUrl}/products/${productId}`,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.product;
    } catch (error) {
      console.error('Get product error:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, data: Partial<CreateProductRequest>): Promise<ProductResponse> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ product: ProductResponse }>(
          `${environment.apiUrl}/products/${productId}`,
          data,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.product;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(
          `${environment.apiUrl}/products/${productId}`,
          { headers: this.getAuthHeaders() }
        )
      );
      return true;
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }
}
