import { validationResult } from 'express-validator';

/**
 * Validation Error Handler Middleware
 * 
 * This middleware processes the results from express-validator rules and
 * returns a standardized error response if validation fails.
 * 
 * Usage:
 * router.post('/', 
 *   createCitizenValidation,  // Array of validation rules
 *   handleValidationErrors,   // This middleware
 *   create                    // Controller function
 * );
 * 
 * If validation passes, it calls next() to proceed to the controller.
 * If validation fails, it returns a 400 Bad Request with detailed error information.
 */
export const handleValidationErrors = (req, res, next) => {
  try {
    // Extract validation results from the request
    const errors = validationResult(req);
    
    // If there are no validation errors, proceed to next middleware/controller
    if (errors.isEmpty()) {
      return next();
    }
    
    // Format the errors for a clean response
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    // Return standardized error response
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      errors: formattedErrors,
      total_errors: formattedErrors.length
    });
    
  } catch (error) {
    // Handle unexpected errors in validation processing
    return res.status(500).json({
      status: 'error',
      message: 'Error en el procesamiento de validación',
      error: error.message
    });
  }
};

/**
 * Custom validation middleware for checking unique fields in database
 * This can be used for fields that need to be unique across the database
 * 
 * @param {string} field - The field name to check
 * @param {Function} checkFunction - Async function that checks if value exists in DB
 * @returns {Function} Express middleware function
 */
export const checkUniqueField = (field, checkFunction) => {
  return async (req, res, next) => {
    try {
      const value = req.body[field];
      
      if (!value) {
        return next(); // Skip if field is not provided
      }
      
      const exists = await checkFunction(value);
      
      if (exists) {
        return res.status(400).json({
          status: 'error',
          message: 'Error de validación',
          errors: [{
            field: field,
            message: `${field} ya existe`,
            value: value
          }]
        });
      }
      
      next();
      
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error en la validación de campo único',
        error: error.message
      });
    }
  };
};

/**
 * Sanitization middleware for cleaning input data
 * Removes potentially dangerous characters and normalizes data
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // List of fields that might contain user input
    const fieldsToSanitize = [
      'full_name', 'last_name', 'nick_name', 'origin_planet', 
      'residence_planet', 'description', 'location', 'crime_type'
    ];
    
    fieldsToSanitize.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Basic sanitization: trim whitespace and remove potential XSS characters
        req.body[field] = req.body[field]
          .trim()
          .replace(/[<>]/g, '') // Remove < and > characters
          .substring(0, 1000); // Limit length to prevent overly long inputs
      }
    });
    
    next();
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error en la sanitización de datos',
      error: error.message
    });
  }
};

/**
 * Validation middleware for checking if referenced IDs exist
 * Useful for foreign key validation before database operations
 * 
 * @param {string} field - The field name containing the ID
 * @param {Function} checkFunction - Async function that checks if ID exists in DB
 * @param {string} resourceName - Name of the resource for error messages
 * @returns {Function} Express middleware function
 */
export const validateResourceExists = (field, checkFunction, resourceName) => {
  return async (req, res, next) => {
    try {
      const id = req.body[field] || req.params[field];
      
      if (!id) {
        return next(); // Skip if ID is not provided
      }
      
      const exists = await checkFunction(id);
      
      if (!exists) {
        return res.status(400).json({
          status: 'error',
          message: 'Error de validación',
          errors: [{
            field: field,
            message: `${resourceName} con ID ${id} no existe`,
            value: id
          }]
        });
      }
      
      next();
      
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: `Error en la validación de ${resourceName}`,
        error: error.message
      });
    }
  };
};