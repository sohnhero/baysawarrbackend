import Enrollment from '../models/Enrollment.js';
import Product from '../models/Product.js';
import BlogPost from '../models/BlogPost.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  getAdminNotificationEmail,
  getRegistrationReceivedEmail,
  getWelcomeEmail,
  getApprovalEmail,
  getRejectionEmail
} from '../utils/emailTemplates.js';

export const getAdminStats = async (req, res, next) => {
  // ... (rest of the file starts here)
  try {
    const totalUsers = await User.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalBlogs = await BlogPost.countDocuments();
    const pendingEnrollments = await Enrollment.countDocuments({ status: 'pending' });
    const approvedEnrollments = await Enrollment.countDocuments({ status: 'approved' });
    const rejectedEnrollments = await Enrollment.countDocuments({ status: 'rejected' });

    const stats = {
      totalUsers,
      totalEnrollments,
      pendingEnrollments,
      approvedEnrollments,
      rejectedEnrollments,
      totalProducts,
      totalBlogs,
    };

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const users = await User.find({ role })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    // Supprimer les enrôlements associés à l'utilisateur (facultatif)
    await Enrollment.deleteMany({ userId: id });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
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
};

export const getUserStats = async (req, res, next) => {
  try {
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

export const submitEnrollment = async (req, res, next) => {
  try {
    const { type, firstName, lastName, email, phone, country, city, companyName } = req.body;
    const enrollment = new Enrollment({ type, firstName, lastName, email, phone, country, city, companyName });
    await enrollment.save();



    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Email to Admin
      const adminContent = `Type: ${type}\nNom: ${firstName} ${lastName}\nEmail: ${email}\nTéléphone: ${phone}\nPays: ${country}\nVille: ${city}\nEntreprise: ${companyName}`;
      sendEmail('iguisse97@gmail.com', `Nouvelle demande d'inscription - ${type}`,
        getAdminNotificationEmail(`Nouvelle demande - ${type}`, adminContent))
        .catch(err => console.error('Erreur email admin submitEnrollment:', err));

      // Email to Applicant
      sendEmail(email, 'Confirmation de réception de votre demande - BAY SA WAAR',
        getRegistrationReceivedEmail(firstName, type))
        .catch(err => console.error('Erreur email applicant submitEnrollment:', err));
    }
    res.status(201).json({ message: 'Demande soumise avec succès. Un email de confirmation vous a été envoyé.' });
  } catch (err) {
    next(err);
  }
};

export const getAllEnrollments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    const enrollments = await Enrollment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Enrollment.countDocuments(query);
    res.json({ enrollments, total });
  } catch (err) {
    next(err);
  }
};

export const getEnrollmentById = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }
    res.json(enrollment);
  } catch (err) {
    next(err);
  }
};

export const updateEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }

    if (enrollment.status === 'approved') {
      let user = await User.findOne({ email: enrollment.email });

      if (!user) {
        // Generate random password
        const generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Create new user
        user = new User({
          firstName: enrollment.firstName,
          lastName: enrollment.lastName,
          email: enrollment.email,
          phone: enrollment.phone,
          role: enrollment.type === 'formation' ? 'member' : 'member', // Default role logic, adjust if needed
          password: hashedPassword,
          companyDetails: {
            name: enrollment.companyName,
            // Add other details if available from enrollment
          }
        });

        // Set photo if enrollment has logo
        if (enrollment.companyLogo && enrollment.companyLogo.url) {
          user.photo = {
            publicId: enrollment.companyLogo.publicId,
            url: enrollment.companyLogo.url
          };
          user.photoURL = enrollment.companyLogo.url;
        }

        await user.save();

        // Update enrollment with userId
        enrollment.userId = user._id;
        await enrollment.save();

        // Send Welcome Email with Password
        sendEmail(enrollment.email, 'Bienvenue chez BAY SA WAAR - Vos identifiants',
          getWelcomeEmail(enrollment.firstName, enrollment.email, generatedPassword))
          .catch(err => console.error('Erreur email welcome:', err));
      } else {
        // User exists, maybe update role or just notify
        sendEmail(enrollment.email, 'Demande Approuvée - BAY SA WAAR',
          getApprovalEmail(enrollment.firstName))
          .catch(err => console.error('Erreur email approval:', err));
      }
    } else if (enrollment.status === 'rejected') {
      // Send Rejection Email
      sendEmail(enrollment.email, 'Mise à jour concernant votre demande - BAY SA WAAR',
        getRejectionEmail(enrollment.firstName))
        .catch(err => console.error('Erreur email rejection:', err));
    }

    // Synchronize photo if approved (legacy logic kept/merged above, but ensuring it runs if manual update happened without trigger inside if-block)
    if (enrollment.status === 'approved' && enrollment.userId && enrollment.companyLogo?.url) {
      await User.findByIdAndUpdate(enrollment.userId, {
        photo: {
          publicId: enrollment.companyLogo.publicId,
          url: enrollment.companyLogo.url
        }
      });
    }

    res.json({ message: 'Inscription mise à jour et notifications envoyées', enrollment });
  } catch (err) {
    next(err);
  }
};

export const deleteEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscription non trouvée' });
    }
    res.json({ message: 'Inscription supprimée' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

export const getEnrollmentStatus = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user.id });
    res.json(enrollments);
  } catch (err) {
    next(err);
  }
};
