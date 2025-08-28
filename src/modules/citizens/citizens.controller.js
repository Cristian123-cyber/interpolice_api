import {
  getCitizensDB,
  getCitizenByIdDB,
  createCitizenDB,
  updateCitizenDB,
  deleteCitizenDB,
  getStatusesDB,
  getPlanetsDB,
  searchCitizensDB,
  getCitizenStatsDB
} from "./citizens.model.js";
import { deleteUploadedFile } from "../../middlewares/upload.middleware.js";

/**
 * Controlador para la gestión de ciudadanos
 * Implementa manejo de errores, validaciones y subida de imágenes
 */

/**
 * Formatear fecha para evitar problemas de zona horaria
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function formatDateOnly(date) {
  if (!date) return null;
  
  // Si ya es una cadena en formato YYYY-MM-DD, devolverla tal como está
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Si es un objeto Date, formatear sin conversión de zona horaria
  const dateObj = new Date(date);
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Obtener todos los ciudadanos
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getAll(req, res) {
  try {
    const citizens = await getCitizensDB();
    
    // Formatear las fechas de nacimiento para evitar problemas de zona horaria
    const formattedCitizens = citizens.map(citizen => ({
      ...citizen,
      birth_date: formatDateOnly(citizen.birth_date)
    }));
    
    res.status(200).json({
      status: "success",
      message: "Ciudadanos obtenidos correctamente",
      data: formattedCitizens,
      total: formattedCitizens.length
    });
  } catch (error) {
    console.error('Error al obtener ciudadanos:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener ciudadanos",
      error: error.message
    });
  }
}

/**
 * Obtener ciudadano por ID
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getOne(req, res) {
  try {
    const { id } = req.params;
    const citizen = await getCitizenByIdDB(id);
    
    if (!citizen) {
      return res.status(404).json({
        status: "error",
        message: "Ciudadano no encontrado"
      });
    }
    
    res.status(200).json({
      status: "success",
      message: "Ciudadano obtenido correctamente",
      data: {
        ...citizen,
        birth_date: formatDateOnly(citizen.birth_date)
      }
    });
  } catch (error) {
    console.error('Error al obtener ciudadano por ID:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener el ciudadano",
      error: error.message
    });
  }
}

/**
 * Crear un nuevo ciudadano con subida de imagen
 * @param {Request} req - Objeto de solicitud (con archivo de imagen)
 * @param {Response} res - Objeto de respuesta
 */
export async function create(req, res) {
  try {
    const citizenData = req.body;
    
    // Configurar la URL del avatar según si se subió una imagen o no
    if (req.file) {
      // Si se subió un archivo, usar la ruta del archivo subido
      citizenData.avatar_url = `/uploads/avatars/${req.file.filename}`;
    } else {
      // Si no se subió archivo, usar avatar por defecto
      citizenData.avatar_url = '/uploads/avatars/default.png';
    }
    
    // Los datos ya vienen validados por el middleware de validación
    const result = await createCitizenDB(citizenData);
    
    // Obtener el ciudadano recién creado para devolver los datos completos
    const newCitizen = await getCitizenByIdDB(result.insertId);
    
    res.status(201).json({
      status: "success",
      message: "Ciudadano creado exitosamente",
      data: {
        id: newCitizen.id,
        full_name: newCitizen.full_name,
        last_name: newCitizen.last_name,
        nick_name: newCitizen.nick_name,
        birth_date: formatDateOnly(newCitizen.birth_date),
        origin_planet: newCitizen.origin_planet,
        origin_planet_name: newCitizen.origin_planet_name,
        residence_planet: newCitizen.residence_planet,
        residence_planet_name: newCitizen.residence_planet_name,
        avatar_url: newCitizen.avatar_url,
        qr_code: newCitizen.qr_code,
        status: newCitizen.status_name
      }
    });
  } catch (error) {
    console.error('Error al crear ciudadano:', error);
    
    // Si hubo un error después de subir la imagen, eliminar el archivo
    if (req.file) {
      try {
        await deleteUploadedFile(req.file.path);
      } catch (deleteError) {
        console.error('Error al eliminar archivo subido:', deleteError);
      }
    }
    
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al crear el ciudadano",
      error: error.message
    });
  }
}

