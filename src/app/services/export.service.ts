import { Injectable } from '@angular/core';
import { ExpenseService } from './expense.service';
import { ContributionService } from './contribution.service';
import { SettlementService } from './settlement.service';
import { EXPENSE_CATEGORIES, BROTHERS } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  constructor(
    private expenseService: ExpenseService,
    private contributionService: ContributionService,
    private settlementService: SettlementService
  ) {}

  // Export expenses to CSV
  exportExpensesToCSV(): void {
    const expenses = this.expenseService.allExpenses();
    
    const headers = ['Date', 'Title', 'Category', 'Amount', 'Paid By', 'Notes'];
    const rows = expenses.map(exp => [
      this.formatDate(exp.date),
      exp.title,
      exp.category,
      exp.amount.toFixed(2),
      exp.paidBy,
      exp.notes || ''
    ]);
    
    this.downloadCSV([headers, ...rows], 'expenses.csv');
  }

  // Export contributions to CSV
  exportContributionsToCSV(): void {
    const contributions = this.contributionService.allContributions();
    
    const headers = ['Date', 'Contributor', 'Relationship', 'Amount', 'Notes'];
    const rows = contributions.map(contrib => [
      this.formatDate(contrib.date),
      contrib.contributorName,
      contrib.relationship,
      contrib.amount.toFixed(2),
      contrib.notes || ''
    ]);
    
    this.downloadCSV([headers, ...rows], 'contributions.csv');
  }

  // Export settlement summary to CSV
  exportSettlementToCSV(): void {
    const summary = this.settlementService.financialSummary();
    
    const summaryData = [
      ['Financial Summary'],
      ['Total Expenses', summary.totalExpenses.toFixed(2)],
      ['Total Contributions', summary.totalContributions.toFixed(2)],
      ['Net Expense', summary.netExpense.toFixed(2)],
      ['Share Per Brother', summary.sharePerBrother.toFixed(2)],
      [''],
      ['Brother Settlement'],
      ['Brother', 'Paid', 'Share', 'Balance'],
      ...summary.brotherSettlements.map(bs => [
        bs.name,
        bs.paid.toFixed(2),
        bs.share.toFixed(2),
        bs.balance.toFixed(2)
      ]),
      [''],
      ['Settlement Instructions'],
      ['From', 'To', 'Amount'],
      ...summary.settlementInstructions.map(si => [
        si.from,
        si.to,
        si.amount.toFixed(2)
      ])
    ];
    
    this.downloadCSV(summaryData, 'settlement_summary.csv');
  }

  // Export full report to CSV
  exportFullReportToCSV(): void {
    const expenses = this.expenseService.allExpenses();
    const contributions = this.contributionService.allContributions();
    const summary = this.settlementService.financialSummary();
    const categorySummary = this.expenseService.categorySummary();
    
    const data = [
      ['CEREMONY EXPENSE TRACKER - FULL REPORT'],
      ['Generated on', new Date().toLocaleString()],
      [''],
      ['=== FINANCIAL SUMMARY ==='],
      ['Total Expenses', `₹${summary.totalExpenses.toFixed(2)}`],
      ['Total Contributions', `₹${summary.totalContributions.toFixed(2)}`],
      ['Net Expense', `₹${summary.netExpense.toFixed(2)}`],
      ['Share Per Brother', `₹${summary.sharePerBrother.toFixed(2)}`],
      [''],
      ['=== CATEGORY-WISE BREAKDOWN ==='],
      ['Category', 'Amount', 'Count', 'Percentage'],
      ...categorySummary.map(cs => [
        cs.category,
        `₹${cs.totalAmount.toFixed(2)}`,
        cs.expenseCount.toString(),
        `${cs.percentage.toFixed(1)}%`
      ]),
      [''],
      ['=== BROTHER SETTLEMENT ==='],
      ['Brother', 'Paid', 'Share', 'Balance', 'Status'],
      ...summary.brotherSettlements.map(bs => [
        bs.name,
        `₹${bs.paid.toFixed(2)}`,
        `₹${bs.share.toFixed(2)}`,
        `₹${bs.balance.toFixed(2)}`,
        bs.balance > 0 ? 'To Pay' : bs.balance < 0 ? 'To Receive' : 'Settled'
      ]),
      [''],
      ['=== SETTLEMENT INSTRUCTIONS ==='],
      ...summary.settlementInstructions.map(si => [
        `${si.from} pays ₹${si.amount.toFixed(2)} to ${si.to}`
      ]),
      [''],
      ['=== ALL EXPENSES ==='],
      ['Date', 'Title', 'Category', 'Amount', 'Paid By', 'Notes'],
      ...expenses.map(exp => [
        this.formatDate(exp.date),
        exp.title,
        exp.category,
        `₹${exp.amount.toFixed(2)}`,
        exp.paidBy,
        exp.notes || ''
      ]),
      [''],
      ['=== ALL CONTRIBUTIONS ==='],
      ['Date', 'Contributor', 'Relationship', 'Amount', 'Notes'],
      ...contributions.map(c => [
        this.formatDate(c.date),
        c.contributorName,
        c.relationship,
        `₹${c.amount.toFixed(2)}`,
        c.notes || ''
      ])
    ];
    
    this.downloadCSV(data, 'full_report.csv');
  }

  // Generate PDF report
  async exportToPDF(): Promise<void> {
    // Dynamic import for jsPDF - using any to bypass type checking
    // @ts-ignore
    const jspdfModule = await import('jspdf');
    const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
    // @ts-ignore
    await import('jspdf-autotable');
    
    const doc = new jsPDF() as any;
    const summary = this.settlementService.financialSummary();
    const categorySummary = this.expenseService.categorySummary();
    const expenses = this.expenseService.allExpenses();
    const contributions = this.contributionService.allContributions();
    
    let yPos = 20;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Ceremony Expense Report', 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Financial Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryLines = [
      `Total Expenses: ₹${summary.totalExpenses.toFixed(2)}`,
      `Total Contributions: ₹${summary.totalContributions.toFixed(2)}`,
      `Net Expense: ₹${summary.netExpense.toFixed(2)}`,
      `Share Per Brother: ₹${summary.sharePerBrother.toFixed(2)}`
    ];
    summaryLines.forEach(line => {
      doc.text(line, 14, yPos);
      yPos += 6;
    });
    yPos += 5;
    
    // Brother Settlement Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Brother Settlement', 14, yPos);
    yPos += 5;
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Brother', 'Paid', 'Share', 'Balance', 'Status']],
      body: summary.brotherSettlements.map(bs => [
        bs.name,
        `₹${bs.paid.toFixed(2)}`,
        `₹${bs.share.toFixed(2)}`,
        `₹${bs.balance.toFixed(2)}`,
        bs.balance > 0 ? 'To Pay' : bs.balance < 0 ? 'To Receive' : 'Settled'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [93, 109, 126] }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Settlement Instructions
    if (summary.settlementInstructions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Settlement Instructions', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      summary.settlementInstructions.forEach(si => {
        doc.text(`• ${si.from} pays ₹${si.amount.toFixed(2)} to ${si.to}`, 14, yPos);
        yPos += 6;
      });
    }
    
    // Add new page for detailed expenses
    doc.addPage();
    yPos = 20;
    
    // Category Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Category-wise Expenses', 14, yPos);
    yPos += 5;
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Category', 'Amount', 'Count', '%']],
      body: categorySummary.map(cs => [
        cs.category,
        `₹${cs.totalAmount.toFixed(2)}`,
        cs.expenseCount,
        `${cs.percentage.toFixed(1)}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [93, 109, 126] }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Contributions
    if (contributions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Contributions', 14, yPos);
      yPos += 5;
      
      (doc as any).autoTable({
        startY: yPos,
        head: [['Date', 'Contributor', 'Relationship', 'Amount']],
        body: contributions.map(c => [
          this.formatDate(c.date),
          c.contributorName,
          c.relationship,
          `₹${c.amount.toFixed(2)}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [93, 109, 126] }
      });
    }
    
    // Save PDF
    doc.save('ceremony_expense_report.pdf');
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private downloadCSV(data: (string | number)[][], filename: string): void {
    const csvContent = data
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
