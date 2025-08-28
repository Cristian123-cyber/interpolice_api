import { body, param } from 'express-validator';
import { checkNicknameExistsDB, checkQrCodeExistsDB, checkStatusExistsDB, checkPlanetExistsDB } from './citizens.model.js';
import { checkUniqueField, validateResourceExists } from '../../middlewares/validation.middleware.js';

/**
 * Reglas de validación para crear un nuevo ciudadano
 */
export const createCitizenValidation = [
  body('full_name')
    .notEmpty().withMessage('El nombre completo es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre completo debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Zà-ſ\s]+$/).withMessage('El nombre completo solo puede contener letras y espacios'),

  body('last_name')
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Zà-ſ\s]+$/).withMessage('El apellido solo puede contener letras y espacios'),

  body('nick_name')
    .notEmpty().withMessage('El apodo es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El apodo debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('El apodo solo puede contener letras, números, guiones y guiones bajos')
    .custom(async (value) => {
      const exists = await checkNicknameExistsDB(value);
      if (exists) {
        throw new Error('Este apodo ya está en uso');
      }
      return true;
    }),

  body('birth_date')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha de nacimiento debe estar en formato YYYY-MM-DD')
    .custom((value) => {
      // Validar que sea una fecha válida sin conversión de zona horaria
      const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
      const match = value.match(dateRegex);
      
      if (!match) {
        throw new Error('Formato de fecha inválido');
      }
      
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);
      
      // Verificar rangos válidos
      if (month < 1 || month > 12) {
        throw new Error('Mes inválido');
      }
      
      if (day < 1 || day > 31) {
        throw new Error('Día inválido');
      }
      
      // Verificar que no sea una fecha futura (comparar solo como strings)
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();
      
      if (year > currentYear || 
          (year === currentYear && month > currentMonth) ||
          (year === currentYear && month === currentMonth && day > currentDay)) {
        throw new Error('La fecha de nacimiento no puede ser futura');
      }
      
      // Verificar que no sea muy antigua (más de 150 años)
      if (year < currentYear - 150) {
        throw new Error('La fecha de nacimiento no puede ser anterior a 150 años');
      }
      
      return true;
    }),

  body('origin_planet')
    .notEmpty().withMessage('El planeta de origen es obligatorio')
    .isInt({ min: 1 }).withMessage('El planeta de origen debe ser un número entero positivo')
    .custom(async (value) => {
      const exists = await checkPlanetExistsDB(value);
      if (!exists) {
        throw new Error('El planeta de origen especificado no existe');
      }
      return true;
    })
    .toInt(),

  body('residence_planet')
    .notEmpty().withMessage('El planeta de residencia es obligatorio')
    .isInt({ min: 1 }).withMessage('El planeta de residencia debe ser un número entero positivo')
    .custom(async (value) => {
      const exists = await checkPlanetExistsDB(value);
      if (!exists) {
        throw new Error('El planeta de residencia especificado no existe');
      }
      return true;
    })
    .toInt(),

  body('qr_code')
    .notEmpty().withMessage('El código QR es obligatorio')
    .isLength({ min: 5, max: 255 }).withMessage('El código QR debe tener entre 5 y 255 caracteres')
    .custom(async (value) => {
      const exists = await checkQrCodeExistsDB(value);
      if (exists) {
        throw new Error('Este código QR ya está en uso');
      }
      return true;
    }),

  body('status_id')
    .notEmpty().withMessage('El ID de estado es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID de estado debe ser un número entero positivo')
    .custom(async (value) => {
      const exists = await checkStatusExistsDB(value);
      if (!exists) {
        throw new Error('El estado especificado no existe');
      }
      return true;
    })
    .toInt()
];

/**
 * Reglas de validación para actualizar un ciudadano
 */
export const updateCitizenValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt(),

  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre completo debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Zà-ſ\s]+$/).withMessage('El nombre completo solo puede contener letras y espacios'),

  body('last_name')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Zà-ſ\s]+$/).withMessage('El apellido solo puede contener letras y espacios'),

  body('nick_name')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('El apodo debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('El apodo solo puede contener letras, números, guiones y guiones bajos')
    .custom(async (value, { req }) => {
      if (value) {
        const exists = await checkNicknameExistsDB(value, req.params.id);
        if (exists) {
          throw new Error('Este apodo ya está en uso');
        }
      }
      return true;
    }),

  body('birth_date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('La fecha de nacimiento debe estar en formato YYYY-MM-DD')
    .custom((value) => {
      if (value) {
        // Validar que sea una fecha válida sin conversión de zona horaria
        const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const match = value.match(dateRegex);
        
        if (!match) {
          throw new Error('Formato de fecha inválido');
        }
        
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const day = parseInt(match[3]);
        
        // Verificar rangos válidos
        if (month < 1 || month > 12) {
          throw new Error('Mes inválido');
        }
        
        if (day < 1 || day > 31) {
          throw new Error('Día inválido');
        }
        
        // Verificar que no sea una fecha futura (comparar solo como strings)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        if (year > currentYear || 
            (year === currentYear && month > currentMonth) ||
            (year === currentYear && month === currentMonth && day > currentDay)) {
          throw new Error('La fecha de nacimiento no puede ser futura');
        }
        
        // Verificar que no sea muy antigua (más de 150 años)
        if (year < currentYear - 150) {
          throw new Error('La fecha de nacimiento no puede ser anterior a 150 años');
        }
      }
      return true;
    }),

  body('origin_planet')
    .optional()
    .isInt({ min: 1 }).withMessage('El planeta de origen debe ser un número entero positivo')
    .custom(async (value) => {
      if (value) {
        const exists = await checkPlanetExistsDB(value);
        if (!exists) {
          throw new Error('El planeta de origen especificado no existe');
        }
      }
      return true;
    })
    .toInt(),

  body('residence_planet')
    .optional()
    .isInt({ min: 1 }).withMessage('El planeta de residencia debe ser un número entero positivo')
    .custom(async (value) => {
      if (value) {
        const exists = await checkPlanetExistsDB(value);
        if (!exists) {
          throw new Error('El planeta de residencia especificado no existe');
        }
      }
      return true;
    })
    .toInt(),

  body('qr_code')
    .optional()
    .isLength({ min: 5, max: 255 }).withMessage('El código QR debe tener entre 5 y 255 caracteres')
    .custom(async (value, { req }) => {
      if (value) {
        const exists = await checkQrCodeExistsDB(value, req.params.id);
        if (exists) {
          throw new Error('Este código QR ya está en uso');
        }
      }
      return true;
    }),

  body('status_id')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID de estado debe ser un número entero positivo')
    .custom(async (value) => {
      if (value) {
        const exists = await checkStatusExistsDB(value);
        if (!exists) {
          throw new Error('El estado especificado no existe');
        }
      }
      return true;
    })
    .toInt()
];

/**
 * Validación para obtener ciudadano por ID
 */
export const getCitizenByIdValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para eliminar ciudadano
 */
export const deleteCitizenValidation = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt()
];