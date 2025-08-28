import connection from "../../config/Database.js";

/**
 * Modelo de datos para la gestión de ciudadanos
 * Tabla citizens: id, full_name, last_name, nick_name, birth_date, 
 * origin_planet, residence_planet, avatar_url, qr_code, status_id
 * Tabla statuses: id, status_name, description
 * Tabla planets: id, planet_name
 * Relaciones: citizens.origin_planet -> planets.id, citizens.residence_planet -> planets.id
 */

/**
 * Obtener todos los ciudadanos con información de estado
 * @returns {Promise<Array>} Lista de ciudadanos con estados
 */
export async function getCitizensDB() {
  const query = `
    SELECT 
      c.id, 
      c.full_name, 
      c.last_name,
      c.nick_name, 
      c.birth_date, 
      c.origin_planet, 
      c.residence_planet, 
      c.avatar_url, 
      c.qr_code, 
      c.status_id,
      s.status_name,
      s.description as status_description,
      po.planet_name as origin_planet_name,
      pr.planet_name as residence_planet_name
    FROM citizens c
    INNER JOIN statuses s ON c.status_id = s.id
    INNER JOIN planets po ON c.origin_planet = po.id
    INNER JOIN planets pr ON c.residence_planet = pr.id
    ORDER BY c.id
  `;
  
  const [rows] = await connection.query(query);
  return rows;
}

/**
 * Obtener ciudadano por ID con información de estado
 * @param {number} id - ID del ciudadano
 * @returns {Promise<Object|null>} Ciudadano encontrado o null
 */
export async function getCitizenByIdDB(id) {
  const query = `
    SELECT 
      c.id, 
      c.full_name, 
      c.last_name,
      c.nick_name, 
      c.birth_date, 
      c.origin_planet, 
      c.residence_planet, 
      c.avatar_url, 
      c.qr_code, 
      c.status_id,
      s.status_name,
      s.description as status_description,
      po.planet_name as origin_planet_name,
      pr.planet_name as residence_planet_name
    FROM citizens c
    INNER JOIN statuses s ON c.status_id = s.id
    INNER JOIN planets po ON c.origin_planet = po.id
    INNER JOIN planets pr ON c.residence_planet = pr.id
    WHERE c.id = ?
  `;
  
  const [rows] = await connection.query(query, [id]);
  return rows[0] || null;
}

/**
 * Crear un nuevo ciudadano en la base de datos
 * @param {Object} citizenData - Datos del ciudadano
 * @param {string} citizenData.full_name - Nombre completo
 * @param {string} citizenData.last_name - Apellido (opcional)
 * @param {string} citizenData.nick_name - Nickname (opcional)
 * @param {string} citizenData.birth_date - Fecha de nacimiento
 * @param {string} citizenData.origin_planet - Planeta de origen
 * @param {string} citizenData.residence_planet - Planeta de residencia
 * @param {string} citizenData.avatar_url - URL del avatar
 * @param {string} citizenData.qr_code - Código QR único
 * @param {number} citizenData.status_id - ID del estado
 * @returns {Promise<Object>} Resultado de la inserción
 */
export async function createCitizenDB(citizenData) {
  // Verificar si el nickname ya existe (si se proporciona)
  if (citizenData.nick_name) {
    const nicknameExists = await checkNicknameExistsDB(citizenData.nick_name);
    if (nicknameExists) {
      throw new Error("El nickname ya está en uso");
    }
  }

  // Verificar si el código QR ya existe
  const qrCodeExists = await checkQrCodeExistsDB(citizenData.qr_code);
  if (qrCodeExists) {
    throw new Error("El código QR ya está registrado");
  }

  // Verificar si el estado existe
  const statusExists = await checkStatusExistsDB(citizenData.status_id);
  if (!statusExists) {
    throw new Error("El estado especificado no existe");
  }

  // Verificar si los planetas existen
  const originPlanetExists = await checkPlanetExistsDB(citizenData.origin_planet);
  if (!originPlanetExists) {
    throw new Error("El planeta de origen especificado no existe");
  }

  const residencePlanetExists = await checkPlanetExistsDB(citizenData.residence_planet);
  if (!residencePlanetExists) {
    throw new Error("El planeta de residencia especificado no existe");
  }

  const newCitizen = {
    full_name: citizenData.full_name,
    last_name: citizenData.last_name || null,
    nick_name: citizenData.nick_name || null,
    birth_date: citizenData.birth_date, // Mantener como string YYYY-MM-DD
    origin_planet: citizenData.origin_planet,
    residence_planet: citizenData.residence_planet,
    avatar_url: citizenData.avatar_url,
    qr_code: citizenData.qr_code,
    status_id: citizenData.status_id,
  };

  const [result] = await connection.query("INSERT INTO citizens SET ?", [newCitizen]);
  return result;
}

