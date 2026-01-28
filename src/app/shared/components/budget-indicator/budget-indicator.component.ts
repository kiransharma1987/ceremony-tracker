import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetStatus } from '../../../models';

@Component({
  selector: 'app-budget-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="budget-indicator" [class]="status">
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="Math.min(percentUsed, 100)"></div>
      </div>
      <div class="budget-details">
        <span class="spent">₹{{ spent | number:'1.0-0':'en-IN' }} spent</span>
        <span class="remaining" [class.over-budget]="remaining < 0">
          {{ remaining >= 0 ? '₹' + (remaining | number:'1.0-0':'en-IN') + ' remaining' : '₹' + (Math.abs(remaining) | number:'1.0-0':'en-IN') + ' over budget' }}
        </span>
      </div>
      <div class="percent-badge" [class]="status">
        {{ percentUsed | number:'1.0-0' }}%
      </div>
    </div>
  `,
  styles: [`
    .budget-indicator {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      position: relative;
    }
    
    .progress-bar {
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .green .progress-fill {
      background: linear-gradient(90deg, #27ae60, #2ecc71);
    }
    
    .amber .progress-fill {
      background: linear-gradient(90deg, #f39c12, #f1c40f);
    }
    
    .red .progress-fill {
      background: linear-gradient(90deg, #e74c3c, #c0392b);
    }
    
    .budget-details {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }
    
    .spent {
      color: #7f8c8d;
    }
    
    .remaining {
      color: #27ae60;
      font-weight: 500;
    }
    
    .remaining.over-budget {
      color: #e74c3c;
    }
    
    .percent-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
    }
    
    .percent-badge.green {
      background: #d5f5e3;
      color: #27ae60;
    }
    
    .percent-badge.amber {
      background: #fef5e7;
      color: #f39c12;
    }
    
    .percent-badge.red {
      background: #fadbd8;
      color: #e74c3c;
    }
  `]
})
export class BudgetIndicatorComponent {
  @Input() budget = 0;
  @Input() spent = 0;
  @Input() status: BudgetStatus = 'green';

  Math = Math;

  get remaining(): number {
    return this.budget - this.spent;
  }

  get percentUsed(): number {
    return this.budget > 0 ? (this.spent / this.budget) * 100 : 0;
  }
}
