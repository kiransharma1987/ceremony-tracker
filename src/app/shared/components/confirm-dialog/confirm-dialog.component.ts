import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="isOpen" (click)="onCancel()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <span class="dialog-icon" [class]="type">
            {{ type === 'danger' ? '⚠️' : type === 'warning' ? '❓' : 'ℹ️' }}
          </span>
          <h3 class="dialog-title">{{ title }}</h3>
        </div>
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" (click)="onCancel()">{{ cancelText }}</button>
          <button class="btn" [class]="'btn-' + type" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .dialog {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      animation: slideIn 0.2s ease;
    }
    
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .dialog-icon {
      font-size: 1.5rem;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 1.1rem;
      color: #2c3e50;
    }
    
    .dialog-message {
      color: #7f8c8d;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }
    
    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }
    
    .btn {
      padding: 0.6rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .btn-secondary {
      background: #ecf0f1;
      color: #7f8c8d;
    }
    
    .btn-secondary:hover {
      background: #dfe6e9;
    }
    
    .btn-danger {
      background: #e74c3c;
      color: white;
    }
    
    .btn-danger:hover {
      background: #c0392b;
    }
    
    .btn-warning {
      background: #f39c12;
      color: white;
    }
    
    .btn-warning:hover {
      background: #d68910;
    }
    
    .btn-info {
      background: #3498db;
      color: white;
    }
    
    .btn-info:hover {
      background: #2980b9;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() type: 'danger' | 'warning' | 'info' = 'warning';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
