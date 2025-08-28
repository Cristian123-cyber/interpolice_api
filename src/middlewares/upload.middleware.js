import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Upload Middleware for Avatar Images
 * 
 * This middleware handles file uploads for citizen avatars using Multer.
 * Configuration based on the project specifications:
 * - Storage location: public/uploads/avatars/
 * - Allowed file types: JPEG, PNG, GIF, WebP
 * - Maximum file size: 5MB
 * - Files are renamed to avoid name collisions
 * - MIME type validation for security
 */

// 1. Storage configuration: Where and how to save uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/avatars/';
    
    // Ensure the upload directory exists, create it if it doesn't
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }
    if (!fs.existsSync('public/uploads')) {
      fs.mkdirSync('public/uploads', { recursive: true });
    }
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    try {
      // Generate unique filename to avoid collisions
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000);
      const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Format: originalname_timestamp_random.ext
      const uniqueFilename = `${originalName}_${timestamp}_${randomNum}${ext}`;
      
      cb(null, uniqueFilename);
    } catch (error) {
      cb(error, null);
    }
  }
});

// 2. File filter: Define what file types are acceptable
const fileFilter = (req, file, cb) => {
  try {
    // Define allowed MIME types for images
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    // Check if the uploaded file's MIME type is in the allowed list
    if (allowedMimeTypes.includes(file.mimetype)) {
      // Additional check: verify file extension matches MIME type
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      if (allowedExtensions.includes(ext)) {
        cb(null, true); // Accept the file
      } else {
        cb(new Error('Extensión de archivo no coincide con el tipo MIME'), false);
      }
    } else {
      // Reject the file with a descriptive error
      cb(new Error(`Tipo de archivo inválido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP). Recibido: ${file.mimetype}`), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

// 3. Configure Multer with storage, limits, and file filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow one file per upload
    fieldSize: 10 * 1024 * 1024 // 10MB field size limit
  },
  fileFilter: fileFilter
});

// 4. Export specific upload middleware for avatar images
export const uploadAvatar = upload.single('avatar');

/**
 * Enhanced upload middleware with error handling
 * This wrapper provides better error messages and handles Multer errors gracefully
 */
export const uploadAvatarWithErrorHandling = (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      let errorMessage = 'File upload error';
      
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          errorMessage = 'Archivo demasiado grande. El tamaño máximo permitido es 5MB';
          break;
        case 'LIMIT_FILE_COUNT':
          errorMessage = 'Demasiados archivos. Solo se permite una imagen de avatar';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          errorMessage = 'Campo de archivo inesperado. Usa "avatar" como nombre del campo';
          break;
        case 'LIMIT_FIELD_KEY':
          errorMessage = 'Nombre de campo demasiado largo';
          break;
        case 'LIMIT_FIELD_VALUE':
          errorMessage = 'Valor de campo demasiado largo';
          break;
        case 'LIMIT_FIELD_COUNT':
          errorMessage = 'Demasiados campos';
          break;
        default:
          errorMessage = `Error de carga: ${err.message}`;
      }
      
      return res.status(400).json({
        status: 'error',
        message: errorMessage,
        error_code: err.code
      });
    } else if (err) {
      // Handle custom errors from fileFilter
      return res.status(400).json({
        status: 'error',
        message: err.message || 'File upload failed'
      });
    }
    
    // No error, proceed to next middleware
    next();
  });
};

/**
 * Middleware for multiple file uploads (for future use if needed)
 * This can handle multiple images at once
 */
export const uploadMultipleImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
}).array('images', 5); // Field name 'images', max 5 files

/**
 * Utility function to delete uploaded files
 * Useful for cleanup when database operations fail
 * 
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise} Promise that resolves when file is deleted
 */
export const deleteUploadedFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        reject(err);
      } else {
        console.log('File deleted successfully:', filePath);
        resolve();
      }
    });
  });
};

/**
 * Middleware to validate that an uploaded file exists
 * This can be used when file upload is mandatory
 */
export const requireFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'Avatar image is required'
    });
  }
  next();
};

/**
 * Middleware to make file upload optional
 * This sets a default avatar if no file is uploaded
 */
export const optionalFileUpload = (req, res, next) => {
  if (!req.file) {
    // Set default avatar URL
    req.body.avatar_url = '/uploads/avatars/default.png';
  } else {
    // Set uploaded file URL
    req.body.avatar_url = `/uploads/avatars/${req.file.filename}`;
  }
  next();
};