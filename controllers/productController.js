import Product from '../models/Product.js';
import { formatUploadData } from '../middlewares/cloudinaryUpload.js';

export const getAllProducts = async (req, res, next) => {
  try {
    console.log('🔍 getAllProducts called');
    const { page = 1, limit = 10, category } = req.query;
    const query = category ? { category } : {};
    console.log('📊 Query:', query);
    
    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    console.log('✅ Products found:', products.length);
    
    const total = await Product.countDocuments(query);
    console.log('📈 Total products:', total);
    
    res.json({ products, total });
  } catch (err) {
    console.error('❌ Error in getAllProducts:', err);
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    // Récupérer les données d'upload d'images
    const uploadData = formatUploadData(req);
    
    // Parser les données JSON si nécessaire
    const productData = {
      ...req.body,
      ...uploadData,
    };
    
    // Parser specifications si c'est une chaîne JSON
    if (productData.specifications && typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        productData.specifications = [];
      }
    }
    
    // Parser tags si c'est une chaîne
    if (productData.tags && typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const product = new Product(productData);
    await product.save();
    res.status(201).json({ message: 'Produit créé', product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    // Récupérer les données d'upload d'images
    const uploadData = formatUploadData(req);
    
    // Mettre à jour le produit avec les données d'images
    const updateData = {
      ...req.body,
      ...uploadData,
    };
    
    // Parser specifications si c'est une chaîne JSON
    if (updateData.specifications && typeof updateData.specifications === 'string') {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (e) {
        updateData.specifications = [];
      }
    }
    
    // Parser tags si c'est une chaîne
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json({ message: 'Produit mis à jour', product });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    next(err);
  }
};

export const getExternalProducts = async (req, res, next) => {
  try {
    const axios = (await import('axios')).default;
    // Timeout of 10s to avoid hanging during external fetch
    const response = await axios.get('https://api-shop.fabiratrading.com/api/products', {
      timeout: 10000 
    });
    res.json(response.data);
  } catch (err) {
    console.error('❌ Proxy Error:', err.message);
    // Return 200 with empty array instead of 500 to avoid CORS issues on error pages
    res.json([]);
  }
};

