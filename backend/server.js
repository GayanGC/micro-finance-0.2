import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import repaymentRoutes from './routes/repaymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import registerRoutes from './routes/registerRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev flexibility
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection middleware for Serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/registers', registerRoutes);

// Health check endpoint (legacy + new)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'Microfinance Management API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Microfinance Management API Server v2.0 is running...');
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler (catches unhandled errors from async routes)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('🔴 [Global Error Handler]:', err.stack || err.message);
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5050;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 [Server Running]: Microfinance Backend API v2.0 on port ${PORT}`);
    console.log(`📊 [Routes]: Auth | Employees | Customers | Policies | Loans | Repayments | Notifications | Audit | System | Holidays | Reports | Accounting | Dashboard | Registers`);
  });
}

export default app;

