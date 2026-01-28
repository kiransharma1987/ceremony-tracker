import { Router, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router: Router = Router();

// ===== CREATE PRODUCT (Super Admin Only) =====
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Only Super Admin can create products',
        code: 'UNAUTHORIZED'
      });
    }

    const { name, type, description, currency, overallBudget } = req.body;

    if (!name || !type) {
      return res.status(400).json({ 
        error: 'Product name and type required',
        code: 'MISSING_FIELDS'
      });
    }

    const validTypes = ['CEREMONY', 'WEDDING', 'TEAM_DINNER', 'SHARED_APARTMENT', 'TRIP'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid product type',
        code: 'INVALID_TYPE'
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        type,
        description: description || null,
        currency: currency || '₹',
        overallBudget: overallBudget || 0,
        isClosed: false
      }
    });

    res.status(201).json({ product });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      code: 'CREATE_ERROR'
    });
  }
});

// ===== GET ALL PRODUCTS (Super Admin) or User's Product (Other roles) =====
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let products;

    if (req.user?.role === 'SUPER_ADMIN') {
      // Super Admin sees all products
      products = await prisma.product.findMany({
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user?.productId) {
      // Other users see only their product
      products = await prisma.product.findMany({
        where: { id: req.user.productId },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      });
    } else {
      return res.json({ products: [] });
    }

    // Add counts for each product
    const productsWithCounts = await Promise.all(
      products.map(async (product) => {
        const counts = await prisma.product.findUnique({
          where: { id: product.id },
          select: {
            _count: {
              select: {
                expenses: true,
                contributions: true,
                deposits: true
              }
            }
          }
        });

        return {
          id: product.id,
          name: product.name,
          type: product.type,
          description: product.description,
          currency: product.currency,
          overallBudget: product.overallBudget,
          isClosed: product.isClosed,
          createdAt: product.createdAt,
          userCount: product.users?.length || 0,
          expenseCount: counts?._count?.expenses || 0,
          depositCount: counts?._count?.deposits || 0,
          contributionCount: counts?._count?.contributions || 0
        };
      })
    );

    res.json({ products: productsWithCounts });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      code: 'FETCH_ERROR'
    });
  }
});

// ===== GET SINGLE PRODUCT =====
router.get('/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    // Check authorization - user can only see their product
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.productId !== productId) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
            role: true,
            isActive: true
          }
        },
        expenses: {
          select: { id: true }
        },
        contributions: {
          select: { id: true }
        },
        deposits: {
          select: { id: true }
        },
        budgets: {
          select: { id: true, category: true, amount: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      code: 'FETCH_ERROR'
    });
  }
});

// ===== UPDATE PRODUCT (Super Admin Only) =====
router.put('/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Only Super Admin can update products',
        code: 'UNAUTHORIZED'
      });
    }

    const { productId } = req.params;
    const { name, description, currency, overallBudget, isClosed } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (currency) updateData.currency = currency;
    if (overallBudget !== undefined) updateData.overallBudget = overallBudget;
    if (isClosed !== undefined) {
      updateData.isClosed = isClosed;
      if (isClosed && !updateData.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json({ product });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      error: 'Failed to update product',
      code: 'UPDATE_ERROR'
    });
  }
});

// ===== DELETE PRODUCT (Super Admin Only) =====
router.delete('/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Only Super Admin can delete products',
        code: 'UNAUTHORIZED'
      });
    }

    const { productId } = req.params;

    // This will cascade delete all related data
    await prisma.product.delete({
      where: { id: productId }
    });

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      code: 'DELETE_ERROR'
    });
  }
});

export default router;
