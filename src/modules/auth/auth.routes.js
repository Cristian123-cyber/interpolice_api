import express from "express";
import {
  getAllUsers,
  getUserById,
  registerUser,
  deleteUser,
  updateUser,
  loginUser,
  changePassword,
  getAllRoles,
  getUserProfile,
} from "./auth.controller.js";

// Importar middleware de autenticación y autorización
import { authenticateToken, authorizeRole } from "../../middlewares/auth.middleware.js";

// Importar middleware de validación
import { handleValidationErrors, sanitizeInput } from "../../middlewares/validation.middleware.js";

// Importar validaciones específicas del módulo auth
import {
  registerUserValidation,
  loginUserValidation,
  updateUserValidation,
  getUserByIdValidation,
  deleteUserValidation,
  changePasswordValidation,
} from "./auth.validation.js";

const router = express.Router();

/**
 * Rutas públicas (sin autenticación requerida)
 */

// POST /auth/login - Iniciar sesión
router.post(
  "/login",
  sanitizeInput,
  loginUserValidation,
  handleValidationErrors,
  loginUser
);

// POST /auth/register - Registrar usuario (en desarrollo, podría requerir permisos)
router.post(
  "/register",
  sanitizeInput,
  registerUserValidation,
  handleValidationErrors,
  registerUser
);

/**
 * Rutas protegidas (requieren autenticación)
 */

// GET /auth/profile - Obtener perfil del usuario autenticado
router.get(
  "/profile",
  authenticateToken,
  getUserProfile
);

// GET /auth/roles - Obtener todos los roles (Admin y Commander pueden ver)
router.get(
  "/roles",
  authenticateToken,
  authorizeRole(['Admin', 'Commander']),
  getAllRoles
);

/**
 * Rutas de gestión de usuarios (requieren permisos especiales)
 */

// GET /auth/users - Obtener todos los usuarios (solo Admin)
router.get(
  "/users",
  authenticateToken,
  authorizeRole(['Admin']),
  getAllUsers
);

// GET /auth/users/:id - Obtener usuario por ID (Admin o el mismo usuario)
router.get(
  "/users/:id",
  authenticateToken,
  getUserByIdValidation,
  handleValidationErrors,
  // El controlador verificará si es el mismo usuario o un Admin
  getUserById
);

// PUT /auth/users/:id - Actualizar usuario (Admin o el mismo usuario)
router.put(
  "/users/:id",
  authenticateToken,
  sanitizeInput,
  updateUserValidation,
  handleValidationErrors,
  // El controlador verificará permisos específicos
  updateUser
);

// DELETE /auth/users/:id - Eliminar usuario (solo Admin)
router.delete(
  "/users/:id",
  authenticateToken,
  authorizeRole(['Admin']),
  deleteUserValidation,
  handleValidationErrors,
  deleteUser
);

// PUT /auth/users/:id/password - Cambiar contraseña
router.put(
  "/users/:id/password",
  authenticateToken,
  sanitizeInput,
  changePasswordValidation,
  handleValidationErrors,
  changePassword
);

/**
 * Rutas adicionales para administración avanzada (solo Admin)
 */

// POST /auth/users - Crear usuario (solo Admin, alternativa a register)
router.post(
  "/users",
  authenticateToken,
  authorizeRole(['Admin']),
  sanitizeInput,
  registerUserValidation,
  handleValidationErrors,
  registerUser
);

export default router;
