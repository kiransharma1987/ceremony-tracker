import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router: Router = Router();

// Get all budgets
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const budgets = await prisma.budget.findMany();

    res.json(budgets.map(b => ({
      ...b,
      amount: Number(b.amount)
    })));
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to get budgets' });
  }
});

// Set category budget (Admin only)
router.post('/category', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { category, amount } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const budget = await prisma.budget.upsert({
      where: { category },
      update: { amount },
      create: { category, amount }
    });

    res.json({
      ...budget,
      amount: Number(budget.amount)
    });
  } catch (error) {
    console.error('Set category budget error:', error);
    res.status(500).json({ error: 'Failed to set category budget' });
  }
});

// Delete category budget (Admin only)
router.delete('/category/:category', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.budget.delete({
      where: { category: req.params.category }
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Get app settings
router.get('/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'app_settings' }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          id: 'app_settings',
          overallBudget: 0,
          isClosed: false
        }
      });
    }

    res.json({
      ...settings,
      overallBudget: Number(settings.overallBudget)
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update overall budget (Admin only)
router.put('/settings/overall', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'app_settings' },
      update: { overallBudget: amount },
      create: {
        id: 'app_settings',
        overallBudget: amount,
        isClosed: false
      }
    });

    res.json({
      ...settings,
      overallBudget: Number(settings.overallBudget)
    });
  } catch (error) {
    console.error('Update overall budget error:', error);
    res.status(500).json({ error: 'Failed to update overall budget' });
  }
});

// Close ceremony (Admin only)
router.put('/settings/close', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 'app_settings' },
      update: { 
        isClosed: true,
        closedAt: new Date()
      },
      create: {
        id: 'app_settings',
        overallBudget: 0,
        isClosed: true,
        closedAt: new Date()
      }
    });

    res.json({
      ...settings,
      overallBudget: Number(settings.overallBudget)
    });
  } catch (error) {
    console.error('Close ceremony error:', error);
    res.status(500).json({ error: 'Failed to close ceremony' });
  }
});

// Reopen ceremony (Admin only)
router.put('/settings/reopen', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.settings.update({
      where: { id: 'app_settings' },
      data: { 
        isClosed: false,
        closedAt: null
      }
    });

    res.json({
      ...settings,
      overallBudget: Number(settings.overallBudget)
    });
  } catch (error) {
    console.error('Reopen ceremony error:', error);
    res.status(500).json({ error: 'Failed to reopen ceremony' });
  }
});

export default router;
