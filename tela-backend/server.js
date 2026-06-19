import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorMiddleware.js';
import { verifyEmailConfig } from './utils/sendEmail.js';
import { getClientUrl } from './config/clientUrl.js';
import { uploadsDir } from './utils/uploadMiddleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

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

// Local file uploads (used when Cloudinary is not configured)
app.use('/uploads', express.static(uploadsDir));

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
  console.log(`Email links use CLIENT_URL: ${getClientUrl()}`);
});

export default app;
