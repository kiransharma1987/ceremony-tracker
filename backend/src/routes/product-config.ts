import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router: Router = Router();

// ===== GET PRODUCT CONFIGURATION (Super Admin or Product Admin) =====
router.get('/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    // Check authorization - super admin or admin of this product
    if (req.user?.role !== 'SUPER_ADMIN' && (req.user?.role !== 'ADMIN' || req.user?.productId !== productId)) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        currency: true,
        overallBudget: true,
        isClosed: true,
        enableDashboard: true,
        enableExpenses: true,
        enableContributions: true,
        enableDeposits: true,
        enableBudget: true,
        enableReports: true,
        enableSettlement: true
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({ config: product });

  } catch (error) {
    console.error('Get product config error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product configuration',
      code: 'FETCH_ERROR'
    });
  }
});

// ===== UPDATE PRODUCT CONFIGURATION (Super Admin Only) =====
router.put('/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Only Super Admin can update product configuration',
        code: 'UNAUTHORIZED'
      });
    }

    const { productId } = req.params;
    const { 
      enableDashboard, 
      enableExpenses, 
      enableContributions, 
      enableDeposits, 
      enableBudget, 
      enableReports, 
      enableSettlement 
    } = req.body;

    const updateData: any = {};
    if (enableDashboard !== undefined) updateData.enableDashboard = enableDashboard;
    if (enableExpenses !== undefined) updateData.enableExpenses = enableExpenses;
    if (enableContributions !== undefined) updateData.enableContributions = enableContributions;
    if (enableDeposits !== undefined) updateData.enableDeposits = enableDeposits;
    if (enableBudget !== undefined) updateData.enableBudget = enableBudget;
    if (enableReports !== undefined) updateData.enableReports = enableReports;
    if (enableSettlement !== undefined) updateData.enableSettlement = enableSettlement;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        currency: true,
        overallBudget: true,
        isClosed: true,
        enableDashboard: true,
        enableExpenses: true,
        enableContributions: true,
        enableDeposits: true,
        enableBudget: true,
        enableReports: true,
        enableSettlement: true
      }
    });

    res.json({ config: product });

  } catch (error) {
    console.error('Update product config error:', error);
    res.status(500).json({ 
      error: 'Failed to update product configuration',
      code: 'UPDATE_ERROR'
    });
  }
});

export default router;
