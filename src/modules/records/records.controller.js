import {
  getRecordsByCitizenIdDB,
  getRecordByIdDB,
  getAllRecordsDB,
  createRecordDB,
  updateRecordDB,
  deleteRecordDB,
  countRecordsByCitizenDB,
  getRecordsStatsDB,
  searchRecordsDB,
  getMostDangerousLocationsDB
} from "./records.model.js";

/**
 * Controlador para la gestión de antecedentes penales
 * Implementa manejo de errores, validaciones y control de acceso por roles
 */

/**
 * Obtener todos los antecedentes penales de un ciudadano específico
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getRecordsByCitizen(req, res) {
  try {
    const { citizenId } = req.params;
    const records = await getRecordsByCitizenIdDB(citizenId);
    
    res.status(200).json({
      status: "success",
      message: "Antecedentes obtenidos correctamente",
      data: records,
      total: records.length,
      citizen_id: parseInt(citizenId)
    });
  } catch (error) {
    console.error('Error al obtener antecedentes por ciudadano:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener antecedentes",
      error: error.message
    });
  }
}

/**
 * Obtener un antecedente penal específico por ID
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getRecordById(req, res) {
  try {
    const { recordId } = req.params;
    const record = await getRecordByIdDB(recordId);
    
    if (!record) {
      return res.status(404).json({
        status: "error",
        message: "Antecedente penal no encontrado"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Antecedente obtenido correctamente",
      data: record
    });
  } catch (error) {
    console.error('Error al obtener antecedente por ID:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener el antecedente",
      error: error.message
    });
  }
}

/**
 * Obtener todos los antecedentes penales del sistema (con filtros opcionales)
 * Solo accesible para Admin, Commander, General
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getAllRecords(req, res) {
  try {
    const filters = req.query; // Los filtros vienen en query parameters
    const records = await getAllRecordsDB(filters);
    
    res.status(200).json({
      status: "success",
      message: "Todos los antecedentes obtenidos correctamente",
      data: records,
      total: records.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error al obtener todos los antecedentes:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener antecedentes",
      error: error.message
    });
  }
}

/**
 * Crear un nuevo antecedente penal
 * Solo Admin y CourtClerk pueden crear antecedentes
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function createRecord(req, res) {
  try {
    const { citizenId } = req.params;
    const recordData = req.body;
    
    // Asegurar que el citizen_id en el body coincida con el de la URL
    recordData.citizen_id = parseInt(citizenId);
    
    // Los datos ya vienen validados por el middleware de validación
    const result = await createRecordDB(recordData);
    
    // Obtener el antecedente recién creado para devolver los datos completos
    const newRecord = await getRecordByIdDB(result.insertId);
    
    res.status(201).json({
      status: "success",
      message: "Antecedente penal registrado exitosamente",
      data: {
        id: newRecord.id,
        citizen_id: newRecord.citizen_id,
        citizen_name: newRecord.citizen_name,
        citizen_last_name: newRecord.citizen_last_name,
        date: newRecord.date,
        time: newRecord.time,
        location: newRecord.location,
        description: newRecord.description
      }
    });
  } catch (error) {
    console.error('Error al crear antecedente penal:', error);
    
    // Manejar errores específicos de validación de base de datos
    if (error.message.includes('no existe')) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al crear el antecedente penal",
      error: error.message
    });
  }
}

/**
 * Actualizar un antecedente penal existente
 * Solo Admin puede actualizar antecedentes
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function updateRecord(req, res) {
  try {
    const { recordId } = req.params;
    const updateData = req.body;
    
    // Verificar que el antecedente existe antes de actualizar
    const existingRecord = await getRecordByIdDB(recordId);
    if (!existingRecord) {
      return res.status(404).json({
        status: "error",
        message: "Antecedente penal no encontrado"
      });
    }
    
    // Los datos ya vienen validados por el middleware de validación
    const result = await updateRecordDB(recordId, updateData);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se pudo actualizar el antecedente penal"
      });
    }
    
    // Obtener los datos actualizados
    const updatedRecord = await getRecordByIdDB(recordId);
    
    res.status(200).json({
      status: "success",
      message: "Antecedente penal actualizado exitosamente",
      data: {
        id: updatedRecord.id,
        citizen_id: updatedRecord.citizen_id,
        citizen_name: updatedRecord.citizen_name,
        citizen_last_name: updatedRecord.citizen_last_name,
        date: updatedRecord.date,
        time: updatedRecord.time,
        location: updatedRecord.location,
        description: updatedRecord.description
      }
    });
  } catch (error) {
    console.error('Error al actualizar antecedente penal:', error);
    
    // Manejar errores específicos de validación
    if (error.message.includes('no existe')) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al actualizar el antecedente penal",
      error: error.message
    });
  }
}

/**
 * Eliminar un antecedente penal
 * Solo Admin puede eliminar antecedentes
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function deleteRecord(req, res) {
  try {
    const { recordId } = req.params;
    
    // Verificar que el antecedente existe antes de eliminar
    const existingRecord = await getRecordByIdDB(recordId);
    if (!existingRecord) {
      return res.status(404).json({
        status: "error",
        message: "Antecedente penal no encontrado"
      });
    }
    
    // Eliminar el antecedente de la base de datos
    const result = await deleteRecordDB(recordId);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se pudo eliminar el antecedente penal"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Antecedente penal eliminado exitosamente",
      data: {
        id: parseInt(recordId),
        citizen_id: existingRecord.citizen_id,
        citizen_name: existingRecord.citizen_name,
        deleted: true
      }
    });
  } catch (error) {
    console.error('Error al eliminar antecedente penal:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al eliminar el antecedente penal",
      error: error.message
    });
  }
}

/**
 * Obtener el conteo de antecedentes de un ciudadano
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getRecordsCount(req, res) {
  try {
    const { citizenId } = req.params;
    const count = await countRecordsByCitizenDB(citizenId);
    
    res.status(200).json({
      status: "success",
      message: "Conteo de antecedentes obtenido correctamente",
      data: {
        citizen_id: parseInt(citizenId),
        total_records: count
      }
    });
  } catch (error) {
    console.error('Error al obtener conteo de antecedentes:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener el conteo",
      error: error.message
    });
  }
}

/**
 * Obtener estadísticas generales de antecedentes penales
 * Solo accesible para Admin, Commander, General
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getRecordsStats(req, res) {
  try {
    const stats = await getRecordsStatsDB();
    
    res.status(200).json({
      status: "success",
      message: "Estadísticas de antecedentes obtenidas correctamente",
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de antecedentes:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener estadísticas",
      error: error.message
    });
  }
}

/**
 * Buscar antecedentes por criterios específicos
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function searchRecords(req, res) {
  try {
    const searchCriteria = req.query;
    
    if (!searchCriteria.term && !searchCriteria.location && !searchCriteria.citizen_name) {
      return res.status(400).json({
        status: "error",
        message: "Se requiere al menos un criterio de búsqueda (term, location, o citizen_name)"
      });
    }
    
    const searchResults = await searchRecordsDB(searchCriteria);
    
    res.status(200).json({
      status: "success",
      message: "Búsqueda de antecedentes completada exitosamente",
      data: searchResults,
      total: searchResults.length,
      search_criteria: searchCriteria
    });
  } catch (error) {
    console.error('Error al buscar antecedentes:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar antecedentes",
      error: error.message
    });
  }
}

/**
 * Obtener las ubicaciones más peligrosas
 * Solo accesible para Admin, Commander, General
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getMostDangerousLocations(req, res) {
  try {
    const { limit = 10 } = req.query;
    const dangerousLocations = await getMostDangerousLocationsDB(parseInt(limit));
    
    res.status(200).json({
      status: "success",
      message: "Ubicaciones más peligrosas obtenidas correctamente",
      data: dangerousLocations,
      total: dangerousLocations.length
    });
  } catch (error) {
    console.error('Error al obtener ubicaciones peligrosas:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener ubicaciones peligrosas",
      error: error.message
    });
  }
}