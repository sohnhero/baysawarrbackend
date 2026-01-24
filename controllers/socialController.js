import axios from 'axios';
import SocialConfig from '../models/SocialConfig.js';

export async function setConfig(req, res, next) {
  if (req.userRole !== 'admin') throw new Error('Accès interdit');
  try {
    const { platform, pageId, accessToken } = req.body;
    const config = await SocialConfig.findOneAndUpdate(
      { platform },
      { pageId, accessToken },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    next(err);
  }
}

export async function getConfigs(req, res, next) {
  if (req.userRole !== 'admin') throw new Error('Accès interdit');
  try {
    const configs = await SocialConfig.find();
    res.json(configs);
  } catch (err) {
    next(err);
  }
}

export async function deleteConfig(req, res, next) {
  if (req.userRole !== 'admin') throw new Error('Accès interdit');
  try {
    await SocialConfig.findByIdAndDelete(req.params.id);
    res.json({ message: 'Config supprimée' });
  } catch (err) {
    next(err);
  }
}

export async function fetchPosts(req, res, next) {
  const { platform, limit = 10 } = req.query;
  try {
    const config = await SocialConfig.findOne({ platform });
    if (!config) throw new Error('Config non trouvée pour cette plateforme');

    let posts = [];
    if (platform === 'facebook') {
      const response = await axios.get(`https://graph.facebook.com/v20.0/${config.pageId}/feed?access_token=${config.accessToken}&limit=${limit}`);
      posts = response.data.data.map(post => ({
        platform: 'facebook',
        postId: post.id,
        content: post.message || '',
        image: post.full_picture,
        link: `https://facebook.com/${post.id}`,
        createdAt: post.created_time
      }));
    } else if (platform === 'linkedin') {
      const response = await axios.get(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(`urn:li:organization:${config.pageId}`)})&count=${limit}`, {
        headers: { Authorization: `Bearer ${config.accessToken}` }
      });
      posts = response.data.elements.map(post => ({
        platform: 'linkedin',
        postId: post.id,
        content: post.specificContent['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
        image: post.specificContent['com.linkedin.ugc.ShareContent']?.shareMedia?.[0]?.originalUrl,
        link: `https://linkedin.com/feed/update/${post.id}`,
        createdAt: post.created.time
      }));
    }

    res.json(posts);
  } catch (err) {
    next(err);
  }
}


export const submitEnrollment = async (req, res, next) => {
  try {
    const {
      type,
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      companyName,
      businessType,
      distributionArea,
      targetMarkets,
      industry,
      companySize,
      interests,
    } = req.body;

    // Valider le type d'enrôlement
    if (!['member'].includes(type)) {
      return res.status(400).json({ error: 'Type d’enrôlement invalide' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Créer un utilisateur automatiquement
    const password = crypto.randomBytes(8).toString('hex'); // Génère un mot de passe aléatoire
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = type; // Rôle basé sur le type (partner ou distributor)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      companyDetails: {
        name: companyName,
        type: businessType,
      },
    });
    await user.save();

    // Créer l'enrôlement
    const enrollmentData = {
      type,
      firstName,
      lastName,
      email,
      phone,
      country,
      city,
      companyName,
      businessType,
      distributionArea,
      targetMarkets,
      industry,
      companySize,
      interests,
      userId: user._id,
      status: 'pending',
    };

    const enrollment = new Enrollment(enrollmentData);
    await enrollment.save();

    // Envoyer l'email de confirmation à l'utilisateur
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirmation d’inscription - BAY SA WAAR',
      text: `Bonjour ${firstName} ${lastName},\n\nVotre inscription en tant que ${type} a été soumise avec succès.\n\nVos identifiants de connexion :\nEmail: ${email}\nMot de passe: ${password}\n\nVeuillez vous connecter à http://localhost:5173/login pour accéder à votre compte et changer votre mot de passe.\n\nCordialement,\nL'équipe BAY SA WAAR`,
    });

    // Envoyer une notification à l'admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'admin@baysawaar.com',
      subject: `Nouvelle demande d'inscription - ${type}`,
      text: `Type: ${type}\nNom: ${firstName} ${lastName}\nEmail: ${email}\nTéléphone: ${phone}\nPays: ${country}\nVille: ${city}\nEntreprise: ${companyName}`,
    });

    res.status(201).json({ message: 'Inscription soumise avec succès. Vos identifiants ont été envoyés par email.' });
  } catch (err) {
    next(err);
  }
};
