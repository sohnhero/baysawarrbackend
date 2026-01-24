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

        // ==== 3. Vérifier si l'email existe déjà (User ou Enrollment en attente) ====
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Un compte existe déjà avec cet email' });
        }
        const existingEnrollment = await Enrollment.findOne({ email, status: 'pending' });
        if (existingEnrollment) {
            return res.status(400).json({ error: 'Une demande est déjà en cours avec cet email' });
        }

        // ==== 4. Normaliser les intérêts ====
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

        // ==== 5. Créer l'enrôlement (SANS créer d'utilisateur) ====
        const enrollmentData = {
            firstName,
            lastName,
            email,
            phone,
            country,
            city,
            companyName: companyName || null,
            interests: parsedInterests,
            // userId: null, // Pas d'utilisateur pour l'instant
            status: 'pending',
            companyLogo: uploadData.companyLogo || null,
            businessDocuments: uploadData.businessDocuments || [],
        };

        const enrollment = new Enrollment(enrollmentData);
        await enrollment.save();

        // ==== 6. Envoi des emails ====
        // ---- Email à l'utilisateur (Notification de réception) ----
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Using Resend as configured in this file
            resend.emails.send({
                from: 'Bay Sa Waar <onboarding@resend.dev>',
                to: email,
                subject: 'Confirmation de réception de votre demande - BAY SA WAAR',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #059669;">Bonjour ${firstName} ${lastName},</h2>
            <p>Nous avons bien reçu votre demande d'inscription pour rejoindre <strong>BAY SA WAAR</strong>.</p>
            <p>Votre dossier est actuellement <strong>en cours d'examen</strong> par notre équipe. Vous recevrez une notification par email dès qu'une décision sera prise.</p>
            <p>Merci de l'intérêt que vous portez à notre communauté.</p>
            <hr style="margin:30px 0;border:0;border-top:1px solid #eee;">
            <p style="color:#999;font-size:0.8em;">L'équipe BAY SA WAAR<br>contact@baysawaar.sn</p>
          </div>
        `,
            }).catch(err => console.error('Erreur Resend utilisateur:', err));

            // ---- Email à l'admin ----
            resend.emails.send({
                from: 'Bay Sa Waar <onboarding@resend.dev>',
                to: process.env.EMAIL_USER || 'iguisse97@gmail.com',
                subject: 'Nouvelle demande d\'inscription (En attente) - BAY SA WAAR',
                html: `
          <h3>Nouvelle demande d'inscription</h3>
          <p><strong>Nom :</strong> ${firstName} ${lastName}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Téléphone :</strong> ${phone}</p>
          <p><strong>Localisation :</strong> ${city}, ${country}</p>
          <p><strong>Entreprise :</strong> ${companyName || 'Non renseignée'}</p>
          <hr>
          <p><a href="https://bayy-sa-waar-front.vercel.app/admin/dashboard">Connectez-vous au dashboard pour valider ou refuser cette demande.</a></p>
        `,
            }).catch(err => console.error('Erreur Resend admin:', err));
        }

        // ==== 7. Réponse ====
        res.status(201).json({
            message: 'Votre demande a été soumise avec succès. Vous recevrez un email de confirmation.',
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
