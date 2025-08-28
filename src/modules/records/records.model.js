import connection from "../../config/Database.js";

/**
 * Modelo de datos para la gestión de antecedentes penales
 * Tabla criminal_records: id, citizen_id, date, time, location, description, crime_type
 * Relación: citizens 1 <--> N criminal_records
 * Relación: planets 1 <--> N criminal_records (location)
 */

/**
 * Obtener todos los antecedentes penales de un ciudadano específico
 * @param {number} citizenId - ID del ciudadano
 * @returns {Promise<Array>} Lista de antecedentes del ciudadano
 */
export async function getRecordsByCitizenIdDB(citizenId) {
  const query = `
    SELECT 
      cr.id, 
      cr.citizen_id, 
      cr.date, 
      cr.time, 
      cr.location, 
      cr.description, 
      cr.crime_type,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code,
      p.planet_name as location_name
    FROM criminal_records cr
    INNER JOIN citizens c ON cr.citizen_id = c.id
    INNER JOIN planets p ON cr.location = p.id
    WHERE cr.citizen_id = ?
    ORDER BY cr.date DESC, cr.time DESC
  `;
  
  const [rows] = await connection.query(query, [citizenId]);
  return rows;
}

/**
 * Obtener un antecedente penal específico por ID
 * @param {number} recordId - ID del antecedente penal
 * @returns {Promise<Object|null>} Antecedente encontrado o null
 */
export async function getRecordByIdDB(recordId) {
  const query = `
    SELECT 
      cr.id, 
      cr.citizen_id, 
      cr.date, 
      cr.time, 
      cr.location, 
      cr.description, 
      cr.crime_type,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code,
      p.planet_name as location_name
    FROM criminal_records cr
    INNER JOIN citizens c ON cr.citizen_id = c.id
    INNER JOIN planets p ON cr.location = p.id
    WHERE cr.id = ?
  `;
  
  const [rows] = await connection.query(query, [recordId]);
  return rows[0] || null;
}

/**
 * Obtener todos los antecedentes penales del sistema (para administración)
 * @param {Object} filters - Filtros opcionales

 * @param {string} filters.location - Filtrar por ubicación
 * @param {Date} filters.date_from - Fecha desde
 * @param {Date} filters.date_to - Fecha hasta
 * @param {number} filters.limit - Límite de resultados
 * @param {number} filters.offset - Offset para paginación
 * @returns {Promise<Array>} Lista de todos los antecedentes
 */
