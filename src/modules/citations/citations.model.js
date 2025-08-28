import connection from "../../config/Database.js";

/**
 * Modelo de datos para la gestión de citaciones (amonestaciones menores)
 * Tabla citations: id, citizen_id, date, description, fine_amount
 * Relación: citizens 1 <--> N citations
 * 
 * Lógica de Penalizaciones:
 * 1ª citación: $400 + curso 48 horas normas cívicas
 * 2ª citación: $400 + curso 48 horas + 2 días trabajo cívico
 * 3ª citación: 8 días cárcel + registro en antecedentes penales
 */

/**
 * Obtener todas las citaciones de un ciudadano específico
 * @param {number} citizenId - ID del ciudadano
 * @returns {Promise<Array>} Lista de citaciones del ciudadano
 */
export async function getCitationsByCitizenIdDB(citizenId) {
  const query = `
    SELECT 
      ct.id, 
      ct.citizen_id, 
      ct.date, 
      ct.description, 
      ct.fine_amount,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code
    FROM citations ct
    INNER JOIN citizens c ON ct.citizen_id = c.id
    WHERE ct.citizen_id = ?
    ORDER BY ct.date DESC
  `;
  
  const [rows] = await connection.query(query, [citizenId]);
  return rows;
}

/**
 * Obtener una citación específica por ID
 * @param {number} citationId - ID de la citación
 * @returns {Promise<Object|null>} Citación encontrada o null
 */
export async function getCitationByIdDB(citationId) {
  const query = `
    SELECT 
      ct.id, 
      ct.citizen_id, 
      ct.date, 
      ct.description, 
      ct.fine_amount,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code
    FROM citations ct
    INNER JOIN citizens c ON ct.citizen_id = c.id
    WHERE ct.id = ?
  `;
  
  const [rows] = await connection.query(query, [citationId]);
  return rows[0] || null;
}

/**
 * Obtener todas las citaciones del sistema (para administración)
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.location - Filtrar por ubicación en descripción
 * @param {Date} filters.date_from - Fecha desde
 * @param {Date} filters.date_to - Fecha hasta
 * @param {number} filters.fine_amount_min - Monto mínimo de multa
 * @param {number} filters.fine_amount_max - Monto máximo de multa
 * @param {number} filters.limit - Límite de resultados
 * @param {number} filters.offset - Offset para paginación
 * @returns {Promise<Array>} Lista de todas las citaciones
 */
