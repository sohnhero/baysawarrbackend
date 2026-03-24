import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getExternalProducts } from '../controllers/productController.js';
import {protect, isAdmin}  from '../middlewares/auth.js';

import { uploadProductImages, handleUploadError } from '../middlewares/cloudinaryUpload.js';

const router = express.Router();

router.get('/external', getExternalProducts);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', protect, isAdmin, uploadProductImages, handleUploadError, createProduct);
router.put('/:id', protect, isAdmin, uploadProductImages, handleUploadError, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);

export default router;