/**
 * Actualizar un ciudadano existente
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function update(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verificar que el ciudadano existe antes de actualizar
    const existingCitizen = await getCitizenByIdDB(id);
    if (!existingCitizen) {
      return res.status(404).json({
        status: "error",
        message: "Ciudadano no encontrado"
      });
    }
    
    // Los datos ya vienen validados por el middleware de validación
    const result = await updateCitizenDB(id, updateData);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se pudo actualizar el ciudadano"
      });
    }
    
    // Obtener los datos actualizados
    const updatedCitizen = await getCitizenByIdDB(id);
    
    res.status(200).json({
      status: "success",
      message: "Ciudadano actualizado exitosamente",
      data: {
        id: updatedCitizen.id,
        full_name: updatedCitizen.full_name,
        last_name: updatedCitizen.last_name,
        nick_name: updatedCitizen.nick_name,
        birth_date: formatDateOnly(updatedCitizen.birth_date),
        origin_planet: updatedCitizen.origin_planet,
        origin_planet_name: updatedCitizen.origin_planet_name,
        residence_planet: updatedCitizen.residence_planet,
        residence_planet_name: updatedCitizen.residence_planet_name,
        avatar_url: updatedCitizen.avatar_url,
        qr_code: updatedCitizen.qr_code,
        status: updatedCitizen.status_name
      }
    });
  } catch (error) {
    console.error('Error al actualizar ciudadano:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al actualizar el ciudadano",
      error: error.message
    });
  }
}

/**
 * Eliminar un ciudadano
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function deleteOne(req, res) {
  try {
    const { id } = req.params;
    
    // Verificar que el ciudadano existe antes de eliminar
    const existingCitizen = await getCitizenByIdDB(id);
    if (!existingCitizen) {
      return res.status(404).json({
        status: "error",
        message: "Ciudadano no encontrado"
      });
    }
    
    // Eliminar el ciudadano de la base de datos
    const result = await deleteCitizenDB(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se pudo eliminar el ciudadano"
      });
    }
    
    // Opcionalmente, eliminar la imagen de avatar si no es la imagen por defecto
    if (existingCitizen.avatar_url && !existingCitizen.avatar_url.includes('default.png')) {
      try {
        const imagePath = `public${existingCitizen.avatar_url}`;
        await deleteUploadedFile(imagePath);
      } catch (deleteError) {
        console.error('Error al eliminar imagen de avatar:', deleteError);
        // No fallar la operación si no se puede eliminar la imagen
      }
    }
    
    res.status(200).json({
      status: "success",
      message: "Ciudadano eliminado exitosamente",
      data: {
        id: parseInt(id),
        deleted: true
      }
    });
  } catch (error) {
    console.error('Error al eliminar ciudadano:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al eliminar el ciudadano",
      error: error.message
    });
  }
}

/**
 * Obtener todos los planetas disponibles
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getAllPlanets(req, res) {
  try {
    const planets = await getPlanetsDB();
    
    res.status(200).json({
      status: "success",
      message: "Planetas obtenidos correctamente",
      data: planets,
      total: planets.length
    });
  } catch (error) {
    console.error('Error al obtener planetas:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener planetas",
      error: error.message
    });
  }
}

/**
 * Obtener todos los estados disponibles
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getAllStatuses(req, res) {
  try {
    const statuses = await getStatusesDB();
    
    res.status(200).json({
      status: "success",
      message: "Estados obtenidos correctamente",
      data: statuses,
      total: statuses.length
    });
  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener estados",
      error: error.message
    });
  }
}

/**
 * Buscar ciudadanos por criterios
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function searchCitizens(req, res) {
  try {
    const { term, status_id, limit = 10, offset = 0 } = req.query;
    
    if (!term && !status_id) {
      return res.status(400).json({
        status: "error",
        message: "Se requiere al menos un criterio de búsqueda (term o status_id)"
      });
    }
    
    const searchResults = await searchCitizensDB({
      term,
      status_id: status_id ? parseInt(status_id) : null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Formatear las fechas de nacimiento para evitar problemas de zona horaria
    const formattedResults = searchResults.map(citizen => ({
      ...citizen,
      birth_date: formatDateOnly(citizen.birth_date)
    }));
    
    res.status(200).json({
      status: "success",
      message: "Búsqueda completada exitosamente",
      data: formattedResults,
      total: formattedResults.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error al buscar ciudadanos:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al buscar ciudadanos",
      error: error.message
    });
  }
}

/**
 * Obtener estadísticas de ciudadanos
 * @param {Request} req - Objeto de solicitud
 * @param {Response} res - Objeto de respuesta
 */
export async function getStats(req, res) {
  try {
    const stats = await getCitizenStatsDB();
    
    res.status(200).json({
      status: "success",
      message: "Estadísticas obtenidas correctamente",
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor al obtener estadísticas",
      error: error.message
    });
  }
}