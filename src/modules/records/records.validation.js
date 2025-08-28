import { body, param } from 'express-validator';
import { checkCitizenExistsDB, checkPlanetExistsDB } from './records.model.js';
import { validateResourceExists } from '../../middlewares/validation.middleware.js';

/**
 * Validaciones para el módulo de antecedentes penales
 * Basado en el esquema de la tabla criminal_records: id, citizen_id, date, time, location, description
 */

/**
 * Validaciones para crear un nuevo antecedente penal
 */
export const createRecordValidation = [
  // Validación del ID del ciudadano en la URL
  param('citizenId')
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .custom(async (value) => {
      const exists = await checkCitizenExistsDB(value);
      if (!exists) {
        throw new Error('El ciudadano especificado no existe');
      }
      return true;
    })
    .toInt(),

  // Validación de la fecha del delito
  body('date')
    .notEmpty()
    .withMessage('La fecha del delito es obligatoria')
    .isISO8601()
    .withMessage('La fecha debe estar en formato YYYY-MM-DD')
    .custom((value) => {
      const crimeDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Permitir fechas del día actual
      if (crimeDate > today) {
        throw new Error('La fecha del delito no puede ser futura');
      }
      // Verificar que no sea muy antigua (por ejemplo, más de 100 años)
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
      if (crimeDate < hundredYearsAgo) {
        throw new Error('La fecha del delito no puede ser anterior a 100 años');
      }
      return true;
    })
    .toDate(),

  // Validación de la hora del delito
  body('time')
    .notEmpty()
    .withMessage('La hora del delito es obligatoria')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('La hora debe estar en formato HH:MM o HH:MM:SS'),

  // Validación de la ubicación
  body('location')
    .notEmpty()
    .withMessage('La ubicación del delito es obligatoria')
    .isInt({ min: 1 })
    .withMessage('La ubicación debe ser un ID de planeta válido')
    .custom(async (value) => {
      const exists = await checkPlanetExistsDB(value);
      if (!exists) {
        throw new Error('El planeta especificado no existe');
      }
      return true;
    })
    .toInt(),

  // Validación de la descripción
  body('description')
    .notEmpty()
    .withMessage('La descripción del delito es obligatoria')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres')
    .trim()
];

/**
 * Validaciones para actualizar un antecedente penal
 */
export const updateRecordValidation = [
  // Validación del ID del antecedente en la URL
  param('recordId')
    .isInt({ min: 1 })
    .withMessage('El ID del antecedente debe ser un número entero positivo')
    .toInt(),

  // Validación del ID del ciudadano en la URL (opcional para update)
  param('citizenId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt(),

  // Validaciones opcionales para actualización
  body('date')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe estar en formato YYYY-MM-DD')
    .custom((value) => {
      if (value) {
        const crimeDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (crimeDate > today) {
          throw new Error('La fecha del delito no puede ser futura');
        }
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
        if (crimeDate < hundredYearsAgo) {
          throw new Error('La fecha del delito no puede ser anterior a 100 años');
        }
      }
      return true;
    })
    .toDate(),

  body('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('La hora debe estar en formato HH:MM o HH:MM:SS'),

  body('location')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La ubicación debe ser un ID de planeta válido')
    .custom(async (value) => {
      if (value) {
        const exists = await checkPlanetExistsDB(value);
        if (!exists) {
          throw new Error('El planeta especificado no existe');
        }
      }
      return true;
    })
    .toInt(),

  body('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres')
    .trim(),

  // Si se proporciona citizen_id en el body, validar que existe
  body('citizen_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .custom(async (value) => {
      if (value) {
        const exists = await checkCitizenExistsDB(value);
        if (!exists) {
          throw new Error('El ciudadano especificado no existe');
        }
      }
      return true;
    })
    .toInt()
];

/**
 * Validación para obtener antecedentes por ID de ciudadano
 */
export const getRecordsByCitizenValidation = [
  param('citizenId')
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .custom(async (value) => {
      const exists = await checkCitizenExistsDB(value);
      if (!exists) {
        throw new Error('El ciudadano especificado no existe');
      }
      return true;
    })
    .toInt()
];

/**
 * Validación para obtener antecedente específico por ID
 */
export const getRecordByIdValidation = [
  param('recordId')
    .isInt({ min: 1 })
    .withMessage('El ID del antecedente debe ser un número entero positivo')
    .toInt(),

  param('citizenId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para eliminar antecedente
 */
export const deleteRecordValidation = [
  param('recordId')
    .isInt({ min: 1 })
    .withMessage('El ID del antecedente debe ser un número entero positivo')
    .toInt(),

  param('citizenId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para búsqueda de antecedentes
 */
export const searchRecordsValidation = [
  body('term')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres'),

  body('location')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('La ubicación debe tener entre 2 y 255 caracteres'),

  body('citizen_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del ciudadano debe tener entre 2 y 100 caracteres'),

  body('date_from')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe estar en formato YYYY-MM-DD')
    .toDate(),

  body('date_to')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe estar en formato YYYY-MM-DD')
    .toDate(),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
    .toInt(),

  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser un número mayor o igual a 0')
    .toInt()
];

/**
 * Validación para filtros en obtener todos los antecedentes
 */
export const getAllRecordsValidation = [
  body('location')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('La ubicación debe tener entre 2 y 255 caracteres'),

  body('date_from')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe estar en formato YYYY-MM-DD')
    .toDate(),

  body('date_to')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe estar en formato YYYY-MM-DD')
    .toDate(),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
    .toInt(),

  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser un número mayor o igual a 0')
    .toInt()
];