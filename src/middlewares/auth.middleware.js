import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware: Verifies JWT token
 * 
 * This middleware:
 * 1. Checks for Authorization header with Bearer token
 * 2. Verifies the JWT token using the secret
 * 3. Adds user information to req.user for subsequent middlewares
 * 4. Returns 401 Unauthorized if token is invalid or missing
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    
    // Extract token from "Bearer TOKEN_VALUE" format
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de acceso requerido'
      });
    }
    
    // Verify the token using the secret key from environment variables
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Token inválido o expirado'
        });
      }
      
      // Add user information to request object
      // The token payload should contain: { id, username, role, email }
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        email: decoded.email
      };
      
      next(); // Proceed to next middleware or route handler
    });
    
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Error de autenticación'
    });
  }
};

/**
 * Authorization Middleware Generator: Checks user roles
 * 
 * This is a middleware generator that returns a middleware function.
 * It checks if the authenticated user's role is in the allowed roles array.
 * 
 * Usage: authorizeRole(['Admin', 'CourtClerk'])
 * 
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the resource
 * @returns {Function} Middleware function that checks user authorization
 */
export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user was authenticated (should have req.user from authenticateToken)
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          status: 'error',
          message: 'Autenticación de usuario requerida'
        });
      }
      
      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: `Acceso denegado. Roles requeridos: ${allowedRoles.join(', ')}. Tu rol: ${req.user.role}`
        });
      }
      
      // User is authorized, proceed to next middleware or route handler
      next();
      
    } catch (error) {
      return res.status(403).json({
        status: 'error',
        message: 'Error de autorización'
      });
    }
  };
};

/**
 * Utility function to generate JWT tokens
 * This can be used in the auth controller for login functionality
 * 
 * @param {Object} payload - User data to include in token (id, username, role, email)
 * @param {string} expiresIn - Token expiration time (default: '24h')
 * @returns {string} JWT token
 */
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

