// Importamos las librerías necesarias
import express from "express"; // ES6 modules
import "dotenv/config"; // Cargar variables de entorno
import morgan from "morgan"; // Logger para HTTP requests
import cors from "cors"; // Cross-Origin Resource Sharing

// Importamos las rutas de los módulos
import citizenRoutes from "./src/modules/citizens/citizens.routes.js";
import authRoutes from "./src/modules/auth/auth.routes.js";
import recordRoutes, { recordsSearchRouter } from "./src/modules/records/records.routes.js";
import citationRoutes, { citationsSearchRouter } from "./src/modules/citations/citations.routes.js";

// Crear la instancia de Express
const app = express();

// Configurar middlewares globales
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan("combined")); // Logger más detallado para producción
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*", // Configurar origen específico en producción
  credentials: true
}));

// Servir archivos estáticos (para imágenes de avatares)
app.use('/uploads', express.static('public/uploads'));


// Configurar rutas de la API
app.use("/api/citizens", citizenRoutes);
app.use("/api/auth", authRoutes);

// Configurar rutas anidadas para antecedentes penales
app.use("/api/citizens/:citizenId/records", recordRoutes);
// Configurar rutas globales para búsqueda y estadísticas de antecedentes
app.use("/api/records", recordsSearchRouter);

// Configurar rutas anidadas para citaciones (amonestaciones menores)
app.use("/api/citizens/:citizenId/citations", citationRoutes);
// Configurar rutas globales para búsqueda y estadísticas de citaciones
app.use("/api/citations", citationsSearchRouter);


// Ruta de health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Interpolice API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found",
    path: req.originalUrl
  });
});

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Configurar el puerto y iniciar el servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Interpolice API ON in port: ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints at: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Citizens endpoints at: http://localhost:${PORT}/api/citizens`);
  console.log(`📋 Records endpoints at: http://localhost:${PORT}/api/citizens/:citizenId/records`);
  console.log(`🔍 Records search at: http://localhost:${PORT}/api/records`);
  console.log(`⚖️ Citations endpoints at: http://localhost:${PORT}/api/citizens/:citizenId/citations`);
  console.log(`🔎 Citations search at: http://localhost:${PORT}/api/citations`);
  console.log(`📁 Static files at: http://localhost:${PORT}/uploads`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
