import {
  getUsersDB,
  getUserByIdDB,
  createUserDB,
  updateUserDB,
  deleteUserDB,
  authenticateUserDB,
  changePasswordDB,
  getRolesDB,
} from "./auth.model.js";
import { generateToken } from "../../middlewares/auth.middleware.js";

/**
 * Controlador para la gestión de usuarios y autenticación
 * Implementa JWT, manejo de errores y validaciones
 */

/**
 * Obtener todos los usuarios (solo Admin)
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getAllUsers(req, res) {
  try {
    const users = await getUsersDB();
    
    res.status(200).json({
      status: "success",
      message: "Usuarios obtenidos correctamente",
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener usuarios",
      error: error.message
    });
  }
}

/**
 * Obtener usuario por ID
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await getUserByIdDB(id);
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Usuario obtenido correctamente",
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener el usuario",
      error: error.message
    });
  }
}

/**
 * Registrar un nuevo usuario
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function registerUser(req, res) {
  try {
    const userData = req.body;
    
    // Los datos ya vienen validados por el middleware de validación
    const result = await createUserDB(userData);
    
    // Obtener el usuario recién creado para generar el token
    const newUser = await getUserByIdDB(result.insertId);
    
    // Generar token JWT
    const token = generateToken({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role_name,
      email: newUser.user_email
    });
    
    res.status(201).json({
      status: "success",
      message: "Usuario registrado exitosamente",
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.user_email,
          role: newUser.role_name
        },
        token: token
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    
    // Manejar errores específicos de validación de base de datos
    if (error.message.includes('ya está en uso') || 
        error.message.includes('ya está registrado') ||
        error.message.includes('no existe')) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al registrar usuario",
      error: error.message
    });
  }
}

/**
 * Actualizar datos de un usuario
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verificar que el usuario existe antes de actualizar
    const existingUser = await getUserByIdDB(id);
    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }
    
    // Los datos ya vienen validados por el middleware
    const result = await updateUserDB(id, updateData);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        status: "error",
        message: "No se realizaron cambios en el usuario"
      });
    }
    
    // Obtener los datos actualizados del usuario
    const updatedUser = await getUserByIdDB(id);
    
    res.status(200).json({
      status: "success",
      message: "Usuario actualizado correctamente",
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.user_email,
        role: updatedUser.role_name
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    
    // Manejar errores específicos de validación
    if (error.message.includes('ya está en uso') || 
        error.message.includes('ya está registrado') ||
        error.message.includes('no existe')) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al actualizar usuario",
      error: error.message
    });
  }
}

/**
 * Eliminar un usuario (solo Admin)
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el usuario existe
    const existingUser = await getUserByIdDB(id);
    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }
    
    // Evitar que el usuario se elimine a sí mismo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        status: "error",
        message: "No puedes eliminar tu propia cuenta"
      });
    }
    
    const result = await deleteUserDB(id);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        status: "error",
        message: "No se pudo eliminar el usuario"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Usuario eliminado correctamente",
      data: {
        deleted_user: {
          id: existingUser.id,
          username: existingUser.username
        }
      }
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al eliminar usuario",
      error: error.message
    });
  }
}

/**
 * Autenticar usuario (login)
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    
    // Autenticar usuario
    const user = await authenticateUserDB({ username, password });
    
    // Generar token JWT
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role_name,
      email: user.user_email
    });
    
    res.status(200).json({
      status: "success",
      message: "Login exitoso",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.user_email,
          role: user.role_name
        },
        token: token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    
    // Manejar errores específicos de autenticación
    if (error.message.includes('no encontrado') || 
        error.message.includes('incorrecta')) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas"
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor en el login",
      error: error.message
    });
  }
}

/**
 * Cambiar contraseña de un usuario
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function changePassword(req, res) {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;
    
    // Verificar que el usuario existe
    const existingUser = await getUserByIdDB(id);
    if (!existingUser) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }
    
    // Solo el mismo usuario o un admin puede cambiar la contraseña
    if (req.user.id !== parseInt(id) && req.user.role !== 'Admin') {
      return res.status(403).json({
        status: "error",
        message: "No tienes permisos para cambiar esta contraseña"
      });
    }
    
    const result = await changePasswordDB(id, current_password, new_password);
    
    res.status(200).json({
      status: "success",
      message: "Contraseña cambiada correctamente"
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    
    // Manejar errores específicos
    if (error.message.includes('incorrecta') || 
        error.message.includes('no encontrado')) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al cambiar contraseña",
      error: error.message
    });
  }
}

/**
 * Obtener todos los roles disponibles
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getAllRoles(req, res) {
  try {
    const roles = await getRolesDB();
    
    res.status(200).json({
      status: "success",
      message: "Roles obtenidos correctamente",
      data: roles
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener roles",
      error: error.message
    });
  }
}

/**
 * Obtener información del perfil del usuario autenticado
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const user = await getUserByIdDB(userId);
    
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Perfil obtenido correctamente",
      data: {
        id: user.id,
        username: user.username,
        email: user.user_email,
        role: user.role_name
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener perfil",
      error: error.message
    });
  }
}
