import Enrollment from '../models/Enrollment.js';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { formatUploadData } from '../middlewares/cloudinaryUpload.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const submitEnrollment = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      companyName = '',
      interests = [],               // <-- tableau par défaut
    } = req.body;

    // ==== 1. Validation des champs obligatoires ====
    if (!firstName || !lastName || !email || !phone || !country || !city) {
      return res.status(400).json({
        error: 'Les champs obligatoires doivent être remplis : Prénom, Nom, Email, Téléphone, Pays, Ville',
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // ==== 2. Traitement des images (optionnelles) ====
    const uploadData = formatUploadData(req); // { companyLogo: url, businessDocuments: [url,…] }

    // ==== 3. Vérifier si l'email existe déjà ====
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // ==== 4. Créer l'utilisateur automatiquement ====
    const password = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: 'member',
      photo: uploadData.companyLogo || null,
      companyDetails: companyName ? { name: companyName } : null,
    });
    await user.save();

    // ==== GÉNÉRER LE TOKEN ====
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // plus long pour les nouveaux membres
    );

    // ==== 5. Normaliser les intérêts ====
    let parsedInterests = [];

    if (Array.isArray(interests)) {
      parsedInterests = interests;
    } else if (typeof interests === 'string') {
      try {
        parsedInterests = JSON.parse(interests);
      } catch (e) {
        return res.status(400).json({ error: 'Champ interests invalide' });
      }
    }
    // (si autre type → on garde un tableau vide)

    // ==== 6. Créer l'enrôlement ====
    const enrollmentData = {
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      companyName: companyName || null,
      interests: parsedInterests,
      userId: user._id,
      status: 'pending',
      companyLogo: uploadData.companyLogo || null,
      businessDocuments: uploadData.businessDocuments || [],
    };

    const enrollment = new Enrollment(enrollmentData);
    await enrollment.save();

    // ==== 7. Envoi des emails ====
    // ---- Email à l'utilisateur ----
    resend.emails.send({
      from: 'Bay Sa Waar <onboarding@resend.dev>',
      to: email,
      subject: 'Bienvenue chez BAY SA WAAR – Votre compte est prêt !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669;">Bonjour ${firstName} !</h2>
          <p>Merci pour votre inscription en tant que <strong>membre</strong> de <strong>BAY SA WAAR</strong>.</p>
          <p>Votre demande est <strong>en cours de validation</strong>. Une fois approuvée, vous aurez accès à :</p>
          <ul>
            <li>Formations gratuites (transformation des céréales, fruits, légumes)</li>
            <li>Programmes d'autonomisation des femmes</li>
            <li>Accompagnement à la formalisation</li>
            <li>Offres exclusives Fabira Trading</li>
          </ul>
          <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:20px 0;">
            <p><strong>Vos identifiants de connexion :</strong></p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe :</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;">${password}</code></p>
          </div>
          <p>
            <a href="https://bayy-sa-waar-front.vercel.app/login" style="background:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
              Se connecter maintenant
            </a>
          </p>
          <p style="margin-top:20px;color:#666;font-size:0.9em;">
            <strong>Conseil :</strong> Changez votre mot de passe après la première connexion.
          </p>
          <hr style="margin:30px 0;border:0;border-top:1px solid #eee;">
          <p style="color:#999;font-size:0.8em;">L'équipe BAY SA WAAR<br>contact@baysawaar.sn</p>
        </div>
      `,
    }).catch(err => console.error('Erreur Resend utilisateur:', err));

    // ---- Email à l'admin ----
    resend.emails.send({
      from: 'Bay Sa Waar <onboarding@resend.dev>',
      to: process.env.EMAIL_USER || 'iguisse97@gmail.com',
      subject: 'Nouvelle inscription membre - BAY SA WAAR',
      html: `
        <h3>Nouvelle demande d'inscription</h3>
        <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phone}</p>
        <p><strong>Localisation :</strong> ${city}, ${country}</p>
        <p><strong>Entreprise :</strong> ${companyName || 'Non renseignée'}</p>
        <p><strong>Intérêts :</strong> ${parsedInterests.join(', ') || 'Aucun'}</p>
        <hr>
        <p><a href="https://bayy-sa-waar-front.vercel.app/admin/enrollments">Voir dans le dashboard admin</a></p>
      `,
    }).catch(err => console.error('Erreur Resend admin:', err));

    // ==== 8. Réponse ====
    res.status(201).json({
      message: 'Inscription soumise avec succès',
      enrollmentId: enrollment._id,
    });
  } catch (err) {
    console.error('Erreur submitEnrollment:', err);
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* Les autres fonctions restent inchangées (getAll, getById, …)       */
/* ------------------------------------------------------------------ */
export const getAllEnrollments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    const enrollments = await Enrollment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email');
    const total = await Enrollment.countDocuments(query);
    res.json({ enrollments, total });
  } catch (err) {
    next(err);
  }
};

export const getEnrollmentById = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('userId');
    if (!enrollment) return res.status(404).json({ error: 'Inscription non trouvée' });
    res.json(enrollment);
  } catch (err) {
    next(err);
  }
};

export const updateEnrollment = async (req, res, next) => {
  try {
    const { status } = req.body;
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!enrollment) return res.status(404).json({ error: 'Inscription non trouvée' });

    if (status === 'approved') {
      const user = await User.findById(enrollment.userId);

      resend.emails.send({
        from: 'Bay Sa Waar <onboarding@resend.dev>',
        to: user.email,
        subject: 'Votre inscription est approuvée !',
        text: `Félicitations ${user.firstName} ! Votre compte est actif. Connectez-vous sur https://bayy-sa-waar-front.vercel.app/login`,
      }).catch(err => console.error('Erreur Resend approbation:', err));
    }

    res.json({ message: 'Statut mis à jour', enrollment });
  } catch (err) {
    next(err);
  }
};

export const deleteEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) return res.status(404).json({ error: 'Inscription non trouvée' });
    res.json({ message: 'Inscription supprimée' });
  } catch (err) {
    next(err);
  }
};

export const getEnrollmentStatus = async (req, res, next) => {
  try {
    // Maintenant req.user est l'objet User complet → on utilise _id
    if (!req.user?._id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const enrollments = await Enrollment.find({ userId: req.user._id });
    res.json(enrollments);
  } catch (err) {
    next(err);
  }
};
