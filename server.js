import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import blogRoutes from './routes/blogs.js';
import contactRoutes from './routes/contacts.js';
import enrollmentRoutes from './routes/enrollments.js';
import dashboardRoutes from './routes/dashboard.js';
import socialRoutes from './routes/social.js';
import adminRoutes from './routes/admin.js';
import formationRoutes from './routes/formations.js';
import eventRoutes from './routes/event.js';

// Middleware
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

/* =======================
   SECURITY & MIDDLEWARE
======================= */

app.use(helmet());

// ✅ REQUIRED for Vercel + rate-limit
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ✅ Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://front-baysawaar.vercel.app',
];

// ✅ SAFE CORS CONFIG (NO THROWING)
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, Postman, Vercel internal
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 🚨 DO NOT THROW
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Handle preflight
app.options('*', cors());

// ✅ Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Upload timeout
app.use((req, res, next) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  next();
});

/* =======================
   ROUTES
======================= */

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/events', eventRoutes);

/* =======================
   ERROR HANDLER
======================= */

app.use(errorHandler);

/* =======================
   DATABASE
======================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

/* =======================
   SERVER
======================= */

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
