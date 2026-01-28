import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { 
  Contribution, 
  ContributionFormData,
  ContributorRelationship 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ContributionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private contributions = signal<Contribution[]>([]);
  
  readonly allContributions = this.contributions.asReadonly();
  
  readonly totalContributions = computed(() => 
    this.contributions().reduce((sum, contrib) => sum + contrib.amount, 0)
  );

  readonly contributionsByRelationship = computed(() => {
    const map = new Map<ContributorRelationship, number>();
    map.set('Sister', 0);
    map.set('Relative', 0);
    
    this.contributions().forEach(contrib => {
      const current = map.get(contrib.relationship) || 0;
      map.set(contrib.relationship, current + contrib.amount);
    });
    
    return map;
  });

  readonly sisterContribution = computed(() => 
    this.contributions()
      .filter(c => c.relationship === 'Sister')
      .reduce((sum, c) => sum + c.amount, 0)
  );

  readonly relativeContributions = computed(() => 
    this.contributions()
      .filter(c => c.relationship === 'Relative')
      .reduce((sum, c) => sum + c.amount, 0)
  );

  constructor() {
    this.loadFromStorage();
  }

  async loadFromApi(): Promise<void> {
    const token = this.authService.getToken();
    if (!token || token === 'demo') {
      return;
    }

    try {
      const data = await firstValueFrom(
        this.http.get<any[]>(`${environment.apiUrl}/contributions`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      
      const contributions = data.map(c => ({
        ...c,
        date: new Date(c.date),
        createdAt: new Date(c.createdAt)
      }));
      
      this.contributions.set(contributions);
    } catch (error) {
      console.error('Failed to load contributions from API:', error);
    }
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('ceremony_contributions');
    if (stored) {
      try {
        const data = JSON.parse(stored) as Contribution[];
        const contributions = data.map(contrib => ({
          ...contrib,
          date: new Date(contrib.date),
          createdAt: new Date(contrib.createdAt)
        }));
        this.contributions.set(contributions);
      } catch {
        console.error('Failed to load contributions from storage');
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('ceremony_contributions', JSON.stringify(this.contributions()));
  }

  private generateId(): string {
    return `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async addContribution(data: ContributionFormData): Promise<Contribution> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        const contrib = await firstValueFrom(
          this.http.post<any>(`${environment.apiUrl}/contributions`, data, {
            headers: this.authService.getAuthHeaders()
          })
        );
        
        const parsed = {
          ...contrib,
          date: new Date(contrib.date),
          createdAt: new Date(contrib.createdAt)
        };
        
        this.contributions.update(contribs => [...contribs, parsed]);
        return parsed;
      } catch (error) {
        console.error('Failed to add contribution via API:', error);
        throw error;
      }
    }
    
    const contribution: Contribution = {
      id: this.generateId(),
      ...data,
      createdAt: new Date()
    };
    
    this.contributions.update(contribs => [...contribs, contribution]);
    this.saveToStorage();
    return contribution;
  }

  async updateContribution(id: string, data: Partial<ContributionFormData>): Promise<Contribution | null> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        const contrib = await firstValueFrom(
          this.http.put<any>(`${environment.apiUrl}/contributions/${id}`, data, {
            headers: this.authService.getAuthHeaders()
          })
        );
        
        const parsed = {
          ...contrib,
          date: new Date(contrib.date),
          createdAt: new Date(contrib.createdAt)
        };
        
        this.contributions.update(contribs => 
          contribs.map(c => c.id === id ? parsed : c)
        );
        return parsed;
      } catch (error) {
        console.error('Failed to update contribution via API:', error);
        throw error;
      }
    }
    
    let updated: Contribution | null = null;
    
    this.contributions.update(contribs => 
      contribs.map(contrib => {
        if (contrib.id === id) {
          updated = { ...contrib, ...data };
          return updated;
        }
        return contrib;
      })
    );
    
    this.saveToStorage();
    return updated;
  }

  async deleteContribution(id: string): Promise<boolean> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        await firstValueFrom(
          this.http.delete(`${environment.apiUrl}/contributions/${id}`, {
            headers: this.authService.getAuthHeaders()
          })
        );
        
        this.contributions.update(contribs => contribs.filter(c => c.id !== id));
        return true;
      } catch (error) {
        console.error('Failed to delete contribution via API:', error);
        throw error;
      }
    }
    
    const initialLength = this.contributions().length;
    this.contributions.update(contribs => contribs.filter(c => c.id !== id));
    this.saveToStorage();
    return this.contributions().length < initialLength;
  }

  getContributionById(id: string): Contribution | undefined {
    return this.contributions().find(c => c.id === id);
  }

  getContributionsByContributor(name: string): Contribution[] {
    return this.contributions().filter(
      c => c.contributorName.toLowerCase() === name.toLowerCase()
    );
  }

  clearAll(): void {
    this.contributions.set([]);
    this.saveToStorage();
  }
}
