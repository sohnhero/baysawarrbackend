import { Schema, model } from 'mongoose';

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  // Images Cloudinary
  images: [{
    publicId: { type: String },
    url: { type: String },
    alt: { type: String }
  }],
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: String,
  // Informations supplémentaires
  brand: String,
  specifications: [{
    name: { type: String },
    value: { type: String }
  }],
  tags: [String],
  externalUrl: { type: String }, // Link to external ecommerce product
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default model('Product', productSchema);
