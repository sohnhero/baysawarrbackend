# BAY SA WAAR Backend

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
MONGO_URI=mongodb://localhost:27017/baysawaar
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
PORT=5005
NODE_ENV=development
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLOUDINARY_URL=cloudinary://252612838614382:oB4yl5QLAkvoWb-1rZ5p_uR92YA@drxouwbms
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# Or start manually
mongod
```

### 4. Create Test Users
Run the scripts to create test users:
```bash
# Create admin user
node createAdminUser.js

# Create regular test user
node createTestUser.js
```

### 5. Start the Server
```bash
npm start
```

The server will start on port 5005.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/auth/me` - Get current user info

### Enrollments
- `POST /api/enrollments/submit` - Submit enrollment
- `GET /api/enrollments/my-status` - Get user enrollments (protected)

### Admin (Protected)
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/enrollments` - Get all enrollments

## Testing Authentication

1. Start your backend server
2. Start your frontend (should be on port 5173)
3. Navigate to `/login`
4. Use the test credentials:
   - **Admin**: `admin@baysawaar.com` / `admin123`
   - **Partner**: `ndiagalo259@gmail.com` / `test123`

## Admin Features

The admin dashboard provides:
- View all enrollment requests
- Approve or reject enrollments
- View user statistics
- Manage users and enrollments
- Real-time updates with SweetAlert2 notifications

## Cloudinary Integration

The backend now supports image uploads via Cloudinary for:
- **Enrollments**: Company logos and business documents
- **Products**: Multiple product images with alt text
- **Blogs**: Featured images and gallery images

### Testing Cloudinary
```bash
# Test Cloudinary configuration
node testCloudinary.js

# Test image uploads via API
node testImageUpload.js
```

### Image Upload Features
- Automatic image optimization
- Multiple image formats support (JPG, PNG, GIF, WebP)
- File size limit: 5MB
- Automatic resizing and quality optimization
- Secure image storage with public IDs

## Frontend Integration

The frontend is configured to connect to `http://localhost:5005/api` by default. Make sure both servers are running for full functionality.
# baysawarrbackend
