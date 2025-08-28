import express from "express";
import {
  getCitationsByCitizen,
  getCitationById,
  getAllCitations,
  createCitation,
  updateCitation,
  deleteCitation,
  getCitationsCount,
  getCitationsStats,
  searchCitations,
  getTopOffenders,
  getCitizenPenaltySummary
} from "./citations.controller.js";

// Importar middleware de autenticación y autorización
import { authenticateToken, authorizeRole } from "../../middlewares/auth.middleware.js";

// Importar middleware de validación
import { handleValidationErrors, sanitizeInput } from "../../middlewares/validation.middleware.js";

// Importar validaciones específicas del módulo citations
import {
  createCitationValidation,
  updateCitationValidation,
  getCitationsByCitizenValidation,
  getCitationByIdValidation,
  deleteCitationValidation,
  searchCitationsValidation,
  getAllCitationsValidation,
  getCitizenPenaltySummaryValidation
} from "./citations.validation.js";

const router = express.Router({ mergeParams: true }); // mergeParams para acceder a :citizenId

/**
 * Rutas para citaciones (amonestaciones menores) según la matriz de permisos:
 * - Ver citaciones: Todos los roles autenticados
 * - Crear citaciones: Admin, PoliceOfficer
 * - Actualizar citaciones: Solo Admin
 * - Eliminar citaciones: Solo Admin
 */

/**
 * Rutas principales de CRUD para citaciones
 * Base URL: /api/citizens/:citizenId/citations
 */

// GET /api/citizens/:citizenId/citations - Obtener citaciones de un ciudadano
// (todos los roles autenticados pueden ver)
router.get(
  "/",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getCitationsByCitizenValidation,
  handleValidationErrors,
  getCitationsByCitizen
);

// GET /api/citizens/:citizenId/citations/count - Obtener conteo de citaciones
// (todos los roles autenticados pueden ver)
router.get(
  "/count",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getCitationsByCitizenValidation,
  handleValidationErrors,
  getCitationsCount
);

// GET /api/citizens/:citizenId/citations/penalty-summary - Obtener resumen de penalizaciones
// (todos los roles autenticados pueden ver)
router.get(
  "/penalty-summary",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getCitizenPenaltySummaryValidation,
  handleValidationErrors,
  getCitizenPenaltySummary
);

// GET /api/citizens/:citizenId/citations/:citationId - Obtener citación específica
// (todos los roles autenticados pueden ver)
router.get(
  "/:citationId",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  getCitationByIdValidation,
  handleValidationErrors,
  getCitationById
);

// POST /api/citizens/:citizenId/citations - Crear nueva citación con penalización automática
// (Admin, PoliceOfficer pueden crear - según matriz de permisos)
router.post(
  "/",
  authenticateToken,
  authorizeRole(['Admin', 'PoliceOfficer']),
  sanitizeInput, // Limpiar datos de entrada
  createCitationValidation, // Validar datos de la citación
  handleValidationErrors, // Manejar errores de validación
  createCitation // Controlador de creación con lógica de penalización
);

// PUT /api/citizens/:citizenId/citations/:citationId - Actualizar citación
// (solo Admin puede actualizar citaciones)
router.put(
  "/:citationId",
  authenticateToken,
  authorizeRole(['Admin']),
  sanitizeInput,
  updateCitationValidation,
  handleValidationErrors,
  updateCitation
);

// DELETE /api/citizens/:citizenId/citations/:citationId - Eliminar citación
// (solo Admin puede eliminar)
router.delete(
  "/:citationId",
  authenticateToken,
  authorizeRole(['Admin']),
  deleteCitationValidation,
  handleValidationErrors,
  deleteCitation
);

/**
 * Rutas adicionales para búsqueda y estadísticas de citaciones
 * Estas rutas NO requieren citizenId ya que buscan en todos los registros
 */

// GET /api/citations/search - Buscar citaciones por criterios
// (todos los roles autenticados pueden buscar)
const citationsSearchRouter = express.Router();
citationsSearchRouter.get(
  "/search",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General', 'CourtClerk', 'PoliceOfficer']),
  searchCitations
);

// GET /api/citations/all - Obtener todas las citaciones (con filtros)
// (Admin, Commander, General pueden ver todos los registros)
citationsSearchRouter.get(
  "/all",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General']),
  getAllCitations
);

// GET /api/citations/stats - Obtener estadísticas de citaciones
// (Admin, Commander, General pueden ver estadísticas)
citationsSearchRouter.get(
  "/stats",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General']),
  getCitationsStats
);

// GET /api/citations/top-offenders - Obtener principales infractores
// (Admin, Commander, General pueden ver reportes)
citationsSearchRouter.get(
  "/top-offenders",
  authenticateToken,
  authorizeRole(['Admin', 'Commander', 'General']),
  getTopOffenders
);

// Exportar ambos routers
export default router;
export { citationsSearchRouter };