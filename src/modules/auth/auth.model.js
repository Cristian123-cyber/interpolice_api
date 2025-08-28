import connection from "../../config/Database.js";
import bcrypt from "bcryptjs";

/**
 * Modelo de datos para la gestión de usuarios y autenticación
 * Tabla users: id, username, password_hash, role_id, user_email
 * Tabla roles: id, role_name
 */

/**
 * Obtener todos los usuarios con información de rol
 * @returns {Promise<Array>} Lista de usuarios con roles
 */
export async function getUsersDB() {
  const query = `
    SELECT 
      u.id, 
      u.username, 
      u.user_email, 
      u.role_id,
      r.role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    ORDER BY u.id
  `;
  
  const [rows] = await connection.query(query);
  return rows;
}

/**
 * Obtener usuario por ID con información de rol
 * @param {number} id - ID del usuario
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export async function getUserByIdDB(id) {
  const query = `
    SELECT 
      u.id, 
      u.username, 
      u.user_email, 
      u.role_id,
      r.role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
  `;
  
  const [rows] = await connection.query(query, [id]);
  return rows[0] || null;
}

/**
 * Crear un nuevo usuario en la base de datos
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.username - Nombre de usuario
 * @param {string} userData.user_email - Email del usuario
 * @param {string} userData.password - Contraseña en texto plano
 * @param {number} userData.role_id - ID del rol
 * @returns {Promise<Object>} Resultado de la inserción
 */
export async function createUserDB(userData) {
  // Verificar si el username ya existe usando la función dedicada
  const usernameExists = await checkUsernameExistsDB(userData.username);
  if (usernameExists) {
    throw new Error("El nombre de usuario ya está en uso");
  }

  // Verificar si el email ya existe usando la función dedicada
  const emailExists = await checkEmailExistsDB(userData.user_email);
  if (emailExists) {
    throw new Error("El email ya está registrado");
  }

  // Verificar si el rol existe usando la función dedicada
  const roleExists = await checkRoleExistsDB(userData.role_id);
  if (!roleExists) {
    throw new Error("El rol especificado no existe");
  }

  // Crear el hash de la contraseña
  const passwordHash = bcrypt.hashSync(userData.password, 12);

  const newUser = {
    username: userData.username,
    user_email: userData.user_email,
    password_hash: passwordHash,
    role_id: userData.role_id,
  };

  const [result] = await connection.query("INSERT INTO users SET ?", [newUser]);
  return result;
}

/**
 * Actualizar datos de un usuario
 * @param {number} id - ID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise<Object>} Resultado de la actualización
 */
export async function updateUserDB(id, userData) {
  // Si se va a actualizar el username, verificar que no exista en otro usuario
  if (userData.username) {
    const usernameExists = await checkUsernameExistsForUpdateDB(userData.username, id);
    if (usernameExists) {
      throw new Error("El nombre de usuario ya está en uso");
    }
  }

  // Si se va a actualizar el email, verificar que no exista en otro usuario
  if (userData.user_email) {
    const emailExists = await checkEmailExistsForUpdateDB(userData.user_email, id);
    if (emailExists) {
      throw new Error("El email ya está registrado");
    }
  }

  // Si se va a actualizar el rol, verificar que exista usando función dedicada
  if (userData.role_id) {
    const roleExists = await checkRoleExistsDB(userData.role_id);
    if (!roleExists) {
      throw new Error("El rol especificado no existe");
    }
  }

  // Si se va a actualizar la contraseña, crear el hash
  if (userData.password) {
    userData.password_hash = bcrypt.hashSync(userData.password, 12);
    delete userData.password; // Eliminar la contraseña en texto plano
  }

  const [result] = await connection.query(
    "UPDATE users SET ? WHERE id = ?",
    [userData, id]
  );
  return result;
}

/**
 * Eliminar un usuario (solo para administradores)
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export async function deleteUserDB(id) {
  const [result] = await connection.query("DELETE FROM users WHERE id = ?", [id]);
  return result;
}

/**
 * Autenticar usuario por username/email y contraseña
 * @param {Object} credentials - Credenciales de login
 * @param {string} credentials.username - Username o email
 * @param {string} credentials.password - Contraseña
 * @returns {Promise<Object>} Usuario autenticado con rol
 */
export async function authenticateUserDB(credentials) {
  const { username, password } = credentials;

  // Buscar usuario por username o email
  const query = `
    SELECT 
      u.id, 
      u.username, 
      u.user_email, 
      u.password_hash, 
      u.role_id,
      r.role_name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.username = ? OR u.user_email = ?
  `;

  const [users] = await connection.query(query, [username, username]);

  if (users.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  const user = users[0];

  // Verificar contraseña
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error("Contraseña incorrecta");
  }

  // Remover el hash de la contraseña del resultado
  delete user.password_hash;

  return user;
}

/**
 * Cambiar contraseña de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function changePasswordDB(userId, currentPassword, newPassword) {
  // Obtener la contraseña actual del usuario
  const [users] = await connection.query(
    "SELECT password_hash FROM users WHERE id = ?",
    [userId]
  );

  if (users.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  const user = users[0];

  // Verificar contraseña actual
  const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

  if (!passwordMatch) {
    throw new Error("La contraseña actual es incorrecta");
  }

  // Crear hash de la nueva contraseña
  const newPasswordHash = bcrypt.hashSync(newPassword, 12);

  // Actualizar contraseña
  const [result] = await connection.query(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [newPasswordHash, userId]
  );

  return result;
}

/**
 * Obtener todos los roles disponibles
 * @returns {Promise<Array>} Lista de roles
 */
export async function getRolesDB() {
  const [rows] = await connection.query("SELECT * FROM roles ORDER BY id");
  return rows;
}

/**
 * Verificar si un usuario existe por username
 * @param {string} username - Nombre de usuario
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkUsernameExistsDB(username) {
  const [rows] = await connection.query(
    "SELECT id FROM users WHERE username = ?",
    [username]
  );
  return rows.length > 0;
}

/**
 * Verificar si un email existe
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkEmailExistsDB(email) {
  const [rows] = await connection.query(
    "SELECT id FROM users WHERE user_email = ?",
    [email]
  );
  return rows.length > 0;
}

/**
 * Verificar si un rol existe por ID
 * @param {number} roleId - ID del rol a verificar
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkRoleExistsDB(roleId) {
  const [rows] = await connection.query(
    "SELECT id FROM roles WHERE id = ?",
    [roleId]
  );
  return rows.length > 0;
}

/**
 * Verificar si un username existe en otro usuario (para actualizaciones)
 * @param {string} username - Username a verificar
 * @param {number} excludeUserId - ID del usuario a excluir de la búsqueda
 * @returns {Promise<boolean>} True si existe en otro usuario, false si no
 */
export async function checkUsernameExistsForUpdateDB(username, excludeUserId) {
  const [rows] = await connection.query(
    "SELECT id FROM users WHERE username = ? AND id != ?",
    [username, excludeUserId]
  );
  return rows.length > 0;
}

/**
 * Verificar si un email existe en otro usuario (para actualizaciones)
 * @param {string} email - Email a verificar
 * @param {number} excludeUserId - ID del usuario a excluir de la búsqueda
 * @returns {Promise<boolean>} True si existe en otro usuario, false si no
 */
export async function checkEmailExistsForUpdateDB(email, excludeUserId) {
  const [rows] = await connection.query(
    "SELECT id FROM users WHERE user_email = ? AND id != ?",
    [email, excludeUserId]
  );
  return rows.length > 0;
}
