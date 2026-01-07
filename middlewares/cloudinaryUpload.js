import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: 'drxouwbms',
  api_key: '252612838614382',
  api_secret: 'oB4yl5QLAkvoWb-1rZ5p_uR92YA',
});

// Configuration du stockage Cloudinary pour multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'baysawaar',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto' },
    ],
  },
});

// Configuration multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  },
});

// Middleware pour uploader les images de produits
export const uploadProductImages = upload.array('images', 5);

// Middleware pour uploader les images de blog
export const uploadBlogImages = upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);

// Middleware pour uploader les images d'enrôlement
export const uploadEnrollmentImages = upload.fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'businessDocuments', maxCount: 5 }
]);

// Middleware de gestion d'erreur pour les uploads
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        message: 'La taille du fichier ne doit pas dépasser 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Trop de fichiers',
        message: 'Le nombre de fichiers dépasse la limite autorisée'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Champ de fichier inattendu',
        message: 'Le champ de fichier n\'est pas autorisé'
      });
    }
  }

  if (error.message === 'Seules les images sont autorisées!') {
    return res.status(400).json({
      error: 'Type de fichier non autorisé',
      message: 'Seules les images (JPG, PNG, GIF, WebP) sont acceptées'
    });
  }

  next(error);
};

// Fonction utilitaire pour formater les données d'upload
export const formatUploadData = (req) => {
  const uploadData = {};

  // Traiter les fichiers uniques
  if (req.file) {
    uploadData[req.file.fieldname] = {
      publicId: req.file.filename, // Dans multer-storage-cloudinary v4, c'est 'filename'
      url: req.file.path, // Dans multer-storage-cloudinary v4, c'est 'path'
      alt: req.file.originalname
    };
  }

  // Traiter les fichiers multiples
  if (req.files) {
    if (Array.isArray(req.files)) {
      // Un seul champ avec plusieurs fichiers
      const fieldName = req.files[0]?.fieldname;
      if (fieldName) {
        uploadData[fieldName] = req.files.map(file => ({
          publicId: file.filename, // Dans multer-storage-cloudinary v4, c'est 'filename'
          url: file.path, // Dans multer-storage-cloudinary v4, c'est 'path'
          alt: file.originalname
        }));
      }
    } else {
      // Plusieurs champs avec fichiers
      Object.keys(req.files).forEach(fieldName => {
        const files = req.files[fieldName];
        if (files.length === 1) {
          uploadData[fieldName] = {
            publicId: files[0].filename, // Dans multer-storage-cloudinary v4, c'est 'filename'
            url: files[0].path, // Dans multer-storage-cloudinary v4, c'est 'path'
            alt: files[0].originalname
          };
        } else {
          uploadData[fieldName] = files.map(file => ({
            publicId: file.filename, // Dans multer-storage-cloudinary v4, c'est 'filename'
            url: file.path, // Dans multer-storage-cloudinary v4, c'est 'path'
            alt: file.originalname
          }));
        }
      });
    }
  }

  return uploadData;
};

export default cloudinary;
