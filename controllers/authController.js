import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { getAdminNotificationEmail, getResetPasswordEmail } from '../utils/emailTemplates.js';

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, companyDetails } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email déjà utilisé');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, email, password: hashedPassword, phone, role, companyDetails });
    await user.save();

    sendEmail('admin@baysawaar.com', 'Nouvel enrôlement',
      getAdminNotificationEmail('Nouvel enrôlement', `Nouvel utilisateur: ${email}, rôle: ${role}`))
      .catch(err => console.error('Erreur email register:', err));
    res.status(201).json({ message: 'Utilisateur créé' });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Identifiants invalides',
        error: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
  } catch (err) {
    next(err);
  }
};

// authController.js
export const getMe = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Aucun token fourni' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ message: 'Token invalide' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      data: {
        id: user._id.toString(),
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        photo: user.photo,
        photoURL: user.photoURL,
        avatar: user.avatar,
        companyDetails: user.companyDetails
      }
    });
  } catch (err) {
    console.error('getMe error:', err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token malformé' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) throw new Error('Utilisateur non trouvé');
    res.json(user);
  } catch (err) {
    next(err);
  }
};
export const updateProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).select('-password');
    if (!user) throw new Error('Utilisateur non trouvé');
    res.json({ message: 'Profil mis à jour', user });
  } catch (err) {
    next(err);
  }
};
export const deleteUser = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new Error('Utilisateur non trouvé');
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    next(err);
  }
};
export const getAllUsers = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
}
export const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error('Utilisateur non trouvé');

    const tempPassword = crypto.randomBytes(4).toString('hex');
    user.password = await bcrypt.hash(tempPassword, 10);
    await user.save();

    sendEmail(email, 'Réinitialisation du mot de passe',
      getResetPasswordEmail(tempPassword))
      .catch(err => console.error('Erreur email resetPassword:', err));
    res.json({ message: 'Mot de passe réinitialisé. Vérifiez votre email.' });
  } catch (err) {
    next(err);
  }
};
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new Error('Mot de passe actuel invalide');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    next(err);
  }
};
export const getUserById = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const user = await User.findById(req.params.id).select('-password');
    if (!user) throw new Error('Utilisateur non trouvé');
    res.json(user);
  } catch (err) {
    next(err);
  }
};
export const updateUserRole = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true }).select('-password');
    if (!user) throw new Error('Utilisateur non trouvé');
    res.json({ message: 'Rôle mis à jour', user });
  } catch (err) {
    next(err);
  }
};
export const getUsersByRole = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const { role } = req.params;
    const users = await User.find({ role })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    next(err);
  }
};
export const searchUsers = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { phone: new RegExp(query, 'i') },
      ],
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    next(err);
  }
};
export const filterUsers = async (req, res, next) => {

  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const { role, companyType, minYears } = req.query;
    const query = {};
    if (role) query.role = role;
    if (companyType) query['companyDetails.type'] = companyType;
    if (minYears) query['companyDetails.years'] = { $gte: Number(minYears) };

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
}
export const getUserStats = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const totalUsers = await User.countDocuments();
    const roles = ['member', 'admin'];
    const roleCounts = {};
    for (const role of roles) {
      roleCounts[role] = await User.countDocuments({ role });
    }
    res.json({ totalUsers, roleCounts });
  } catch (err) {
    next(err);
  }
};
export const getRecentUsers = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);
    res.json(users);
  } catch (err) {
    next(err);
  }
};
export const getPaginatedUsers = async (req, res, next) => {
  try {
    if (req.userRole !== 'admin') throw new Error('Accès interdit');
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find()
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await User.countDocuments();
    res.json({ users, total });
  } catch (err) {
    next(err);
  }
}
