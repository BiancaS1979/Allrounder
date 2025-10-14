-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 12. Okt 2025 um 17:20
-- Server-Version: 10.4.32-MariaDB
-- PHP-Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `allrounder`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `messages`
--

INSERT INTO `messages` (`id`, `username`, `message`, `created_at`) VALUES
(3, 'biggi', 'U2FsdGVkX188bi7W6hvkm0wnK7L5JPS3zRWJFdcJ7VA=', '2025-10-02 18:30:13'),
(4, 'bu', 'U2FsdGVkX18IUQjIG7wOb3GY/Jj7W/kClUKYyAIy0aA=', '2025-10-03 19:57:34'),
(5, 'lia', 'U2FsdGVkX199xjoL5QAkJnQHqvAfN9VCX4fUUS1dZn0=', '2025-10-04 12:32:29'),
(6, 'bianca', 'U2FsdGVkX182KlhI941YsIalSmD4Kb8TemJ6ZNQXd5g=', '2025-10-12 15:10:01'),
(7, 'bia', 'U2FsdGVkX19UqWtGFIndXxpaT7QK20kgr6k3huLdN00=', '2025-10-12 15:10:12');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
