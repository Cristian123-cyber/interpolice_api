import express from "express";
import {
  getRecordsByCitizen,
  getRecordById,
  getAllRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  getRecordsCount,
  getRecordsStats,
  searchRecords,
  getMostDangerousLocations
} from "./records.controller.js";

// Importar middleware de autenticación y autorización
import { authenticateToken, authorizeRole } from "../../middlewares/auth.middleware.js";

// Importar middleware de validación
import { handleValidationErrors, sanitizeInput } from "../../middlewares/validation.middleware.js";

// Importar validaciones específicas del módulo records
import {
  createRecordValidation,
  updateRecordValidation,
  getRecordsByCitizenValidation,
  getRecordByIdValidation,
  deleteRecordValidation,
  searchRecordsValidation,
  getAllRecordsValidation
} from "./records.validation.js";

const router = express.Router({ mergeParams: true }); // mergeParams para acceder a :citizenId

/**
 * Rutas para antecedentes penales según la matriz de permisos:
 * - Ver antecedentes: Todos los roles autenticados
 * - Crear antecedentes: Admin, CourtClerk
 * - Actualizar antecedentes: Solo Admin
 * - Eliminar antecedentes: Solo Admin
 */

/**
 * Rutas principales de CRUD para antecedentes penales
 * Base URL: /api/citizens/:citizenId/records
 */

// GET /api/citizens/:citizenId/records - Obtener antecedentes de un ciudadano
// (todos los roles autenticados pueden ver)
router.get(
  "/",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getRecordsByCitizenValidation,
  handleValidationErrors,
  getRecordsByCitizen
);

// GET /api/citizens/:citizenId/records/count - Obtener conteo de antecedentes
// (todos los roles autenticados pueden ver)
router.get(
  "/count",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getRecordsByCitizenValidation,
  handleValidationErrors,
  getRecordsCount
);

// GET /api/citizens/:citizenId/records/:recordId - Obtener antecedente específico
// (todos los roles autenticados pueden ver)
router.get(
  "/:recordId",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getRecordByIdValidation,
  handleValidationErrors,
  getRecordById
);

// POST /api/citizens/:citizenId/records - Crear nuevo antecedente penal
// (Admin, CourtClerk pueden crear - según matriz de permisos)
router.post(
  "/",
  authenticateToken,
  authorizeRole(['Admin', 'CourtClerk']),
  sanitizeInput, // Limpiar datos de entrada
  createRecordValidation, // Validar datos del antecedente
  handleValidationErrors, // Manejar errores de validación
  createRecord // Controlador de creación
);

// PUT /api/citizens/:citizenId/records/:recordId - Actualizar antecedente
// (solo Admin puede actualizar antecedentes)
router.put(
  "/:recordId",
  authenticateToken,
  authorizeRole(['Admin']),
  sanitizeInput,
  updateRecordValidation,
  handleValidationErrors,
  updateRecord
);

// DELETE /api/citizens/:citizenId/records/:recordId - Eliminar antecedente
// (solo Admin puede eliminar)
router.delete(
  "/:recordId",
  authenticateToken,
  authorizeRole(['Admin']),
  deleteRecordValidation,
  handleValidationErrors,
  deleteRecord
);

/**
 * Rutas adicionales para búsqueda y estadísticas
 * Estas rutas NO requieren citizenId ya que buscan en todos los registros
 */

// GET /api/records/search - Buscar antecedentes por criterios
// (todos los roles autenticados pueden buscar)
const recordsSearchRouter = express.Router();
recordsSearchRouter.get(
  "/search",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  searchRecords
);

// GET /api/records/all - Obtener todos los antecedentes (con filtros)
// (Admin, Commander, General pueden ver todos los registros)
recordsSearchRouter.get(
  "/all",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General']),
  getAllRecords
);

// GET /api/records/stats - Obtener estadísticas de antecedentes
// (Admin, Commander, General pueden ver estadísticas)
recordsSearchRouter.get(
  "/stats",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General']),
  getRecordsStats
);

// GET /api/records/dangerous-locations - Obtener ubicaciones más peligrosas
// (Admin, Commander, General pueden ver reportes)
recordsSearchRouter.get(
  "/dangerous-locations",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General']),
  getMostDangerousLocations
);

// Exportar ambos routers
export default router;
export { recordsSearchRouter };