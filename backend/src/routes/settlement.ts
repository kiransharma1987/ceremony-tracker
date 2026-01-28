import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

interface BrotherSettlement {
  id: string;
  name: string;
  fullName: string;
  paid: number;
  share: number;
  balance: number;
}

interface SettlementInstruction {
  from: string;
  to: string;
  amount: number;
}

const BROTHERS = [
  { id: 'HNK', name: 'HNK', fullName: 'H N K (First Son)' },
  { id: 'HNP', name: 'HNP', fullName: 'H N P (Second Son)' },
  { id: 'HNS', name: 'HNS', fullName: 'H N S (Third Son)' },
  { id: 'HNM', name: 'HNM', fullName: 'H N M (Fourth Son)' }
];

// Get settlement summary
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Get all expenses
    const expenses = await prisma.expense.findMany();
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Get all contributions
    const contributions = await prisma.contribution.findMany();
    const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'app_settings' }
    });

    // Calculate net expense (after contributions)
    const netExpense = totalExpenses - totalContributions;
    const sharePerBrother = netExpense / 4;

    // Calculate what each brother paid
    const brotherPayments = new Map<string, number>();
    BROTHERS.forEach(b => brotherPayments.set(b.id, 0));
    
    expenses.forEach(exp => {
      const current = brotherPayments.get(exp.paidBy) || 0;
      brotherPayments.set(exp.paidBy, current + Number(exp.amount));
    });

    // Calculate settlements
    const brotherSettlements: BrotherSettlement[] = BROTHERS.map(brother => {
      const paid = brotherPayments.get(brother.id) || 0;
      const balance = sharePerBrother - paid; // Positive = needs to pay, Negative = should receive
      
      return {
        id: brother.id,
        name: brother.name,
        fullName: brother.fullName,
        paid,
        share: sharePerBrother,
        balance
      };
    });

    // Calculate settlement instructions (who pays whom)
    const settlementInstructions: SettlementInstruction[] = [];
    
    // Separate into debtors (need to pay) and creditors (should receive)
    const debtors = brotherSettlements
      .filter(b => b.balance > 0.01)
      .map(b => ({ ...b }))
      .sort((a, b) => b.balance - a.balance);
    
    const creditors = brotherSettlements
      .filter(b => b.balance < -0.01)
      .map(b => ({ ...b, balance: Math.abs(b.balance) }))
      .sort((a, b) => b.balance - a.balance);

    // Match debtors with creditors
    for (const debtor of debtors) {
      while (debtor.balance > 0.01) {
        const creditor = creditors.find(c => c.balance > 0.01);
        if (!creditor) break;

        const amount = Math.min(debtor.balance, creditor.balance);
        
        if (amount > 0.01) {
          settlementInstructions.push({
            from: debtor.name,
            to: creditor.name,
            amount: Math.round(amount * 100) / 100
          });
        }

        debtor.balance -= amount;
        creditor.balance -= amount;
      }
    }

    res.json({
      totalExpenses,
      totalContributions,
      netExpense,
      sharePerBrother,
      brotherSettlements,
      settlementInstructions,
      isClosed: settings?.isClosed || false,
      closedAt: settings?.closedAt || null
    });
  } catch (error) {
    console.error('Get settlement summary error:', error);
    res.status(500).json({ error: 'Failed to get settlement summary' });
  }
});

// Get brother-specific settlement details
router.get('/brother/:brotherId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { brotherId } = req.params;
    
    const brother = BROTHERS.find(b => b.id === brotherId);
    if (!brother) {
      return res.status(404).json({ error: 'Brother not found' });
    }

    // Get expenses paid by this brother
    const paidExpenses = await prisma.expense.findMany({
      where: { paidBy: brotherId },
      orderBy: { date: 'desc' }
    });

    // Get all expenses for total
    const allExpenses = await prisma.expense.findMany();
    const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Get contributions
    const contributions = await prisma.contribution.findMany();
    const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

    const netExpense = totalExpenses - totalContributions;
    const sharePerBrother = netExpense / 4;
    const totalPaid = paidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const balance = sharePerBrother - totalPaid;

    res.json({
      brother,
      totalPaid,
      share: sharePerBrother,
      balance,
      status: balance > 0.01 ? 'owes' : balance < -0.01 ? 'owed' : 'settled',
      paidExpenses: paidExpenses.map(e => ({
        ...e,
        amount: Number(e.amount)
      }))
    });
  } catch (error) {
    console.error('Get brother settlement error:', error);
    res.status(500).json({ error: 'Failed to get brother settlement' });
  }
});

export default router;
