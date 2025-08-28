import {
  getCitationsByCitizenIdDB,
  getCitationByIdDB,
  getAllCitationsDB,
  createCitationDB,
  updateCitationDB,
  deleteCitationDB,
  countCitationsByCitizenDB,
  getCitationsStatsDB,
  searchCitationsDB,
  getTopOffendersDB,
  getCitizenPenaltySummaryDB,
  calculatePenalty
} from "./citations.model.js";

/**
 * Controlador para la gestión de citaciones (amonestaciones menores)
 * Implementa lógica de penalizaciones automáticas y control de acceso por roles
 */

/**
 * Obtener todas las citaciones de un ciudadano específico
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getCitationsByCitizen(req, res) {
  try {
    const { citizenId } = req.params;
    const citations = await getCitationsByCitizenIdDB(citizenId);
    
    res.status(200).json({
      status: "success",
      message: "Citaciones obtenidas correctamente",
      data: citations,
      total: citations.length,
      citizen_id: parseInt(citizenId)
    });
  } catch (error) {
    console.error('Error al obtener citaciones por ciudadano:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener citaciones",
      error: error.message
    });
  }
}

/**
 * Obtener una citación específica por ID
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getCitationById(req, res) {
  try {
    const { citationId } = req.params;
    const citation = await getCitationByIdDB(citationId);
    
    if (!citation) {
      return res.status(404).json({
        status: "error",
        message: "Citación n o encontrada"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Citación obtenida correctamente",
      data: citation
    });
  } catch (error) {
    console.error('Error al obtener citación por ID:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener la citación",
      error: error.message
    });
  }
}

/**
 * Obtener todas las citaciones del sistema (con filtros opcionales)
 * Solo accesible para Admin, Commander, General
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getAllCitations(req, res) {
  try {
    const filters = req.query; // Los filtros vienen en query parameters
    const citations = await getAllCitationsDB(filters);
    
    res.status(200).json({
      status: "success",
      message: "Todas las citaciones obtenidas correctamente",
      data: citations,
      total: citations.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error al obtener todas las citaciones:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener citaciones",
      error: error.message
    });
  }
}

/**
 * Crear una nueva citación con penalización automática
 * Solo Admin y PoliceOfficer pueden crear citaciones
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function createCitation(req, res) {
  try {
    const { citizenId } = req.params;
    const citationData = req.body;
    
    // Asegurar que el citizen_id en el body coincida con el de la URL
    citationData.citizen_id = parseInt(citizenId);
    
    // Obtener conteo de citaciones previas para mostrar información
    const previousCitations = await countCitationsByCitizenDB(citizenId);
    const penalty = calculatePenalty(previousCitations);
    
    // Los datos ya vienen validados por el middleware de validación
    const result = await createCitationDB(citationData);
    
    // Obtener la citación recién creada para devolver los datos completos
    const newCitation = await getCitationByIdDB(result.insertId);
    
    // Preparar respuesta con información de penalización
    const response = {
      status: "success",
      message: "Citación registrada exitosamente con penalización automática aplicada",
      data: {
        citation: {
          id: newCitation.id,
          citizen_id: newCitation.citizen_id,
          citizen_name: newCitation.citizen_name,
          citizen_last_name: newCitation.citizen_last_name,
          date: newCitation.date,
          description: newCitation.description,
          fine_amount: newCitation.fine_amount
        },
        penalty_details: {
          citation_number: penalty.citation_number,
          fine_amount: penalty.fine_amount,
          civic_course_hours: penalty.civic_course_hours,
          civic_work_days: penalty.civic_work_days,
          jail_days: penalty.jail_days,
          penalty_description: penalty.penalty_description
        },
        automatic_actions: {
          criminal_record_created: result.criminal_record_created,
          warning: result.criminal_record_created ? 
            "ATENCIÓN: Se ha creado automáticamente un antecedente penal por acumulación de citaciones" : 
            null
        }
      }
    };
    
    // Si se creó un antecedente penal, cambiar el status code para indicar acción adicional
    const statusCode = result.criminal_record_created ? 202 : 201; // 202 = Accepted with additional processing
    
    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Error al crear citación:', error);
    
    // Manejar errores específicos de validación de base de datos
    if (error.message.includes('no existe')) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al crear la citación",
      error: error.message
    });
  }
}

/**
 * Actualizar una citación existente
 * Solo Admin puede actualizar citaciones
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function updateCitation(req, res) {
  try {
    const { citationId } = req.params;
    const updateData = req.body;
    
    // Verificar que la citación existe antes de actualizar
    const existingCitation = await getCitationByIdDB(citationId);
    if (!existingCitation) {
      return res.status(404).json({
        status: "error",
        message: "Citación no encontrada"
      });
    }
    
    // Los datos ya vienen validados por el middleware de validación
    const result = await updateCitationDB(citationId, updateData);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se pudo actualizar la citación"
      });
    }
    
    // Obtener los datos actualizados
    const updatedCitation = await getCitationByIdDB(citationId);
    
    res.status(200).json({
      status: "success",
      message: "Citación actualizada exitosamente",
      data: {
        id: updatedCitation.id,
        citizen_id: updatedCitation.citizen_id,
        citizen_name: updatedCitation.citizen_name,
        citizen_last_name: updatedCitation.citizen_last_name,
        date: updatedCitation.date,
        description: updatedCitation.description,
        fine_amount: updatedCitation.fine_amount
      }
    });
  } catch (error) {
    console.error('Error al actualizar citación:', error);
    
    // Manejar errores específicos de validación
    if (error.message.includes('no existe')) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al actualizar la citación",
      error: error.message
    });
  }
}

/**
 * Eliminar una citación
 * Solo Admin puede eliminar citaciones
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function deleteCitation(req, res) {
  try {
    const { citationId } = req.params;
    
    // Verificar que la citación existe antes de eliminar
    const existingCitation = await getCitationByIdDB(citationId);
    if (!existingCitation) {
      return res.status(404).json({
        status: "error",
        message: "Citación no encontrada"
      });
    }
    
    // Eliminar la citación de la base de datos
    const result = await deleteCitationDB(citationId);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se pudo eliminar la citación"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Citación eliminada exitosamente",
      data: {
        id: parseInt(citationId),
        citizen_id: existingCitation.citizen_id,
        citizen_name: existingCitation.citizen_name,
        deleted: true,
        warning: "NOTA: La eliminación de citaciones puede afectar el historial de penalizaciones del ciudadano"
      }
    });
  } catch (error) {
    console.error('Error al eliminar citación:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al eliminar la citación",
      error: error.message
    });
  }
}

/**
 * Obtener el conteo de citaciones de un ciudadano
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getCitationsCount(req, res) {
  try {
    const { citizenId } = req.params;
    const count = await countCitationsByCitizenDB(citizenId);
    
    res.status(200).json({
      status: "success",
      message: "Conteo de citaciones obtenido correctamente",
      data: {
        citizen_id: parseInt(citizenId),
        total_citations: count
      }
    });
  } catch (error) {
    console.error('Error al obtener conteo de citaciones:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener el conteo",
      error: error.message
    });
  }
}

/**
 * Obtener estadísticas generales de citaciones
 * Solo accesible para Admin, Commander, General
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getCitationsStats(req, res) {
  try {
    const stats = await getCitationsStatsDB();
    
    res.status(200).json({
      status: "success",
      message: "Estadísticas de citaciones obtenidas correctamente",
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de citaciones:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener estadísticas",
      error: error.message
    });
  }
}

/**
 * Buscar citaciones por criterios específicos
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function searchCitations(req, res) {
  try {
    const searchCriteria = req.query;
    
    if (!searchCriteria.term && !searchCriteria.citizen_name) {
      return res.status(400).json({
        status: "error",
        message: "Se requiere al menos un criterio de búsqueda (term o citizen_name)"
      });
    }
    
    const searchResults = await searchCitationsDB(searchCriteria);
    
    res.status(200).json({
      status: "success",
      message: "Búsqueda de citaciones completada exitosamente",
      data: searchResults,
      total: searchResults.length,
      search_criteria: searchCriteria
    });
  } catch (error) {
    console.error('Error al buscar citaciones:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar citaciones",
      error: error.message
    });
  }
}

/**
 * Obtener ciudadanos con más citaciones (principales infractores)
 * Solo accesible para Admin, Commander, General
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getTopOffenders(req, res) {
  try {
    const { limit = 10 } = req.query;
    const topOffenders = await getTopOffendersDB(parseInt(limit));
    
    res.status(200).json({
      status: "success",
      message: "Principales infractores obtenidos correctamente",
      data: topOffenders,
      total: topOffenders.length
    });
  } catch (error) {
    console.error('Error al obtener principales infractores:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener principales infractores",
      error: error.message
    });
  }
}

/**
 * Obtener resumen de penalizaciones para un ciudadano
 * Incluye información sobre próxima penalización
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getCitizenPenaltySummary(req, res) {
  try {
    const { citizenId } = req.params;
    const summary = await getCitizenPenaltySummaryDB(citizenId);
    
    res.status(200).json({
      status: "success",
      message: "Resumen de penalizaciones obtenido correctamente",
      data: {
        citizen_id: parseInt(citizenId),
        current_status: {
          total_citations: summary.total_citations,
          total_fines: summary.total_fines
        },
        next_citation_penalty: summary.next_penalty,
        warnings: {
          approaching_criminal_record: summary.total_citations >= 2 ? 
            "ADVERTENCIA: La próxima citación resultará en antecedentes penales" : null,
          escalation_notice: summary.total_citations > 0 ? 
            `El ciudadano tiene ${summary.total_citations} citación(es) previa(s)` : null
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de penalizaciones:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener resumen de penalizaciones",
      error: error.message
    });
  }
}