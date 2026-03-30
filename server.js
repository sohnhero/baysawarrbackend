import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

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
import ensureDbConnected from './middlewares/ensureDbConnected.js';

dotenv.config();

const app = express();

/* =======================
   SECURITY & MIDDLEWARE
======================= */

// ✅ SAFE CORS CONFIG - MUST BE BEFORE HELMET
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://front-baysawaar.vercel.app',
  'https://baysaawaarr.vercel.app',
  'https://www.fabiratrading.com',
  'https://fabiratrading.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Exact match or ends with .fabiratrading.com
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                     origin.endsWith('.fabiratrading.com') ||
                     origin === 'https://fabiratrading.com';
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected origin: ${origin}`);
      callback(null, false); // Return false instead of Error to avoid 500 error page
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// ✅ Handle preflight correctly (if needed separately, but cors does it)
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

// ✅ Ensure DB connection for every request (Serverless friendly)
app.use(ensureDbConnected);

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

connectDB()
  .catch(err => console.error('❌ Erreur MongoDB:', err));

/* =======================
   SERVER
======================= */

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
