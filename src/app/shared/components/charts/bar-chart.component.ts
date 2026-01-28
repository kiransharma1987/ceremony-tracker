import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface BarChartDataItem {
  label: string;
  budget: number;
  actual: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3 class="chart-title" *ngIf="title">{{ title }}</h3>
      <div class="chart-wrapper">
        <canvas #chartCanvas></canvas>
      </div>
      <div class="no-data" *ngIf="!hasData">
        <span>📊</span>
        <p>No budget data available</p>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .chart-title {
      font-size: 1rem;
      color: #2c3e50;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }
    
    .chart-wrapper {
      position: relative;
      min-height: 250px;
    }
    
    .no-data {
      text-align: center;
      padding: 2rem;
      color: #95a5a6;
    }
    
    .no-data span {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .no-data p {
      margin: 0;
    }
  `]
})
export class BarChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() title = '';
  @Input() data: BarChartDataItem[] = [];
  
  private chart: Chart | null = null;
  hasData = false;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chartCanvas) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    if (!this.chartCanvas) return;
    
    const filteredData = this.data.filter(d => d.budget > 0 || d.actual > 0);
    this.hasData = filteredData.length > 0;
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    if (!this.hasData) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: filteredData.map(d => d.label),
        datasets: [
          {
            label: 'Budget',
            data: filteredData.map(d => d.budget),
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderColor: '#3498db',
            borderWidth: 1
          },
          {
            label: 'Actual',
            data: filteredData.map(d => d.actual),
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
            borderColor: '#e74c3c',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const yValue = context.parsed.y ?? 0;
                return `${context.dataset.label}: ₹${yValue.toLocaleString('en-IN')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { 
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `₹${Number(value).toLocaleString('en-IN')}`
            }
          }
        }
      }
    };
    
    this.chart = new Chart(ctx, config);
  }
}
