import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  // === Champs obligatoires ===
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },

  // === Champs optionnels ===
  companyName: { type: String, trim: true },
  interests: [{ type: String }], // ex: ["formations", "autonomisation-femmes"]

  // === Images (Cloudinary) ===
  companyLogo: {
    publicId: { type: String },
    url: { type: String },
  },
  businessDocuments: [{
    publicId: { type: String },
    url: { type: String },
    name: { type: String }, // nom original du fichier
  }],

  // === Statut et lien utilisateur ===
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },

  // === Timestamps ===
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Mise à jour automatique de `updatedAt`
enrollmentSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

// Index pour recherche par email ou nom
enrollmentSchema.index({ email: 1 });
enrollmentSchema.index({ firstName: 'text', lastName: 'text' });

export default mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
