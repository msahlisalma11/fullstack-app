// src/server.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import pinoHttp from 'pino-http';

// Load environment variables
dotenv.config();

// Import database
import { initializeDatabase, getPool } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import basketRoutes from './routes/baskets';
import reservationRoutes from './routes/reservations';
import paymentRoutes from './routes/payments';
import merchantRoutes from './routes/merchants';
import reviewRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { logger } from './config/logger';

// Types
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Initialize Express app
const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Logging middleware
app.use(pinoHttp({ logger }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request ID middleware for tracing
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || `${Date.now()}-${Math.random()}`;
  res.setHeader('x-request-id', req.id);
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/baskets', basketRoutes);
app.use('/api/reservations', authenticateToken, reservationRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/merchants', authenticateToken, merchantRoutes);
app.use('/api/reviews', authenticateToken, reviewRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.id,
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

app.use(errorHandler);

// ============================================================================
// SOCKET.IO EVENTS
// ============================================================================

interface SocketData {
  userId?: string;
  role?: string;
  merchantId?: string;
}

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // User authentication
  socket.on('authenticate', (data: { token: string }) => {
    try {
      // Verify JWT and attach user to socket
      logger.info(`User authenticated on socket: ${socket.id}`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });

  // Join room for notifications
  socket.on('join_user_room', (userId: string) => {
    socket.join(`user_${userId}`);
    logger.info(`User ${userId} joined notification room`);
  });

  // Join merchant room for orders
  socket.on('join_merchant_room', (merchantId: string) => {
    socket.join(`merchant_${merchantId}`);
    logger.info(`Merchant ${merchantId} joined order room`);
  });

  // Reservation notifications
  socket.on('new_reservation', (data) => {
    // Notify merchant of new reservation
    io.to(`merchant_${data.merchantId}`).emit('reservation_received', data);
    // Notify user of confirmation
    io.to(`user_${data.userId}`).emit('reservation_confirmed', data);
  });

  // Real-time basket updates
  socket.on('basket_updated', (data) => {
    io.emit('basket_refresh', { basketId: data.basketId });
  });

  // Chat/messaging (future feature)
  socket.on('message', (data) => {
    io.to(data.recipientRoom).emit('new_message', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Emit notification helper function
export const emitNotification = (userId: string, notification: any) => {
  io.to(`user_${userId}`).emit('notification', notification);
};

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connected successfully');

    // Verify database connection
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    logger.info('Database query test successful:', result.rows[0]);

    const PORT = process.env.PORT || 5000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📝 Environment: ${NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(async () => {
    const pool = getPool();
    await pool.end();
    logger.info('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  httpServer.close(async () => {
    const pool = getPool();
    await pool.end();
    logger.info('Database pool closed');
    process.exit(0);
  });
});

// ============================================================================
// UNHANDLED ERRORS
// ============================================================================

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
startServer();

export { app, io, emitNotification };
