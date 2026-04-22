-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 22, 2026 at 06:21 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pastomatai`
--

-- --------------------------------------------------------

--
-- Table structure for table `dureles`
--

CREATE TABLE `dureles` (
  `dureliuId` int(11) NOT NULL,
  `numeris` int(11) DEFAULT NULL,
  `statusas` tinyint(1) DEFAULT 0,
  `pastomato_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dureles`
--

INSERT INTO `dureles` (`dureliuId`, `numeris`, `statusas`, `pastomato_id`) VALUES
(5, 1, 0, 1),
(6, 2, 0, 1),
(7, 3, 0, 2),
(8, 4, 0, 2);

-- --------------------------------------------------------

--
-- Table structure for table `pastomatas`
--

CREATE TABLE `pastomatas` (
  `idNr` int(11) NOT NULL,
  `adresas` varchar(255) DEFAULT NULL,
  `uzimtas` int(11) DEFAULT 0,
  `talpa` int(11) DEFAULT NULL,
  `dienosBeAptarnavimo` int(11) DEFAULT 0,
  `laukanciiosSiuntos` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pastomatas`
--

INSERT INTO `pastomatas` (`idNr`, `adresas`, `uzimtas`, `talpa`, `dienosBeAptarnavimo`, `laukanciiosSiuntos`) VALUES
(1, 'Kaunas, Laisves al. 1', 0, 20, 0, 0),
(2, 'Vilnius, Gedimino pr. 5', 0, 30, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `patvirtinimas`
--

CREATE TABLE `patvirtinimas` (
  `patvirtinimoId` int(11) NOT NULL,
  `patvirtintasIdejimas` tinyint(1) DEFAULT NULL,
  `patvirtintasIsiemimas` tinyint(1) DEFAULT NULL,
  `siunta_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patvirtinimas`
--

INSERT INTO `patvirtinimas` (`patvirtinimoId`, `patvirtintasIdejimas`, `patvirtintasIsiemimas`, `siunta_id`) VALUES
(3, 1, 0, 18),
(4, 1, 1, 19);

-- --------------------------------------------------------

--
-- Table structure for table `siunta`
--

CREATE TABLE `siunta` (
  `siuntosNr` int(11) NOT NULL,
  `busena` enum('uzregistruota','issiusta','vietoje','atsaukta') DEFAULT NULL,
  `lipdukoNr` int(11) DEFAULT NULL,
  `kodas` int(11) DEFAULT NULL,
  `pastomato_id` int(11) NOT NULL,
  `uzsakymo_id` int(11) NOT NULL,
  `dureliu_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `siunta`
--

INSERT INTO `siunta` (`siuntosNr`, `busena`, `lipdukoNr`, `kodas`, `pastomato_id`, `uzsakymo_id`, `dureliu_id`) VALUES
(18, 'uzregistruota', 1111, 5555, 1, 1, 5),
(19, 'issiusta', 2222, 6666, 1, 2, 6);

-- --------------------------------------------------------

--
-- Table structure for table `uzsakymas`
--

CREATE TABLE `uzsakymas` (
  `uzsakymoId` int(11) NOT NULL,
  `kaina` double DEFAULT NULL,
  `busena` enum('neapmoketa','apmoketa') DEFAULT NULL,
  `svoris` double DEFAULT NULL,
  `siuntejo_tel_nr` varchar(50) DEFAULT NULL,
  `gavejo_vardas` varchar(100) DEFAULT NULL,
  `gavejo_pavarde` varchar(100) DEFAULT NULL,
  `gavejo_tel_nr` varchar(50) DEFAULT NULL,
  `gavejo_adresas` varchar(255) DEFAULT NULL,
  `uzsakymo_laikas` date DEFAULT NULL,
  `gavejo_el_pastas` varchar(150) DEFAULT NULL,
  `vartotojo_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `uzsakymas`
--

INSERT INTO `uzsakymas` (`uzsakymoId`, `kaina`, `busena`, `svoris`, `siuntejo_tel_nr`, `gavejo_vardas`, `gavejo_pavarde`, `gavejo_tel_nr`, `gavejo_adresas`, `uzsakymo_laikas`, `gavejo_el_pastas`, `vartotojo_id`) VALUES
(1, 5.99, 'apmoketa', 1.2, '+37060000001', 'Jonas', 'Jonaitis', '+37060000011', 'Kaunas', '2026-04-21', 'jonas@mail.com', 2),
(2, 8.5, 'neapmoketa', 2.5, '+37060000002', 'Ona', 'Onute', '+37060000022', 'Vilnius', '2026-04-21', 'ona@mail.com', 3);

-- --------------------------------------------------------

--
-- Table structure for table `vartotojas`
--

CREATE TABLE `vartotojas` (
  `vartotojoId` int(11) NOT NULL,
  `prisijungimo_vardas` varchar(100) NOT NULL,
  `slaptazodis` varchar(255) NOT NULL,
  `vardas` varchar(100) DEFAULT NULL,
  `pavarde` varchar(100) DEFAULT NULL,
  `el_pastas` varchar(150) DEFAULT NULL,
  `role` enum('administratorius','kurjeris','vartotojas') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vartotojas`
--

INSERT INTO `vartotojas` (`vartotojoId`, `prisijungimo_vardas`, `slaptazodis`, `vardas`, `pavarde`, `el_pastas`, `role`) VALUES
(1, 'admin@ktu.lt', '$2b$10$KkHxX.UQbJbgRhlfGMZlb.M49zqF/zN.q1C7DlenYwc5t8ZwvPgF.', 'adad', 'adad', 'admin@ktu.lt', 'vartotojas'),
(2, 'admin', 'hashed_pw', 'Admin', 'Admin', 'admin@mail.com', 'administratorius'),
(3, 'user1', 'hashed_pw', 'Jonas', 'Jonaitis', 'jonas@mail.com', 'vartotojas'),
(4, 'user2', 'hashed_pw', 'Ona', 'Onute', 'ona@mail.com', 'vartotojas'),
(5, 'admin@ktu.lt', '$2b$10$paa8bmbLsM5GfjR2C/efJuFl6xIr6nGCg.teFL7LwmXDEF9VezEyu', 'Mantas', 'Titas', 'adminas@ktu.lt', 'vartotojas'),
(6, 'nauajsUser', '$2b$10$QB9uTA42rkU4vDgbBLt7dOYHivv.CH29LlvlZnnlg71iXbHPoFuyi', 'vardenis', 'pavardensis', 'pastas@gmai.com', 'vartotojas');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dureles`
--
ALTER TABLE `dureles`
  ADD PRIMARY KEY (`dureliuId`),
  ADD KEY `idx_dureles_pastomatas` (`pastomato_id`);

--
-- Indexes for table `pastomatas`
--
ALTER TABLE `pastomatas`
  ADD PRIMARY KEY (`idNr`);

--
-- Indexes for table `patvirtinimas`
--
ALTER TABLE `patvirtinimas`
  ADD PRIMARY KEY (`patvirtinimoId`),
  ADD KEY `idx_patvirtinimas_siunta` (`siunta_id`);

--
-- Indexes for table `siunta`
--
ALTER TABLE `siunta`
  ADD PRIMARY KEY (`siuntosNr`),
  ADD UNIQUE KEY `uzsakymo_id` (`uzsakymo_id`),
  ADD KEY `dureliu_id` (`dureliu_id`),
  ADD KEY `idx_siunta_pastomatas` (`pastomato_id`);

--
-- Indexes for table `uzsakymas`
--
ALTER TABLE `uzsakymas`
  ADD PRIMARY KEY (`uzsakymoId`),
  ADD KEY `idx_uzsakymas_vartotojas` (`vartotojo_id`);

--
-- Indexes for table `vartotojas`
--
ALTER TABLE `vartotojas`
  ADD PRIMARY KEY (`vartotojoId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dureles`
--
ALTER TABLE `dureles`
  MODIFY `dureliuId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `pastomatas`
--
ALTER TABLE `pastomatas`
  MODIFY `idNr` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `patvirtinimas`
--
ALTER TABLE `patvirtinimas`
  MODIFY `patvirtinimoId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `siunta`
--
ALTER TABLE `siunta`
  MODIFY `siuntosNr` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `uzsakymas`
--
ALTER TABLE `uzsakymas`
  MODIFY `uzsakymoId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vartotojas`
--
ALTER TABLE `vartotojas`
  MODIFY `vartotojoId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dureles`
--
ALTER TABLE `dureles`
  ADD CONSTRAINT `dureles_ibfk_1` FOREIGN KEY (`pastomato_id`) REFERENCES `pastomatas` (`idNr`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `patvirtinimas`
--
ALTER TABLE `patvirtinimas`
  ADD CONSTRAINT `patvirtinimas_ibfk_1` FOREIGN KEY (`siunta_id`) REFERENCES `siunta` (`siuntosNr`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `siunta`
--
ALTER TABLE `siunta`
  ADD CONSTRAINT `siunta_ibfk_1` FOREIGN KEY (`pastomato_id`) REFERENCES `pastomatas` (`idNr`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `siunta_ibfk_2` FOREIGN KEY (`uzsakymo_id`) REFERENCES `uzsakymas` (`uzsakymoId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `siunta_ibfk_3` FOREIGN KEY (`dureliu_id`) REFERENCES `dureles` (`dureliuId`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `uzsakymas`
--
ALTER TABLE `uzsakymas`
  ADD CONSTRAINT `uzsakymas_ibfk_1` FOREIGN KEY (`vartotojo_id`) REFERENCES `vartotojas` (`vartotojoId`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