/**
 * Actualizar datos de un ciudadano
 * @param {number} id - ID del ciudadano
 * @param {Object} citizenData - Datos a actualizar
 * @returns {Promise<Object>} Resultado de la actualización
 */
export async function updateCitizenDB(id, citizenData) {
  // Si se va a actualizar el nickname, verificar que no exista en otro ciudadano
  if (citizenData.nick_name) {
    const nicknameExists = await checkNicknameExistsForUpdateDB(citizenData.nick_name, id);
    if (nicknameExists) {
      throw new Error("El nickname ya está en uso");
    }
  }

  // Si se va a actualizar el código QR, verificar que no exista en otro ciudadano
  if (citizenData.qr_code) {
    const qrCodeExists = await checkQrCodeExistsForUpdateDB(citizenData.qr_code, id);
    if (qrCodeExists) {
      throw new Error("El código QR ya está registrado");
    }
  }

  // Si se va a actualizar el estado, verificar que exista
  if (citizenData.status_id) {
    const statusExists = await checkStatusExistsDB(citizenData.status_id);
    if (!statusExists) {
      throw new Error("El estado especificado no existe");
    }
  }

  // Si se van a actualizar los planetas, verificar que existan
  if (citizenData.origin_planet) {
    const originPlanetExists = await checkPlanetExistsDB(citizenData.origin_planet);
    if (!originPlanetExists) {
      throw new Error("El planeta de origen especificado no existe");
    }
  }

  if (citizenData.residence_planet) {
    const residencePlanetExists = await checkPlanetExistsDB(citizenData.residence_planet);
    if (!residencePlanetExists) {
      throw new Error("El planeta de residencia especificado no existe");
    }
  }

  const [result] = await connection.query(
    "UPDATE citizens SET ? WHERE id = ?",
    [citizenData, id]
  );
  return result;
}

/**
 * Eliminar un ciudadano (solo para administradores)
 * @param {number} id - ID del ciudadano
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export async function deleteCitizenDB(id) {
  const [result] = await connection.query("DELETE FROM citizens WHERE id = ?", [id]);
  return result;
}

/**
 * Obtener todos los estados disponibles
 * @returns {Promise<Array>} Lista de estados
 */
export async function getStatusesDB() {
  const [rows] = await connection.query("SELECT * FROM statuses ORDER BY id");
  return rows;
}

/**
 * Buscar ciudadanos por diferentes criterios
 * @param {Object} searchCriteria - Criterios de búsqueda
 * @param {string} searchCriteria.name - Buscar por nombre
 * @param {string} searchCriteria.nickname - Buscar por nickname
 * @param {string} searchCriteria.planet - Buscar por planeta
 * @param {number} searchCriteria.status_id - Filtrar por estado
 * @returns {Promise<Array>} Lista de ciudadanos que coinciden
 */
