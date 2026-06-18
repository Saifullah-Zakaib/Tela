import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorMiddleware.js';
import { verifyEmailConfig } from './utils/sendEmail.js';

import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

connectDB();

const app = express();

// Verify email configuration
verifyEmailConfig();

// CORS
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Stripe webhook route (needs raw body)
app.use('/api/invoices/webhook', express.raw({ type: 'application/json' }));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/milestones', milestoneRoutes);
app.use('/api/projects/:projectId/feed', feedRoutes);
app.use('/api/projects/:projectId/files', fileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Tela API is running' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
