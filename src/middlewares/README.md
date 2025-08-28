# Middleware Documentation

This folder contains all the middleware components for the Interpolice API according to the project specifications.

## Available Middleware

### 1. Authentication Middleware (`auth.middleware.js`)

Handles JWT authentication and role-based authorization.

**Functions:**
- `authenticateToken`: Verifies JWT tokens
- `authorizeRole(roles)`: Checks user permissions
- `generateToken(payload)`: Creates JWT tokens
- `refreshToken`: Refreshes expired tokens

**Usage Example:**
```javascript
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware.js';

// Protect route with authentication
router.get('/protected', authenticateToken, controller);

// Protect with role authorization
router.post('/admin-only', 
  authenticateToken, 
  authorizeRole(['Admin']), 
  controller
);
```

### 2. Validation Middleware (`validation.middleware.js`)

Handles express-validator error processing and custom validations.

**Functions:**
- `handleValidationErrors`: Processes validation results
- `checkUniqueField(field, checkFn)`: Validates unique database fields
- `sanitizeInput`: Cleans user input
- `validateResourceExists(field, checkFn, resource)`: Validates foreign keys

**Usage Example:**
```javascript
import { handleValidationErrors } from '../middlewares/validation.middleware.js';
import { createCitizenValidation } from '../modules/citizens/citizens.validation.js';

router.post('/', 
  createCitizenValidation,
  handleValidationErrors,
  controller
);
```

### 3. Upload Middleware (`upload.middleware.js`)

Handles file uploads using Multer with proper validation and security.

**Functions:**
- `uploadAvatar`: Single avatar image upload
- `uploadAvatarWithErrorHandling`: Enhanced error handling
- `uploadMultipleImages`: Multiple file uploads
- `deleteUploadedFile(path)`: Cleanup utility
- `requireFileUpload`: Mandatory file validation
- `optionalFileUpload`: Optional file with default

**Usage Example:**
```javascript
import { uploadAvatarWithErrorHandling, optionalFileUpload } from '../middlewares/upload.middleware.js';

router.post('/', 
  uploadAvatarWithErrorHandling,
  optionalFileUpload,
  validation,
  handleValidationErrors,
  controller
);
```

## Role-based Access Control Matrix

Based on the project specifications, here's the permission matrix:

| Endpoint | Admin | Commander | General | CourtClerk | PoliceOfficer |
|----------|-------|-----------|---------|------------|---------------|
| GET /citizens | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /citizens | ✅ | ❌ | ❌ | ✅ | ✅ |
| PUT /citizens/:id | ✅ | ❌ | ❌ | ✅ | ❌ |
| DELETE /citizens/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /records | ✅ | ❌ | ❌ | ✅ | ❌ |
| POST /citations | ✅ | ❌ | ❌ | ❌ | ✅ |
| GET /reports | ✅ | ✅ | ✅ | ❌ | ❌ |

## Complete Route Example

Here's how to implement a complete route with all middleware:

```javascript
// citizens.routes.js
import express from 'express';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.middleware.js';
import { uploadAvatarWithErrorHandling, optionalFileUpload } from '../../middlewares/upload.middleware.js';
import { handleValidationErrors, sanitizeInput } from '../../middlewares/validation.middleware.js';
import { createCitizenValidation, updateCitizenValidation } from './citizens.validation.js';
import { create, getAll, getOne, update, deleteOne } from './citizens.controller.js';

const router = express.Router();

// GET all citizens - All roles can access
router.get('/', 
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getAll
);

// GET single citizen - All roles can access  
router.get('/:id',
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getOne
);

// POST new citizen - Admin, CourtClerk, PoliceOfficer only
router.post('/',
  authenticateToken,
  authorizeRole(['Admin', 'CourtClerk', 'PoliceOfficer']),
  uploadAvatarWithErrorHandling,
  optionalFileUpload,
  sanitizeInput,
  createCitizenValidation,
  handleValidationErrors,
  create
);

// PUT update citizen - Admin, CourtClerk only
router.put('/:id',
  authenticateToken,
  authorizeRole(['Admin', 'CourtClerk']),
  sanitizeInput,
  updateCitizenValidation,
  handleValidationErrors,
  update
);

// DELETE citizen - Admin only
router.delete('/:id',
  authenticateToken,
  authorizeRole(['Admin']),
  deleteOne
);

export default router;
```

## Environment Variables Required

Add these to your `.env` file:

```
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

## File Upload Configuration

- **Storage**: `public/uploads/avatars/`
- **Max Size**: 5MB
- **Allowed Types**: JPEG, PNG, GIF, WebP
- **Naming**: `originalname_timestamp_random.ext`