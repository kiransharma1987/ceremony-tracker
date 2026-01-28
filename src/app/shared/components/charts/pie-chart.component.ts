import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-pie-chart',
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
        <p>No data available</p>
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
      max-width: 300px;
      margin: 0 auto;
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
export class PieChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() title = '';
  @Input() data: ChartDataItem[] = [];
  
  private chart: Chart | null = null;
  hasData = false;

  private defaultColors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
  ];

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
    
    const filteredData = this.data.filter(d => d.value > 0);
    this.hasData = filteredData.length > 0;
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    if (!this.hasData) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: filteredData.map(d => d.label),
        datasets: [{
          data: filteredData.map(d => d.value),
          backgroundColor: filteredData.map((d, i) => d.color || this.defaultColors[i % this.defaultColors.length]),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const data = context.dataset.data as number[];
                const total = data.reduce((a, b) => a + (b || 0), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `₹${value.toLocaleString('en-IN')} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    this.chart = new Chart(ctx, config);
  }
}
