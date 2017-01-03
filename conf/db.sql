--
-- Database: `awakens`
--

-- --------------------------------------------------------

--
-- Table structure for table `channel_banned`
--

CREATE TABLE IF NOT EXISTS `channel_banned` (
  `channelName` varchar(100) NOT NULL,
  `banned` varchar(2000) NOT NULL,
  UNIQUE KEY `channelName` (`channelName`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `channel_info`
--

CREATE TABLE IF NOT EXISTS `channel_info` (
  `channelName` varchar(100) NOT NULL,
  `roles` longtext NOT NULL,
  `data` longtext NOT NULL,
  UNIQUE KEY `channelName` (`channelName`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

CREATE TABLE IF NOT EXISTS `games` (
  `game` varchar(500) NOT NULL,
  `highscore` longtext NOT NULL,
  UNIQUE KEY `game` (`game`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `masks`
--

CREATE TABLE IF NOT EXISTS `masks` (
  `mask` varchar(100) NOT NULL,
  `nick` varchar(100) NOT NULL,
  `ip` varchar(100) NOT NULL,
  UNIQUE KEY `mask` (`mask`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `nick` varchar(500) NOT NULL,
  `hat` varchar(10000) NOT NULL,
  `flair` varchar(1000) NOT NULL,
  `password` varchar(500) NOT NULL,
  `remote_addr` varchar(500) NOT NULL,
  `role` int(15) NOT NULL,
  UNIQUE KEY `nick` (`nick`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
