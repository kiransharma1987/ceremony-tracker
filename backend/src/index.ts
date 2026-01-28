import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './config/database';

// Import routes
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import expenseRoutes from './routes/expenses';
import contributionRoutes from './routes/contributions';
import budgetRoutes from './routes/budgets';
import settlementRoutes from './routes/settlement';
import depositRoutes from './routes/deposits';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:4200'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/settlement', settlementRoutes);
app.use('/api/deposits', depositRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