export async function getAllRecordsDB(filters = {}) {
  let query = `
    SELECT 
      cr.id, 
      cr.citizen_id, 
      cr.date, 
      cr.time, 
      cr.location, 
      cr.description, 
      cr.crime_type,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code,
      p.planet_name as location_name
    FROM criminal_records cr
    INNER JOIN citizens c ON cr.citizen_id = c.id
    INNER JOIN planets p ON cr.location = p.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Aplicar filtros
  if (filters.location) {
    query += " AND p.planet_name LIKE ?";
    params.push(`%${filters.location}%`);
  }
  
  if (filters.date_from) {
    query += " AND cr.date >= ?";
    params.push(filters.date_from);
  }
  
  if (filters.date_to) {
    query += " AND cr.date <= ?";
    params.push(filters.date_to);
  }
  
  query += " ORDER BY cr.date DESC, cr.time DESC";
  
  // Aplicar paginación
  if (filters.limit) {
    query += " LIMIT ?";
    params.push(parseInt(filters.limit));
    
    if (filters.offset) {
      query += " OFFSET ?";
      params.push(parseInt(filters.offset));
    }
  }
  
  const [rows] = await connection.query(query, params);
  return rows;
}

/**
 * Crear un nuevo antecedente penal
 * @param {Object} recordData - Datos del antecedente penal
 * @param {number} recordData.citizen_id - ID del ciudadano
 * @param {string} recordData.date - Fecha del delito (YYYY-MM-DD)
 * @param {string} recordData.time - Hora del delito (HH:MM:SS)
 * @param {string} recordData.location - Ubicación del delito
 * @param {string} recordData.description - Descripción del delito

 * @returns {Promise<Object>} Resultado de la inserción
 */
export async function createRecordDB(recordData) {
  // Verificar que el ciudadano existe
  const citizenExists = await checkCitizenExistsDB(recordData.citizen_id);
  if (!citizenExists) {
    throw new Error("El ciudadano especificado no existe");
  }

  // Verificar que el planeta existe
  const planetExists = await checkPlanetExistsDB(recordData.location);
  if (!planetExists) {
    throw new Error("El planeta especificado no existe");
  }

  const newRecord = {
    citizen_id: recordData.citizen_id,
    date: recordData.date,
    time: recordData.time,
    location: recordData.location,
    description: recordData.description,
    crime_type: recordData.crime_type || 'Delito menor'
  };

  const [result] = await connection.query("INSERT INTO criminal_records SET ?", [newRecord]);
  return result;
}

/**
 * Actualizar un antecedente penal existente
 * @param {number} recordId - ID del antecedente penal
 * @param {Object} recordData - Datos a actualizar
 * @returns {Promise<Object>} Resultado de la actualización
 */
export async function updateRecordDB(recordId, recordData) {
  // Si se va a actualizar el citizen_id, verificar que el ciudadano existe
  if (recordData.citizen_id) {
    const citizenExists = await checkCitizenExistsDB(recordData.citizen_id);
    if (!citizenExists) {
      throw new Error("El ciudadano especificado no existe");
    }
  }

  // Si se va a actualizar la ubicación, verificar que el planeta existe
  if (recordData.location) {
    const planetExists = await checkPlanetExistsDB(recordData.location);
    if (!planetExists) {
      throw new Error("El planeta especificado no existe");
    }
  }

  const [result] = await connection.query(
    "UPDATE criminal_records SET ? WHERE id = ?",
    [recordData, recordId]
  );
  return result;
}

/**
 * Eliminar un antecedente penal (solo para administradores)
 * @param {number} recordId - ID del antecedente penal
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export async function deleteRecordDB(recordId) {
  const [result] = await connection.query("DELETE FROM criminal_records WHERE id = ?", [recordId]);
  return result;
}

/**
 * Contar total de antecedentes penales de un ciudadano
 * @param {number} citizenId - ID del ciudadano
 * @returns {Promise<number>} Número total de antecedentes
 */
export async function countRecordsByCitizenDB(citizenId) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) as total FROM criminal_records WHERE citizen_id = ?",
    [citizenId]
  );
  return rows[0].total;
}

/**
 * Obtener estadísticas de antecedentes penales
 * @returns {Promise<Object>} Estadísticas generales
 */
export async function getRecordsStatsDB() {
  const query = `
    SELECT 
      COUNT(*) as total_records,
      COUNT(DISTINCT citizen_id) as total_citizens_with_records,
      COUNT(DISTINCT location) as total_locations,
      p.planet_name as location_name,
      COUNT(*) as records_by_location
    FROM criminal_records cr
    INNER JOIN planets p ON cr.location = p.id
    GROUP BY cr.location, p.planet_name
    ORDER BY records_by_location DESC
  `;
  
  const [rows] = await connection.query(query);
  
  // Obtener estadísticas generales
  const generalStatsQuery = `
    SELECT 
      COUNT(*) as total_records,
      COUNT(DISTINCT citizen_id) as total_citizens_with_records,
      COUNT(DISTINCT location) as total_locations
    FROM criminal_records
  `;
  
  const [generalStats] = await connection.query(generalStatsQuery);
  
  return {
    general: generalStats[0],
    by_location: rows
  };
}

/**
 * Buscar antecedentes por diferentes criterios
 * @param {Object} searchCriteria - Criterios de búsqueda
 * @param {string} searchCriteria.term - Término de búsqueda general

 * @param {string} searchCriteria.location - Ubicación
 * @param {string} searchCriteria.citizen_name - Nombre del ciudadano
 * @param {number} searchCriteria.limit - Límite de resultados
 * @param {number} searchCriteria.offset - Offset para paginación
 * @returns {Promise<Array>} Lista de antecedentes que coinciden
 */
export async function searchRecordsDB(searchCriteria) {
  let query = `
    SELECT 
      cr.id, 
      cr.citizen_id, 
      cr.date, 
      cr.time, 
      cr.location, 
      cr.description, 
      cr.crime_type,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code,
      p.planet_name as location_name
    FROM criminal_records cr
    INNER JOIN citizens c ON cr.citizen_id = c.id
    INNER JOIN planets p ON cr.location = p.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Búsqueda general
  if (searchCriteria.term) {
    query += ` AND (
      cr.description LIKE ? OR 
      p.planet_name LIKE ? OR 
      cr.crime_type LIKE ? OR 
      c.full_name LIKE ? OR 
      c.last_name LIKE ?
    )`;
    const termPattern = `%${searchCriteria.term}%`;
    params.push(termPattern, termPattern, termPattern, termPattern, termPattern);
  }
  
  // Filtros específicos
  if (searchCriteria.location) {
    query += " AND p.planet_name LIKE ?";
    params.push(`%${searchCriteria.location}%`);
  }
  
  if (searchCriteria.citizen_name) {
    query += " AND (c.full_name LIKE ? OR c.last_name LIKE ?)";
    const namePattern = `%${searchCriteria.citizen_name}%`;
    params.push(namePattern, namePattern);
  }
  
  query += " ORDER BY cr.date DESC, cr.time DESC";
  
  // Aplicar paginación
  if (searchCriteria.limit) {
    query += " LIMIT ?";
    params.push(parseInt(searchCriteria.limit));
    
    if (searchCriteria.offset) {
      query += " OFFSET ?";
      params.push(parseInt(searchCriteria.offset));
    }
  }
  
  const [rows] = await connection.query(query, params);
  return rows;
}

/**
 * Verificar si un ciudadano existe
 * @param {number} citizenId - ID del ciudadano a verificar
 * @returns {Promise<boolean>} True si existe, false si no
 */
export async function checkCitizenExistsDB(citizenId) {
  const [rows] = await connection.query(
    "SELECT id FROM citizens WHERE id = ?",
    [citizenId]
  );
  return rows.length > 0;
}

/**
 * Obtener las ubicaciones más peligrosas
 * @param {number} limit - Número de ubicaciones a retornar
 * @returns {Promise<Array>} Lista de ubicaciones con más delitos
 */
export async function getMostDangerousLocationsDB(limit = 10) {
  const query = `
    SELECT 
      cr.location,
      p.planet_name as location_name,
      COUNT(*) as total_crimes,
      COUNT(DISTINCT citizen_id) as unique_criminals
    FROM criminal_records cr
    INNER JOIN planets p ON cr.location = p.id
    GROUP BY cr.location, p.planet_name
    ORDER BY total_crimes DESC
    LIMIT ?
  `;
  
  const [rows] = await connection.query(query, [limit]);
  return rows;
}

/**
 * Verificar si un planeta existe
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