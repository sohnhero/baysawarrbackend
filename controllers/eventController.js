// controllers/eventController.js
import asyncHandler from 'express-async-handler';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { getEventRegistrationEmail, getAdminNotificationEmail } from '../utils/emailTemplates.js';
import sendEmail from '../utils/sendEmail.js';

import { formatUploadData } from '../middlewares/cloudinaryUpload.js';

// @desc    Créer un événement (admin only)
// @route   POST /api/events
export const createEvent = asyncHandler(async (req, res) => {
  console.log('[CREATE_EVENT] Controller invoked');
  console.log('[CREATE_EVENT] req.body:', req.body);
  console.log('[CREATE_EVENT] req.files:', req.files);
  
  const uploadData = formatUploadData(req);
  console.log('[CREATE_EVENT] uploadData:', uploadData);

  const { title, dateStart, dateEnd, ...rest } = req.body;
  
  if (!title) {
    res.status(400);
    throw new Error('Le titre est requis');
  }

  const slug = title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const eventData = {
    ...rest,
    title,
    slug,
    dateStart: dateStart ? new Date(dateStart) : undefined,
    dateEnd: dateEnd ? new Date(dateEnd) : undefined,
    maxParticipants: req.body.maxParticipants ? Number(req.body.maxParticipants) : undefined,
    priceMember: req.body.priceMember !== undefined ? Number(req.body.priceMember) : 0,
    priceNonMember: req.body.priceNonMember !== undefined ? Number(req.body.priceNonMember) : 0,
    isFeatured: req.body.isFeatured === 'true',
    createdBy: req.user._id,
    ...uploadData
  };

  console.log('[CREATE_EVENT] Final eventData to save:', eventData);

  const event = await Event.create(eventData);

  res.status(201).json({ event });
});

// @desc    Tous les événements (public)
// @route   GET /api/events
export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({})
    .sort({ dateStart: -1 }) // les plus récents en premier
    .select('-__v')
    .populate('registrations.user', 'firstName lastName email');

  res.json({ events });
});
// @desc    Détail événement + inscriptions visibles pour admin
// @route   GET /api/events/:slug
export const getEventBySlug = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug })
    .populate('registrations.user', 'firstName lastName email phone');

  if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

  res.json({ event });
});

// @desc    Inscription à un événement
// @route   POST /api/events/:slug/register
export const registerToEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug });
  if (!event) {
    return res.status(404).json({ message: 'Événement non trouvé' });
  }

  // Vérification du user dans la requête
  const userId = req.user?._id || req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  // Protection null-safe : reg.user peut être undefined ou un objet populated
  const alreadyRegistered = (event.registrations || []).some((reg) => {
    if (!reg || !reg.user) return false;
    const regUserIdStr = reg.user._id ? reg.user._id.toString() : reg.user.toString();
    return regUserIdStr === userId.toString();
  });

  if (alreadyRegistered) {
    return res.status(400).json({ message: 'Vous êtes déjà inscrit à cet événement' });
  }

  event.registrations.push({ user: userId });
  await event.save();

  // Envoyer un email de confirmation à l'utilisateur
  const user = await User.findById(userId);
  if (user && user.email) {
    // Send emails asynchronously without blocking the response
    sendEmail(
      user.email,
      `Confirmation d'inscription à l'événement: ${event.title}`,
      getEventRegistrationEmail(user.firstName, event.title, `${event.dateStart.toLocaleDateString()} - ${event.dateEnd.toLocaleDateString()}`, event.location)
    ).catch(error => {
      console.error('Erreur email utilisateur registerToEvent:', error);
    });

    const adminContent = `L'utilisateur ${user.firstName} ${user.lastName} (${user.email}) s'est inscrit à l'événement "${event.title}".`;
    sendEmail(
      process.env.EMAIL_USER || 'iguisse97@gmail.com',
      `Nouvelle inscription à l'événement: ${event.title}`,
      getAdminNotificationEmail(`Inscription Événement: ${event.title}`, adminContent)
    ).catch(error => {
      console.error('Erreur email admin registerToEvent:', error);
    });
  }

  res.status(200).json({ message: 'Inscription réussie !' });
});

// @desc    Mettre à jour un événement (admin only)
// @route   PUT /api/events/:id
export const updateEvent = asyncHandler(async (req, res) => {
  console.log('[UPDATE_EVENT] Controller invoked for event ID:', req.params.id);
  console.log('[UPDATE_EVENT] req.body:', req.body);
  console.log('[UPDATE_EVENT] req.files:', req.files);
  
  const { title, dateStart, dateEnd, ...rest } = req.body;
  const uploadData = formatUploadData(req);
  console.log('[UPDATE_EVENT] uploadData:', uploadData);

  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Événement non trouvé');
  }

  // Update slug if title changes
  if (title && title !== event.title) {
    event.slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  event.title = title || event.title;
  event.description = req.body.description || event.description;
  event.dateStart = dateStart ? new Date(dateStart) : event.dateStart;
  event.dateEnd = dateEnd ? new Date(dateEnd) : event.dateEnd;
  event.location = req.body.location || event.location;
  
  if (req.body.maxParticipants !== undefined) {
    event.maxParticipants = Number(req.body.maxParticipants);
  }
  
  if (req.body.priceMember !== undefined) {
    event.priceMember = Number(req.body.priceMember);
  }
  
  if (req.body.priceNonMember !== undefined) {
    event.priceNonMember = Number(req.body.priceNonMember);
  }
  
  if (req.body.isFeatured !== undefined) {
    event.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
  }
  
  event.type = req.body.type || event.type;

  // Handle images update
  if (uploadData.images) {
    event.images = uploadData.images;
  }

  const updatedEvent = await event.save();
  res.json({ event: updatedEvent });
});

// @desc    Supprimer un événement (admin only)
// @route   DELETE /api/events/:id
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Événement non trouvé');
  }

  await event.deleteOne();
  res.json({ message: 'Événement supprimé' });
});
