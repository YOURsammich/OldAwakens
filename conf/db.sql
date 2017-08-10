-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               5.5.44-0+deb8u1 - (Debian)
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for awakens
DROP DATABASE IF EXISTS `awakens`;
CREATE DATABASE IF NOT EXISTS `awakens` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `awakens`;

-- Dumping structure for table awakens.channel_banned
DROP TABLE IF EXISTS `channel_banned`;
CREATE TABLE IF NOT EXISTS `channel_banned` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `channelName` varchar(100) NOT NULL,
  `remote_addr` varchar(255) DEFAULT NULL,
  `nick` varchar(200) DEFAULT NULL,
  `bannedBy` varchar(200) NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;

-- Data exporting was unselected.
-- Dumping structure for table awakens.channel_info
DROP TABLE IF EXISTS `channel_info`;
CREATE TABLE IF NOT EXISTS `channel_info` (
  `channelName` varchar(100) NOT NULL,
  `attribute` varchar(200) NOT NULL,
  `value` varchar(10000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Data exporting was unselected.
-- Dumping structure for table awakens.games
DROP TABLE IF EXISTS `games`;
CREATE TABLE IF NOT EXISTS `games` (
  `game` varchar(500) NOT NULL,
  `highscore` longtext NOT NULL,
  UNIQUE KEY `game` (`game`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Data exporting was unselected.
-- Dumping structure for table awakens.masks
DROP TABLE IF EXISTS `masks`;
CREATE TABLE IF NOT EXISTS `masks` (
  `mask` varchar(100) NOT NULL,
  `nick` varchar(100) NOT NULL,
  `ip` varchar(100) NOT NULL,
  UNIQUE KEY `mask` (`mask`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Data exporting was unselected.
-- Dumping structure for table awakens.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `nick` varchar(500) NOT NULL,
  `hat` varchar(10000) NOT NULL,
  `flair` varchar(1000) NOT NULL,
  `password` varchar(500) NOT NULL,
  `remote_addr` varchar(500) NOT NULL,
  `role` int(15) NOT NULL,
  `cursor` varchar(10000) DEFAULT NULL,
  `part` varchar(200) NOT NULL,
  UNIQUE KEY `nick` (`nick`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Data exporting was unselected.
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
