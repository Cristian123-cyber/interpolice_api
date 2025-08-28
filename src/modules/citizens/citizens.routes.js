import express from "express";
import {
  getAll,
  getOne,
  create,
  update,
  deleteOne,
  getAllStatuses,
  getAllPlanets,
  searchCitizens,
  getStats
} from "./citizens.controller.js";

// Importar middleware de autenticación y autorización
import { authenticateToken, authorizeRole } from "../../middlewares/auth.middleware.js";

// Importar middleware de validación
import { handleValidationErrors, sanitizeInput } from "../../middlewares/validation.middleware.js";

// Importar middleware de subida de archivos
import { uploadAvatarWithErrorHandling, optionalFileUpload } from "../../middlewares/upload.middleware.js";

// Importar validaciones específicas del módulo citizens
import {
  createCitizenValidation,
  updateCitizenValidation,
  getCitizenByIdValidation,
  deleteCitizenValidation
} from "./citizens.validation.js";

const router = express.Router();

/**
 * Rutas principales de CRUD para ciudadanos
 */

// GET /api/citizens - Obtener todos los ciudadanos (todos los roles autenticados pueden ver)
router.get(
  "/",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getAll
);

// GET /api/citizens/search - Buscar ciudadanos (todos los roles autenticados)
router.get(
  "/search",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  searchCitizens
);

// GET /api/citizens/stats - Obtener estadísticas (Admin, Commander, General)
router.get(
  "/stats",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General']),
  getStats
);

// GET /api/citizens/planets - Obtener planetas disponibles (todos los roles)
router.get(
  "/planets",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getAllPlanets
);

// GET /api/citizens/statuses - Obtener estados disponibles (todos los roles)
router.get(
  "/statuses",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getAllStatuses
);

// GET /api/citizens/:id - Obtener ciudadano por ID (todos los roles autenticados)
router.get(
  "/:id",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getCitizenByIdValidation,
  handleValidationErrors,
  getOne
);

// POST /api/citizens - Crear nuevo ciudadano con subida de imagen
// (Admin, CourtClerk, PoliceOfficer pueden crear)
router.post(
  "/",
  authenticateToken,
  authorizeRole(['Admin', 'CourtClerk', 'PoliceOfficer']),
  uploadAvatarWithErrorHandling, // Manejo de subida de imagen
  optionalFileUpload, // Configurar URL del avatar
  sanitizeInput, // Limpiar datos de entrada
  createCitizenValidation, // Validar datos del ciudadano
  handleValidationErrors, // Manejar errores de validación
  create // Controlador de creación
);

// PUT /api/citizens/:id - Actualizar ciudadano (Admin, CourtClerk)
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(['Admin', 'CourtClerk']),
  sanitizeInput,
  updateCitizenValidation,
  handleValidationErrors,
  update
);

// DELETE /api/citizens/:id - Eliminar ciudadano (solo Admin)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(['Admin']),
  deleteCitizenValidation,
  handleValidationErrors,
  deleteOne
);

export default router;
