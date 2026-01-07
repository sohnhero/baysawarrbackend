import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

const protect = asyncHandler(async (req, res, next) => {
  console.log('[PROTECT] Middleware invoked for:', req.method, req.originalUrl);
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('[PROTECT] No token found');
    return res.status(401).json({ message: 'Non authentifié, token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[PROTECT] Token decoded, user ID:', decoded.id || decoded.userId);

    // Toujours décoder avec "id" (standard)
    const user = await User.findById(decoded.id || decoded.userId).select('-password');
    if (!user) {
      console.log('[PROTECT] User not found in DB');
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    req.user = user;  // ← objet User complet
    console.log('[PROTECT] Auth successful for user:', user.email, 'Role:', user.role);
    next();
  } catch (error) {
    console.error('[PROTECT] Token error:', error.message);
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
});

const isAdmin = (req, res, next) => {
  console.log('[IS_ADMIN] Checking admin status. req.user:', req.user ? req.user.email : 'undefined', 'Role:', req.user?.role);
  if (!req.user || req.user.role !== 'admin') {
    console.log('[IS_ADMIN] Access denied');
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  console.log('[IS_ADMIN] Access granted');
  next();
};

const optionalProtect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id || decoded.userId).select('-password');
    next();
  } catch (error) {
    // Token invalide ou expiré -> on continue en tant qu'invité
    console.log('Optional auth failed:', error.message);
    next();
  }
});

export { protect, isAdmin, optionalProtect };
