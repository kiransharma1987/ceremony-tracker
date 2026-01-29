import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router: Router = Router();

// Get all contributions for a product
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const productId = req.query.productId as string || req.user?.productId;
    
    if (!productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const contributions = await prisma.contribution.findMany({
      where: { productId },
      orderBy: { date: 'desc' }
    });

    res.json(contributions.map(c => ({
      ...c,
      amount: Number(c.amount)
    })));
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({ error: 'Failed to get contributions' });
  }
});

// Get contribution by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const contribution = await prisma.contribution.findUnique({
      where: { id: req.params.id }
    });

    if (!contribution || contribution.productId !== req.user.productId) {
      return res.status(404).json({ error: 'Contribution not found' });
    }

    res.json({
      ...contribution,
      amount: Number(contribution.amount)
    });
  } catch (error) {
    console.error('Get contribution error:', error);
    res.status(500).json({ error: 'Failed to get contribution' });
  }
});

// Create contribution (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const { contributorName, relationship, amount, date, notes } = req.body;

    if (!contributorName || !relationship || !amount || !date) {
      return res.status(400).json({ error: 'Contributor name, relationship, amount, and date are required' });
    }

    const contribution = await prisma.contribution.create({
      data: {
        contributorName,
        relationship,
        amount,
        date: new Date(date),
        notes: notes || null,
        productId: req.user.productId
      }
    });

    res.status(201).json({
      ...contribution,
      amount: Number(contribution.amount)
    });
  } catch (error) {
    console.error('Create contribution error:', error);
    res.status(500).json({ error: 'Failed to create contribution' });
  }
});

// Update contribution (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.productId) {
      return res.status(403).json({ error: 'Product context required' });
    }

    const { contributorName, relationship, amount, date, notes } = req.body;

    const contribution = await prisma.contribution.update({
      where: { id: req.params.id },
      data: {
        contributorName,
        relationship,
        amount,
        date: date ? new Date(date) : undefined,
        notes
      }
    });

    res.json({
      ...contribution,
      amount: Number(contribution.amount)
    });
  } catch (error) {
    console.error('Update contribution error:', error);
    res.status(500).json({ error: 'Failed to update contribution' });
  }
});

// Delete contribution (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.contribution.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Contribution deleted successfully' });
  } catch (error) {
    console.error('Delete contribution error:', error);
    res.status(500).json({ error: 'Failed to delete contribution' });
  }
});

// Get contributions summary
router.get('/summary/total', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contributions = await prisma.contribution.findMany();
    
    const total = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
    
    const byRelationship = new Map<string, number>();
    contributions.forEach(c => {
      const current = byRelationship.get(c.relationship) || 0;
      byRelationship.set(c.relationship, current + Number(c.amount));
    });

    res.json({
      total,
      count: contributions.length,
      byRelationship: Array.from(byRelationship.entries()).map(([relationship, amount]) => ({
        relationship,
        amount
      }))
    });
  } catch (error) {
    console.error('Get contributions summary error:', error);
    res.status(500).json({ error: 'Failed to get contributions summary' });
  }
});

export default router;
