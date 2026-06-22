import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import technicianRoutes from './routes/technicianRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import User from './models/User.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Customer Service Ticket Management System API is running...');
});

// Seed admin user helper
const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('Seeding initial administrator user...');
      await User.create({
        name: 'System Admin',
        email: 'admin@service.com',
        password: 'Admin@123', // Will be hashed automatically by pre-save hook
        role: 'admin',
      });
      console.log('✅ Default administrator seeded: admin@service.com / Admin@123');
    } else {
      console.log('Database already contains an administrator.');
    }
  } catch (error) {
    console.error(`Admin user seeding failed: ${error.message}`);
  }
};

seedAdminUser();

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
