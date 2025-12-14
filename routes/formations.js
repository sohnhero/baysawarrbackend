import express from 'express';
import {
  getAllFormations,
  getFormationById,
  registerToFormation,
  createFormation,
  updateFormation,
  deleteFormation,
  updateRegistrationStatus
} from '../controllers/formationController.js';
import { protect, isAdmin, optionalProtect } from '../middlewares/auth.js';

const router = express.Router();

// Route admin
router.get('/admin', protect, isAdmin, getAllFormations);

// Routes publiques
router.get('/', optionalProtect, getAllFormations);
router.get('/:id', getFormationById);

// Route membre (protégée)
router.post('/:id/register', protect, registerToFormation);
router.post('/', protect, isAdmin, createFormation);
router.put('/:id', protect, isAdmin, updateFormation);
router.delete('/:id', protect, isAdmin, deleteFormation);

// Route admin pour statut
router.put('/:id/registrations/:regId', protect, isAdmin, updateRegistrationStatus);

export default router;
