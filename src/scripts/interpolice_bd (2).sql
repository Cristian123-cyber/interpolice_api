-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: mysql
-- Tiempo de generación: 27-08-2025 a las 21:40:35
-- Versión del servidor: 8.0.42
-- Versión de PHP: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `interpolice_bd`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citations`
--

CREATE TABLE `citations` (
  `id` bigint NOT NULL,
  `citizen_id` bigint NOT NULL,
  `date` datetime NOT NULL,
  `description` text NOT NULL,
  `fine_amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citizens`
--

CREATE TABLE `citizens` (
  `id` bigint NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `nick_name` varchar(100) DEFAULT NULL,
  `birth_date` date NOT NULL,
  `origin_planet` int NOT NULL,
  `residence_planet` int NOT NULL,
  `avatar_url` text NOT NULL,
  `qr_code` varchar(255) NOT NULL,
  `status_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `criminal_records`
--

CREATE TABLE `criminal_records` (
  `id` bigint NOT NULL,
  `citizen_id` bigint NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `location` int NOT NULL,
  `description` text NOT NULL,
  `crime_type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `planets`
--

CREATE TABLE `planets` (
  `id` int NOT NULL,
  `planet_name` varchar(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `planets`
--

INSERT INTO `planets` (`id`, `planet_name`) VALUES
(1, 'Tierra'),
(2, 'Marte');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `role_name`) VALUES
(4, 'Admin'),
(5, 'Commander'),
(7, 'CourtClerk'),
(6, 'General'),
(8, 'PoliceOfficer');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `statuses`
--

CREATE TABLE `statuses` (
  `id` int NOT NULL,
  `status_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `statuses`
--

INSERT INTO `statuses` (`id`, `status_name`, `description`) VALUES
(1, 'DEAD', NULL),
(2, 'ALIVE', NULL),
(3, 'FROZEN', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `user_email` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role_id`, `user_email`) VALUES
(1, 'Chisavito', '$2b$12$h0hTjY3S95mdd7ueoGxuzuoDyEjnoQC7mMlTE0waItU.lJyb7zgH2', 4, 'crischisavo@gmail.com');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `citations`
--
ALTER TABLE `citations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `citizen_id` (`citizen_id`);

--
-- Indices de la tabla `citizens`
--
ALTER TABLE `citizens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `qr_code` (`qr_code`),
  ADD UNIQUE KEY `nick_name` (`nick_name`),
  ADD KEY `citizens_statuses` (`status_id`),
  ADD KEY `citizens_planets` (`origin_planet`),
  ADD KEY `citizens_planets_residence` (`residence_planet`);

--
-- Indices de la tabla `criminal_records`
--
ALTER TABLE `criminal_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `citizen_id` (`citizen_id`),
  ADD KEY `criminal_records_planets` (`location`);

--
-- Indices de la tabla `planets`
--
ALTER TABLE `planets`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indices de la tabla `statuses`
--
ALTER TABLE `statuses`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `citations`
--
ALTER TABLE `citations`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `citizens`
--
ALTER TABLE `citizens`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `criminal_records`
--
ALTER TABLE `criminal_records`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `planets`
--
ALTER TABLE `planets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `statuses`
--
ALTER TABLE `statuses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `citations`
--
ALTER TABLE `citations`
  ADD CONSTRAINT `citations_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`);

--
-- Filtros para la tabla `citizens`
--
ALTER TABLE `citizens`
  ADD CONSTRAINT `citizens_planets` FOREIGN KEY (`origin_planet`) REFERENCES `planets` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `citizens_planets_residence` FOREIGN KEY (`residence_planet`) REFERENCES `planets` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `citizens_statuses` FOREIGN KEY (`status_id`) REFERENCES `statuses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `criminal_records`
--
ALTER TABLE `criminal_records`
  ADD CONSTRAINT `criminal_records_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`),
  ADD CONSTRAINT `criminal_records_planets` FOREIGN KEY (`location`) REFERENCES `planets` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
