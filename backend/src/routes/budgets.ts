import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router: Router = Router();

// Get all budgets for a product
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const budgets = await prisma.budget.findMany({
      where: { productId: req.user.productId }
    });

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
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const { category, amount } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const budget = await prisma.budget.upsert({
      where: {
        productId_category: {
          productId: req.user.productId,
          category
        }
      },
      update: { amount },
      create: {
        category,
        amount,
        productId: req.user.productId
      }
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
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    await prisma.budget.delete({
      where: {
        productId_category: {
          productId: req.user.productId,
          category: req.params.category
        }
      }
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Get product settings (overall budget, closed status)
router.get('/settings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: req.user.productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      id: product.id,
      overallBudget: Number(product.overallBudget),
      isClosed: product.isClosed,
      closedAt: product.closedAt
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update overall budget (Admin only)
router.put('/settings/overall', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const { amount } = req.body;

    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const product = await prisma.product.update({
      where: { id: req.user.productId },
      data: { overallBudget: amount }
    });

    res.json({
      id: product.id,
      overallBudget: Number(product.overallBudget),
      isClosed: product.isClosed
    });
  } catch (error) {
    console.error('Update overall budget error:', error);
    res.status(500).json({ error: 'Failed to update overall budget' });
  }
});

// Close ceremony (Admin only)
router.put('/settings/close', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const product = await prisma.product.update({
      where: { id: req.user.productId },
      data: { 
        isClosed: true,
        closedAt: new Date()
      }
    });

    res.json({
      id: product.id,
      overallBudget: Number(product.overallBudget),
      isClosed: product.isClosed,
      closedAt: product.closedAt
    });
  } catch (error) {
    console.error('Close ceremony error:', error);
    res.status(500).json({ error: 'Failed to close ceremony' });
  }
});

// Reopen ceremony (Admin only)
router.put('/settings/reopen', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const product = await prisma.product.update({
      where: { id: req.user.productId },
      data: { 
        isClosed: false,
        closedAt: null
      }
    });

    res.json({
      id: product.id,
      overallBudget: Number(product.overallBudget),
      isClosed: product.isClosed
    });
  } catch (error) {
    console.error('Reopen ceremony error:', error);
    res.status(500).json({ error: 'Failed to reopen ceremony' });
  }
});

export default router;