export async function searchCitizensDB(searchCriteria) {
  let query = `
    SELECT 
      c.id, 
      c.full_name, 
      c.last_name,
      c.nick_name, 
      c.birth_date, 
      c.origin_planet, 
      c.residence_planet, 
      c.avatar_url, 
      c.qr_code, 
      c.status_id,
      s.status_name,
      po.planet_name as origin_planet_name,
      pr.planet_name as residence_planet_name
    FROM citizens c
    INNER JOIN statuses s ON c.status_id = s.id
    INNER JOIN planets po ON c.origin_planet = po.id
    INNER JOIN planets pr ON c.residence_planet = pr.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (searchCriteria.name) {
    query += " AND (c.full_name LIKE ? OR c.last_name LIKE ?)";
    const namePattern = `%${searchCriteria.name}%`;
    params.push(namePattern, namePattern);
  }
  
  if (searchCriteria.nickname) {
    query += " AND c.nick_name LIKE ?";
    params.push(`%${searchCriteria.nickname}%`);
  }
  
  if (searchCriteria.planet) {
    query += " AND (po.planet_name LIKE ? OR pr.planet_name LIKE ?)";
    const planetPattern = `%${searchCriteria.planet}%`;
    params.push(planetPattern, planetPattern);
  }
  
  if (searchCriteria.status_id) {
    query += " AND c.status_id = ?";
    params.push(searchCriteria.status_id);
  }
  
  query += " ORDER BY c.full_name";
  
  const [rows] = await connection.query(query, params);
  return rows;
}

/**
 * Verificar si un nickname existe
 * @param {string} nickname - Nickname a verificar
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkNicknameExistsDB(nickname) {
  const [rows] = await connection.query(
    "SELECT id FROM citizens WHERE nick_name = ?",
    [nickname]
  );
  return rows.length > 0;
}

/**
 * Verificar si un código QR existe
 * @param {string} qrCode - Código QR a verificar
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkQrCodeExistsDB(qrCode) {
  const [rows] = await connection.query(
    "SELECT id FROM citizens WHERE qr_code = ?",
    [qrCode]
  );
  return rows.length > 0;
}

/**
 * Verificar si un estado existe por ID
 * @param {number} statusId - ID del estado a verificar
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkStatusExistsDB(statusId) {
  const [rows] = await connection.query(
    "SELECT id FROM statuses WHERE id = ?",
    [statusId]
  );
  return rows.length > 0;
}

/**
 * Verificar si un nickname existe en otro ciudadano (para actualizaciones)
 * @param {string} nickname - Nickname a verificar
 * @param {number} excludeCitizenId - ID del ciudadano a excluir de la búsqueda
 * @returns {Promise<boolean>} True si existe en otro ciudadano, false si no
 */
export async function checkNicknameExistsForUpdateDB(nickname, excludeCitizenId) {
  const [rows] = await connection.query(
    "SELECT id FROM citizens WHERE nick_name = ? AND id != ?",
    [nickname, excludeCitizenId]
  );
  return rows.length > 0;
}

/**
 * Verificar si un código QR existe en otro ciudadano (para actualizaciones)
 * @param {string} qrCode - Código QR a verificar
 * @param {number} excludeCitizenId - ID del ciudadano a excluir de la búsqueda
 * @returns {Promise<boolean>} True si existe en otro ciudadano, false si no
 */
export async function checkQrCodeExistsForUpdateDB(qrCode, excludeCitizenId) {
  const [rows] = await connection.query(
    "SELECT id FROM citizens WHERE qr_code = ? AND id != ?",
    [qrCode, excludeCitizenId]
  );
  return rows.length > 0;
}

/**
 * Obtener estadísticas de ciudadanos
 * @returns {Promise<Object>} Estadísticas generales
 */
export async function getCitizenStatsDB() {
  const query = `
    SELECT 
      COUNT(*) as total_citizens,
      COUNT(CASE WHEN status_id = 1 THEN 1 END) as alive_citizens,
      COUNT(CASE WHEN status_id = 0 THEN 1 END) as dead_citizens,
      COUNT(CASE WHEN status_id = 2 THEN 1 END) as frozen_citizens,
      COUNT(DISTINCT origin_planet) as total_origin_planets,
      COUNT(DISTINCT residence_planet) as total_residence_planets
    FROM citizens
  `;
  
  const [rows] = await connection.query(query);
  return rows[0];
}

/**
 * Obtener todos los planetas disponibles
 * @returns {Promise<Array>} Lista de planetas
 */
export async function getPlanetsDB() {
  const [rows] = await connection.query("SELECT * FROM planets ORDER BY id");
  return rows;
}

/**
 * Verificar si un planeta existe por ID
 * @param {number} planetId - ID del planeta a verificar
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkPlanetExistsDB(planetId) {
  const [rows] = await connection.query(
    "SELECT id FROM planets WHERE id = ?",
    [planetId]
  );
  return rows.length > 0;
}