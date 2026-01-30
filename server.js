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

// Helmet for security headers
app.use(helmet());

// Trust Vercel (or other reverse proxies) for rate limiting and IP detection
const trustProxy = process.env.NODE_ENV === 'production' ? 1 : 0;
app.set('trust proxy', trustProxy);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://front-baysawaar.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow Postman, server-to-server
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // max requests per IP
  standardHeaders: true,    // Return rate limit info in headers
  legacyHeaders: false,     // Disable old X-RateLimit headers
});

app.use('/api/', apiLimiter);

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Increase timeout for long uploads
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
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
