import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import walletsRoutes from './modules/wallets/wallets.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import tradingRoutes from './modules/trading/trading.routes';
import swapRoutes from './modules/swap/swap.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import supportRoutes from './modules/support/support.routes';
import adminRoutes from './modules/admin/admin.routes';
import pricesRoutes from './modules/prices/prices.routes';

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time updates
export const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
  },
});

// =====================
// Middleware
// =====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(generalRateLimiter);

// Static files (KYC uploads)
app.use('/uploads', express.static(config.uploadDir));

// =====================
// Routes API
// =====================
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/wallets`, walletsRoutes);
app.use(`${API_PREFIX}/transactions`, transactionsRoutes);
app.use(`${API_PREFIX}/trading`, tradingRoutes);
app.use(`${API_PREFIX}/swap`, swapRoutes);
app.use(`${API_PREFIX}/payments`, paymentsRoutes);
app.use(`${API_PREFIX}/kyc`, kycRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/support`, supportRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/prices`, pricesRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// =====================
// Socket.IO
// =====================
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_room', (userId: string) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// =====================
// Start Server
// =====================
const PORT = config.port;
httpServer.listen(PORT, () => {
  logger.info(`🚀 CryptoXchange API running on port ${PORT}`);
  logger.info(`📚 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Frontend URL: ${config.frontendUrl}`);
});

export default app;
