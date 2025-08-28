import { body, param } from 'express-validator';
import { checkCitizenExistsDB } from './citations.model.js';

/**
 * Validaciones para el módulo de citaciones (amonestaciones menores)
 * Basado en el esquema de la tabla citations: id, citizen_id, date, description, fine_amount
 */

/**
 * Validaciones para crear una nueva citación
 */
export const createCitationValidation = [
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

  // Validación de la descripción de la infracción
  body('description')
    .notEmpty()
    .withMessage('La descripción de la infracción es obligatoria')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres')
    .trim()
    .custom((value) => {
      // Lista de infracciones menores válidas según el contexto
      const commonMinorOffenses = [
        'ruido', 'noise', 'sonido', 'música',
        'orinarse', 'urinating', 'orinar', 'micción', 'pis',
        'basura', 'trash', 'litter', 'tirar basura',
        'escupir', 'spitting', 'spit',
        'graffiti', 'vandalismo menor', 'rayar',
        'fumar', 'smoking', 'cigarrillo',
        'beber', 'alcohol', 'bebida alcohólica',
        'mascota', 'pet', 'perro', 'dog', 'gato', 'cat',
        'estacionamiento', 'parking', 'aparcar',
        'velocidad', 'speed', 'exceso',
        'peatón', 'pedestrian', 'cruzar',
        'bicicleta', 'bicycle', 'bike',
        'alteración', 'disturbance', 'desorden',
        'público', 'public', 'vía pública'
      ];
      
      const normalizedValue = value.toLowerCase();
      const containsMinorOffense = commonMinorOffenses.some(offense => 
        normalizedValue.includes(offense.toLowerCase())
      );
      
      if (!containsMinorOffense) {
        console.warn(`Posible infracción no menor detectada: ${value}`);
        // No lanzar error, solo advertencia - permitir flexibilidad
      }
      
      return true;
    })
];

/**
 * Validaciones para actualizar una citación
 */
export const updateCitationValidation = [
  // Validación del ID de la citación en la URL
  param('citationId')
    .isInt({ min: 1 })
    .withMessage('El ID de la citación debe ser un número entero positivo')
    .toInt(),

  // Validación del ID del ciudadano en la URL (opcional para update)
  param('citizenId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt(),

  // Validaciones opcionales para actualización
  body('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres')
    .trim(),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe estar en formato ISO8601')
    .custom((value) => {
      if (value) {
        const citationDate = new Date(value);
        const today = new Date();
        if (citationDate > today) {
          throw new Error('La fecha de la citación no puede ser futura');
        }
        // Verificar que no sea muy antigua (más de 1 año)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (citationDate < oneYearAgo) {
          throw new Error('La fecha de la citación no puede ser anterior a 1 año');
        }
      }
      return true;
    })
    .toDate(),

  body('fine_amount')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('El monto de la multa debe ser un número entre 0 y 10000')
    .custom((value) => {
      // Validar que el monto sea múltiplo de $400 o valores estándar
      const standardAmounts = [0, 400, 800, 1200, 1600, 2000];
      if (value && !standardAmounts.includes(parseFloat(value))) {
        console.warn(`Monto de multa no estándar: $${value}. Se recomienda usar múltiplos de $400`);
      }
      return true;
    })
    .toFloat(),

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
 * Validación para obtener citaciones por ID de ciudadano
 */
export const getCitationsByCitizenValidation = [
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
 * Validación para obtener citación específica por ID
 */
export const getCitationByIdValidation = [
  param('citationId')
    .isInt({ min: 1 })
    .withMessage('El ID de la citación debe ser un número entero positivo')
    .toInt(),

  param('citizenId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para eliminar citación
 */
export const deleteCitationValidation = [
  param('citationId')
    .isInt({ min: 1 })
    .withMessage('El ID de la citación debe ser un número entero positivo')
    .toInt(),

  param('citizenId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del ciudadano debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para búsqueda de citaciones
 */
export const searchCitationsValidation = [
  body('term')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres'),

  body('citizen_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del ciudadano debe tener entre 2 y 100 caracteres'),

  body('date_from')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe estar en formato ISO8601')
    .toDate(),

  body('date_to')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe estar en formato ISO8601')
    .toDate(),

  body('fine_amount_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto mínimo de multa debe ser un número mayor o igual a 0')
    .toFloat(),

  body('fine_amount_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto máximo de multa debe ser un número mayor o igual a 0')
    .toFloat(),

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
 * Validación para filtros en obtener todas las citaciones
 */
export const getAllCitationsValidation = [
  body('location')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('La ubicación debe tener entre 2 y 255 caracteres'),

  body('date_from')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe estar en formato ISO8601')
    .toDate(),

  body('date_to')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe estar en formato ISO8601')
    .toDate(),

  body('fine_amount_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto mínimo de multa debe ser un número mayor o igual a 0')
    .toFloat(),

  body('fine_amount_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto máximo de multa debe ser un número mayor o igual a 0')
    .toFloat(),

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
 * Validación para obtener resumen de penalizaciones de un ciudadano
 */
export const getCitizenPenaltySummaryValidation = [
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