import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  photo: {
    publicId: { type: String },
    url: { type: String }
  },
  companyDetails: {
    name: String,
    address: String,
    registrationNumber: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
