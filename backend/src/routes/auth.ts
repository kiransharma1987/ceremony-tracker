import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router: Router = Router();

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    displayName?: string;
    role: string;
    productId?: string;
    brotherId?: string;
    productName?: string;
  };
  redirectUrl: string;
}

// ===== GENERIC LOGIN (Email + Password) =====
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email (case-insensitive)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account has been deactivated',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token with user role and product context
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        productId: user.productId
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Determine redirect URL based on role
    let redirectUrl = '/login'; // fallback
    switch (user.role) {
      case 'SUPER_ADMIN':
        redirectUrl = '/super-admin';
        break;
      case 'ADMIN':
        redirectUrl = '/admin';
        break;
      case 'ORGANIZER':
        redirectUrl = '/organizer';
        break;
      case 'ATTENDEE':
        redirectUrl = '/attendee';
        break;
      case 'SPONSOR':
        redirectUrl = '/sponsor';
        break;
    }

    // Return login response
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName || user.name,
        role: user.role,
        productId: user.productId,
        productName: user.product?.name // for display
      },
      redirectUrl
    } as LoginResponse);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// ===== CREATE USER (Super Admin Only) =====
router.post('/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Only SUPER_ADMIN can create users
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Only Super Admin can create users',
        code: 'UNAUTHORIZED'
      });
    }

    const { email, password, name, role, productId, displayName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate role
    const validRoles = ['ADMIN', 'ORGANIZER', 'ATTENDEE', 'SPONSOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be one of: ' + validRoles.join(', '),
        code: 'INVALID_ROLE'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        productId: productId || null,
        displayName: displayName || null,
        isActive: true
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        displayName: newUser.displayName,
        role: newUser.role,
        productId: newUser.productId,
        isActive: newUser.isActive,
        productName: newUser.product?.name
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      code: 'USER_CREATE_ERROR'
    });
  }
});

// ===== GET ALL USERS (Super Admin Only) =====
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    console.log('GET /users endpoint called');
    
    // Test with hardcoded response first
    return res.json({ 
      users: [],
      message: 'Test endpoint working'
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// ===== UPDATE USER (Super Admin or Self) =====
router.put('/users/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, displayName, role, productId, isActive } = req.body;

    // Only SUPER_ADMIN or the user themselves
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.id !== userId) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    // Super Admin can change anything, user can only change own name/display
    const updateData: any = {};

    if (req.user?.role === 'SUPER_ADMIN') {
      if (name) updateData.name = name;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (role) updateData.role = role;
      if (productId !== undefined) updateData.productId = productId;
      if (isActive !== undefined) updateData.isActive = isActive;
    } else {
      // User can only update their own display name
      if (name) updateData.name = name;
      if (displayName) updateData.displayName = displayName;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        productId: updatedUser.productId,
        isActive: updatedUser.isActive,
        productName: updatedUser.product?.name
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      code: 'UPDATE_ERROR'
    });
  }
});

// ===== CHANGE PASSWORD (User themselves) =====
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current and new password required',
        code: 'MISSING_FIELDS'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

// ===== RESET PASSWORD (Super Admin Only) =====
router.post('/reset-password/:userId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Only Super Admin can reset passwords',
        code: 'UNAUTHORIZED'
      });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        error: 'New password required',
        code: 'MISSING_FIELDS'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password',
      code: 'RESET_ERROR'
    });
  }
});

// ===== GET CURRENT USER =====
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      role: user.role,
      productId: user.productId,
      isActive: user.isActive,
      productName: user.product?.name
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

