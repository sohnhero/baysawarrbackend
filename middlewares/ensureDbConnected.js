import connectDB from '../config/db.js';

const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Database connection error in middleware:', err);
    res.status(500).json({ 
      error: 'Erreur de connexion à la base de données',
      message: process.env.NODE_ENV === 'production' ? 'Un problème technique est survenu' : err.message
    });
  }
};

export default ensureDbConnected;
