import { body, param } from 'express-validator';

/**
 * Validaciones para el módulo de autenticación
 * Basado en el esquema de la tabla users: id, username, password_hash, role_id, user_email
 */

/**
 * Validaciones para el registro de un nuevo usuario
 */
export const registerUserValidation = [
  // Validación del nombre de usuario
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio')
    .isString()
    .withMessage('El nombre de usuario debe ser texto')
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre de usuario debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),

  // Validación del email
  body('user_email')
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .isLength({ max: 200 })
    .withMessage('El email no puede exceder 200 caracteres')
    .normalizeEmail(),

  // Validación de la contraseña
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 6, max: 50 })
    .withMessage('La contraseña debe tener entre 6 y 50 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),

  // Validación del rol
  body('role_id')
    .notEmpty()
    .withMessage('El rol es obligatorio')
    .isInt({ min: 1 })
    .withMessage('El rol debe ser un número entero válido')
    .toInt()
];

/**
 * Validaciones para el login de usuario
 */
export const loginUserValidation = [
  // Email o username para login
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario o email es obligatorio')
    .isString()
    .withMessage('Debe ser un texto válido'),

  // Contraseña para login
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isString()
    .withMessage('La contraseña debe ser texto')
    .isLength({ min: 1 })
    .withMessage('La contraseña no puede estar vacía')
];

/**
 * Validaciones para actualizar un usuario
 */
export const updateUserValidation = [
  // Validación del ID en los parámetros
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del usuario debe ser un número entero positivo')
    .toInt(),

  // Username opcional para actualización
  body('username')
    .optional()
    .isString()
    .withMessage('El nombre de usuario debe ser texto')
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre de usuario debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),

  // Email opcional para actualización
  body('user_email')
    .optional()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .isLength({ max: 200 })
    .withMessage('El email no puede exceder 200 caracteres')
    .normalizeEmail(),

  // Nueva contraseña opcional
  body('password')
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage('La contraseña debe tener entre 6 y 50 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número'),

  // Rol opcional para actualización
  body('role_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El rol debe ser un número entero válido')
    .toInt()
];

/**
 * Validación para obtener usuario por ID
 */
export const getUserByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del usuario debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para eliminar usuario
 */
export const deleteUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del usuario debe ser un número entero positivo')
    .toInt()
];

/**
 * Validación para cambio de contraseña
 */
export const changePasswordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del usuario debe ser un número entero positivo')
    .toInt(),

  body('current_password')
    .notEmpty()
    .withMessage('La contraseña actual es obligatoria'),

  body('new_password')
    .notEmpty()
    .withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 6, max: 50 })
    .withMessage('La nueva contraseña debe tener entre 6 y 50 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número'),

  body('confirm_password')
    .notEmpty()
    .withMessage('La confirmación de contraseña es obligatoria')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];