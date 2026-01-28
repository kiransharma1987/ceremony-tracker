import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-card" [class]="colorClass">
      <div class="card-icon" *ngIf="icon">{{ icon }}</div>
      <div class="card-content">
        <span class="card-label">{{ label }}</span>
        <span class="card-value">{{ prefix }}{{ formatValue(value) }}</span>
        <span class="card-subtitle" *ngIf="subtitle">{{ subtitle }}</span>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #5d6d7e;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      height: 100%;
      min-height: 90px;
      box-sizing: border-box;
    }
    
    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    
    .summary-card.green {
      border-left-color: #27ae60;
    }
    
    .summary-card.amber {
      border-left-color: #f39c12;
    }
    
    .summary-card.red {
      border-left-color: #e74c3c;
    }
    
    .summary-card.blue {
      border-left-color: #3498db;
    }
    
    .summary-card.purple {
      border-left-color: #9b59b6;
    }
    
    .card-icon {
      font-size: 2rem;
      opacity: 0.9;
    }
    
    .card-content {
      display: flex;
      flex-direction: column;
    }
    
    .card-label {
      font-size: 0.8rem;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }
    
    .card-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .card-subtitle {
      font-size: 0.75rem;
      color: #95a5a6;
      margin-top: 0.25rem;
    }
    
    @media (max-width: 768px) {
      .summary-card {
        padding: 1rem;
      }
      
      .card-value {
        font-size: 1.25rem;
      }
      
      .card-icon {
        font-size: 1.5rem;
      }
    }
  `]
})
export class SummaryCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() prefix = '₹';
  @Input() icon = '';
  @Input() subtitle = '';
  @Input() colorClass = '';

  formatValue(value: number | string): string {
    if (typeof value === 'number') {
      return value.toLocaleString('en-IN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    return value;
  }
}
