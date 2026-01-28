import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router: Router = Router();

// Get all expenses (filtered by product)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.query.productId as string;
    
    // If no productId provided, use user's product
    const filter: any = {};
    if (productId) {
      filter.productId = productId;
    } else if (req.user?.productId) {
      filter.productId = req.user.productId;
    }

    const expenses = await prisma.expense.findMany({
      where: filter,
      orderBy: { date: 'desc' }
    });

    res.json(expenses.map(exp => ({
      ...exp,
      amount: Number(exp.amount)
    })));
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({
      ...expense,
      amount: Number(expense.amount)
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to get expense' });
  }
});

// Create expense (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, amount, paidBy, date, notes, productId } = req.body;

    if (!title || !category || !amount || !paidBy || !date) {
      return res.status(400).json({ error: 'Title, category, amount, paidBy, and date are required' });
    }

    // Use provided productId or user's product
    const finalProductId = productId || req.user?.productId;
    if (!finalProductId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        category,
        amount,
        paidBy,
        date: new Date(date),
        notes: notes || null,
        productId: finalProductId
      }
    });

    res.status(201).json({
      ...expense,
      amount: Number(expense.amount)
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, amount, paidBy, date, notes } = req.body;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        title,
        category,
        amount,
        paidBy,
        date: date ? new Date(date) : undefined,
        notes
      }
    });

    res.json({
      ...expense,
      amount: Number(expense.amount)
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.expense.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get expenses summary by category (filtered by product)
router.get('/summary/by-category', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.query.productId as string || req.user?.productId;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const expenses = await prisma.expense.findMany({
      where: { productId }
    });
    
    const categoryMap = new Map<string, { total: number; count: number }>();
    let grandTotal = 0;

    expenses.forEach(exp => {
      const amount = Number(exp.amount);
      grandTotal += amount;
      const current = categoryMap.get(exp.category) || { total: 0, count: 0 };
      categoryMap.set(exp.category, {
        total: current.total + amount,
        count: current.count + 1
      });
    });

    const summary = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalAmount: data.total,
      expenseCount: data.count,
      percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0
    }));

    res.json(summary);
  } catch (error) {
    console.error('Get category summary error:', error);
    res.status(500).json({ error: 'Failed to get category summary' });
  }
});

// Get expenses summary by brother (filtered by product)
router.get('/summary/by-brother', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.query.productId as string || req.user?.productId;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const expenses = await prisma.expense.findMany({
      where: { productId }
    });
    
    const brotherMap = new Map<string, number>();
    ['HNK', 'HNP', 'HNS', 'HNM'].forEach(id => brotherMap.set(id, 0));

    expenses.forEach(exp => {
      const current = brotherMap.get(exp.paidBy) || 0;
      brotherMap.set(exp.paidBy, current + Number(exp.amount));
    });

    const summary = Array.from(brotherMap.entries()).map(([brotherId, total]) => ({
      brotherId,
      totalPaid: total
    }));

    res.json(summary);
  } catch (error) {
    console.error('Get brother summary error:', error);
    res.status(500).json({ error: 'Failed to get brother summary' });
  }
});

export default router;
