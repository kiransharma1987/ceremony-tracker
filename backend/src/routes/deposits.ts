import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router: Router = Router();

// Get all deposits for a product
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const deposits = await prisma.deposit.findMany({
      where: { productId: req.user.productId },
      orderBy: { date: 'desc' }
    });

    res.json(deposits.map(d => ({
      ...d,
      amount: Number(d.amount)
    })));
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({ error: 'Failed to get deposits' });
  }
});

// Get deposits summary by brother
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const deposits = await prisma.deposit.findMany({
      where: { productId: req.user.productId }
    });
    
    const summary = {
      HNK: 0,
      HNP: 0,
      HNS: 0,
      HNM: 0,
      total: 0
    };

    deposits.forEach(d => {
      const amount = Number(d.amount);
      summary[d.depositedBy as keyof typeof summary] = 
        (summary[d.depositedBy as keyof typeof summary] || 0) + amount;
      summary.total += amount;
    });

    res.json(summary);
  } catch (error) {
    console.error('Get deposits summary error:', error);
    res.status(500).json({ error: 'Failed to get deposits summary' });
  }
});

// Create deposit (admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const { depositedBy, amount, date, notes } = req.body;

    if (!depositedBy || !amount || !date) {
      return res.status(400).json({ error: 'Deposited by, amount, and date are required' });
    }

    const validBrothers = ['HNK', 'HNP', 'HNS', 'HNM'];
    if (!validBrothers.includes(depositedBy)) {
      return res.status(400).json({ error: 'Invalid brother ID' });
    }

    const deposit = await prisma.deposit.create({
      data: {
        depositedBy,
        amount,
        date: new Date(date),
        notes: notes || null,
        productId: req.user.productId
      }
    });

    res.status(201).json({
      ...deposit,
      amount: Number(deposit.amount)
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ error: 'Failed to create deposit' });
  }
});

// Update deposit (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { depositedBy, amount, date, notes } = req.body;

    const existing = await prisma.deposit.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    if (depositedBy) {
      const validBrothers = ['HNK', 'HNP', 'HNS', 'HNM'];
      if (!validBrothers.includes(depositedBy)) {
        return res.status(400).json({ error: 'Invalid brother ID' });
      }
    }

    const deposit = await prisma.deposit.update({
      where: { id },
      data: {
        depositedBy: depositedBy || existing.depositedBy,
        amount: amount ?? existing.amount,
        date: date ? new Date(date) : existing.date,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    res.json({
      ...deposit,
      amount: Number(deposit.amount)
    });
  } catch (error) {
    console.error('Update deposit error:', error);
    res.status(500).json({ error: 'Failed to update deposit' });
  }
});

// Delete deposit (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.deposit.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    await prisma.deposit.delete({ where: { id } });
    res.json({ message: 'Deposit deleted successfully' });
  } catch (error) {
    console.error('Delete deposit error:', error);
    res.status(500).json({ error: 'Failed to delete deposit' });
  }
});

export default router;