export async function getAllCitationsDB(filters = {}) {
  let query = `
    SELECT 
      ct.id, 
      ct.citizen_id, 
      ct.date, 
      ct.description, 
      ct.fine_amount,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code
    FROM citations ct
    INNER JOIN citizens c ON ct.citizen_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Aplicar filtros
  if (filters.location) {
    query += " AND ct.description LIKE ?";
    params.push(`%${filters.location}%`);
  }
  
  if (filters.date_from) {
    query += " AND ct.date >= ?";
    params.push(filters.date_from);
  }
  
  if (filters.date_to) {
    query += " AND ct.date <= ?";
    params.push(filters.date_to);
  }
  
  if (filters.fine_amount_min) {
    query += " AND ct.fine_amount >= ?";
    params.push(filters.fine_amount_min);
  }
  
  if (filters.fine_amount_max) {
    query += " AND ct.fine_amount <= ?";
    params.push(filters.fine_amount_max);
  }
  
  query += " ORDER BY ct.date DESC";
  
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
 * Contar el número de citaciones previas de un ciudadano
 * @param {number} citizenId - ID del ciudadano
 * @returns {Promise<number>} Número de citaciones previas
 */
export async function countCitationsByCitizenDB(citizenId) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) as total FROM citations WHERE citizen_id = ?",
    [citizenId]
  );
  return rows[0].total;
}

/**
 * Calcular penalización según número de citaciones previas
 * @param {number} previousCitations - Número de citaciones previas
 * @returns {Object} Objeto con detalles de la penalización
 */
export function calculatePenalty(previousCitations) {
  const citationNumber = previousCitations + 1; // La citación actual
  
  let penalty = {
    citation_number: citationNumber,
    fine_amount: 400.00, // Siempre $400 base
    civic_course_hours: 48, // Siempre curso de 48 horas
    civic_work_days: 0,
    jail_days: 0,
    creates_criminal_record: false,
    penalty_description: ""
  };
  
  switch (citationNumber) {
    case 1:
      penalty.penalty_description = "Primera amonestación: $400 + curso de 48 horas de normas cívicas";
      break;
      
    case 2:
      penalty.civic_work_days = 2;
      penalty.penalty_description = "Segunda amonestación: $400 + curso de 48 horas + 2 días de trabajo cívico";
      break;
      
    case 3:
      penalty.civic_course_hours = 0; // En la tercera ya no hay curso
      penalty.civic_work_days = 0;    // En la tercera ya no hay trabajo cívico
      penalty.jail_days = 8;
      penalty.creates_criminal_record = true;
      penalty.penalty_description = "Tercera amonestación: 8 días de cárcel + registro en antecedentes penales";
      break;
      
    default:
      // Más de 3 citaciones, se trata como antecedente penal directo
      penalty.fine_amount = 0;
      penalty.civic_course_hours = 0;
      penalty.jail_days = 15 + (citationNumber - 3) * 5; // Escalamiento de cárcel
      penalty.creates_criminal_record = true;
      penalty.penalty_description = `Múltiples amonestaciones (${citationNumber}): ${penalty.jail_days} días de cárcel + registro en antecedentes penales`;
      break;
  }
  
  return penalty;
}

/**
 * Crear una nueva citación con penalización automática
 * @param {Object} citationData - Datos de la citación
 * @param {number} citationData.citizen_id - ID del ciudadano
 * @param {string} citationData.description - Descripción de la infracción
 * @returns {Promise<Object>} Resultado de la inserción con penalización calculada
 */
export async function createCitationDB(citationData) {
  // Verificar que el ciudadano existe
  const citizenExists = await checkCitizenExistsDB(citationData.citizen_id);
  if (!citizenExists) {
    throw new Error("El ciudadano especificado no existe");
  }

  // Contar citaciones previas
  const previousCitations = await countCitationsByCitizenDB(citationData.citizen_id);
  
  // Calcular penalización
  const penalty = calculatePenalty(previousCitations);
  
  // Preparar datos de la citación
  const newCitation = {
    citizen_id: citationData.citizen_id,
    date: new Date(), // Fecha y hora actual
    description: citationData.description,
    fine_amount: penalty.fine_amount,
  };

  // Iniciar transacción para operaciones múltiples
  const dbConnection = await connection.getConnection();
  await dbConnection.beginTransaction();
  
  try {
    // Insertar la citación
    const [result] = await dbConnection.query("INSERT INTO citations SET ?", [newCitation]);
    
    // Si es la tercera citación o más, crear antecedente penal automáticamente
    if (penalty.creates_criminal_record) {
      const criminalRecord = {
        citizen_id: citationData.citizen_id,
        date: new Date().toISOString().split('T')[0], // Solo fecha
        time: new Date().toTimeString().split(' ')[0], // Solo hora
        location: 1, // ID del planeta por defecto (Tierra)
        description: `Registro automático por acumulación de ${penalty.citation_number} citaciones menores. Última infracción: ${citationData.description}`,
        crime_type: 'Acumulación de citaciones menores'
      };
      
      await dbConnection.query("INSERT INTO criminal_records SET ?", [criminalRecord]);
    }
    
    // Confirmar transacción
    await dbConnection.commit();
    
    return {
      insertId: result.insertId,
      penalty: penalty,
      criminal_record_created: penalty.creates_criminal_record
    };
    
  } catch (error) {
    // Revertir transacción en caso de error
    await dbConnection.rollback();
    throw error;
  } finally {
    // Liberar conexión
    dbConnection.release();
  }
}

/**
 * Actualizar una citación existente (solo Admin)
 * @param {number} citationId - ID de la citación
 * @param {Object} citationData - Datos a actualizar
 * @returns {Promise<Object>} Resultado de la actualización
 */
export async function updateCitationDB(citationId, citationData) {
  // Si se va a actualizar el citizen_id, verificar que el ciudadano existe
  if (citationData.citizen_id) {
    const citizenExists = await checkCitizenExistsDB(citationData.citizen_id);
    if (!citizenExists) {
      throw new Error("El ciudadano especificado no existe");
    }
  }

  const [result] = await connection.query(
    "UPDATE citations SET ? WHERE id = ?",
    [citationData, citationId]
  );
  return result;
}

/**
 * Eliminar una citación (solo para administradores)
 * @param {number} citationId - ID de la citación
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export async function deleteCitationDB(citationId) {
  const [result] = await connection.query("DELETE FROM citations WHERE id = ?", [citationId]);
  return result;
}

/**
 * Obtener estadísticas de citaciones
 * @returns {Promise<Object>} Estadísticas generales
 */
export async function getCitationsStatsDB() {
  const generalStatsQuery = `
    SELECT 
      COUNT(*) as total_citations,
      COUNT(DISTINCT citizen_id) as total_citizens_with_citations,
      SUM(fine_amount) as total_fines_amount,
      AVG(fine_amount) as average_fine_amount,
      MIN(fine_amount) as min_fine_amount,
      MAX(fine_amount) as max_fine_amount
    FROM citations
  `;
  
  const [generalStats] = await connection.query(generalStatsQuery);
  
  // Estadísticas por mes
  const monthlyStatsQuery = `
    SELECT 
      DATE_FORMAT(date, '%Y-%m') as month,
      COUNT(*) as citations_count,
      SUM(fine_amount) as month_fines_total
    FROM citations
    WHERE date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY month DESC
  `;
  
  const [monthlyStats] = await connection.query(monthlyStatsQuery);
  
  return {
    general: generalStats[0],
    by_month: monthlyStats
  };
}

/**
 * Buscar citaciones por diferentes criterios
 * @param {Object} searchCriteria - Criterios de búsqueda
 * @param {string} searchCriteria.term - Término de búsqueda general
 * @param {string} searchCriteria.citizen_name - Nombre del ciudadano
 * @param {number} searchCriteria.limit - Límite de resultados
 * @param {number} searchCriteria.offset - Offset para paginación
 * @returns {Promise<Array>} Lista de citaciones que coinciden
 */
export async function searchCitationsDB(searchCriteria) {
  let query = `
    SELECT 
      ct.id, 
      ct.citizen_id, 
      ct.date, 
      ct.description, 
      ct.fine_amount,
      c.full_name as citizen_name,
      c.last_name as citizen_last_name,
      c.qr_code as citizen_qr_code
    FROM citations ct
    INNER JOIN citizens c ON ct.citizen_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Búsqueda general
  if (searchCriteria.term) {
    query += ` AND (
      ct.description LIKE ? OR 
      c.full_name LIKE ? OR 
      c.last_name LIKE ?
    )`;
    const termPattern = `%${searchCriteria.term}%`;
    params.push(termPattern, termPattern, termPattern);
  }
  
  // Filtro por nombre de ciudadano
  if (searchCriteria.citizen_name) {
    query += " AND (c.full_name LIKE ? OR c.last_name LIKE ?)";
    const namePattern = `%${searchCriteria.citizen_name}%`;
    params.push(namePattern, namePattern);
  }
  
  query += " ORDER BY ct.date DESC";
  
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
 * Obtener ciudadanos con más citaciones
 * @param {number} limit - Número de ciudadanos a retornar
 * @returns {Promise<Array>} Lista de ciudadanos con más citaciones
 */
export async function getTopOffendersDB(limit = 10) {
  const query = `
    SELECT 
      c.id,
      c.full_name,
      c.last_name,
      c.qr_code,
      COUNT(ct.id) as total_citations,
      SUM(ct.fine_amount) as total_fines,
      MAX(ct.date) as last_citation_date
    FROM citizens c
    INNER JOIN citations ct ON c.id = ct.citizen_id
    GROUP BY c.id, c.full_name, c.last_name, c.qr_code
    ORDER BY total_citations DESC, total_fines DESC
    LIMIT ?
  `;
  
  const [rows] = await connection.query(query, [limit]);
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
 * Obtener resumen de penalizaciones para un ciudadano
 * @param {number} citizenId - ID del ciudadano
 * @returns {Promise<Object>} Resumen de penalizaciones
 */
export async function getCitizenPenaltySummaryDB(citizenId) {
  const citationsCount = await countCitationsByCitizenDB(citizenId);
  const nextPenalty = calculatePenalty(citationsCount);
  
  // Obtener multas totales
  const [fineStats] = await connection.query(
    "SELECT SUM(fine_amount) as total_fines FROM citations WHERE citizen_id = ?",
    [citizenId]
  );
  
  return {
    total_citations: citationsCount,
    total_fines: fineStats[0].total_fines || 0,
    next_penalty: nextPenalty
  };
}