/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP TABLE IF EXISTS `BookRooms`;
CREATE TABLE `BookRooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `checkInDate` datetime NOT NULL,
  `checkOutDate` datetime NOT NULL,
  `guestCount` int NOT NULL,
  `userId` int NOT NULL,
  `deletedBy` int DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_bookroom_deletedBy` (`deletedBy`),
  KEY `idx_roomId_bookroom` (`roomId`),
  KEY `idx_userId` (`userId`),
  CONSTRAINT `fk_bookroom_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_bookroom_roomId` FOREIGN KEY (`roomId`) REFERENCES `Rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookroom_userId` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Comments`;
CREATE TABLE `Comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomId` int NOT NULL,
  `commenterId` int NOT NULL,
  `content` text NOT NULL,
  `rating` int DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `parentId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_comment_deletedBy` (`deletedBy`),
  KEY `idx_roomId` (`roomId`),
  KEY `idx_commenterId` (`commenterId`),
  KEY `idx_parentId` (`parentId`),
  CONSTRAINT `fk_comment_commenterId` FOREIGN KEY (`commenterId`) REFERENCES `Users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_parentId` FOREIGN KEY (`parentId`) REFERENCES `Comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_roomId` FOREIGN KEY (`roomId`) REFERENCES `Rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_rating` CHECK (((`rating` is null) or ((`rating` >= 1) and (`rating` <= 5)))),
  CONSTRAINT `Comments_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Locations`;
CREATE TABLE `Locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `province` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_location_deletedBy` (`deletedBy`),
  KEY `idx_province` (`province`),
  CONSTRAINT `fk_location_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Permissions`;
CREATE TABLE `Permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `module` varchar(255) NOT NULL,
  `deletedBy` int DEFAULT '0',
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `RolePermission`;
CREATE TABLE `RolePermission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roleId` int NOT NULL,
  `permissionId` int NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `deletedBy` int DEFAULT '0',
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_Role_Permission` (`roleId`,`permissionId`),
  KEY `permissionId` (`permissionId`),
  CONSTRAINT `RolePermission_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `Roles` (`id`),
  CONSTRAINT `RolePermission_ibfk_2` FOREIGN KEY (`permissionId`) REFERENCES `Permissions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Roles`;
CREATE TABLE `Roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `deletedBy` int DEFAULT '0',
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Rooms`;
CREATE TABLE `Rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guestCount` int NOT NULL,
  `bedroomCount` int NOT NULL,
  `bedCount` int NOT NULL,
  `bathroomCount` int NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `washingMachine` tinyint(1) NOT NULL DEFAULT '0',
  `iron` tinyint(1) NOT NULL DEFAULT '0',
  `tv` tinyint(1) NOT NULL DEFAULT '0',
  `airConditioner` tinyint(1) NOT NULL DEFAULT '0',
  `wifi` tinyint(1) NOT NULL DEFAULT '0',
  `kitchen` tinyint(1) NOT NULL DEFAULT '0',
  `parking` tinyint(1) NOT NULL DEFAULT '0',
  `pool` tinyint(1) NOT NULL DEFAULT '0',
  `ironingBoard` tinyint(1) NOT NULL DEFAULT '0',
  `locationId` int NOT NULL,
  `deletedBy` int DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image` json DEFAULT NULL,
  `hostId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_room_deletedBy` (`deletedBy`),
  KEY `idx_locationId` (`locationId`),
  KEY `fk_room_hostId` (`hostId`),
  CONSTRAINT `fk_room_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_room_hostId` FOREIGN KEY (`hostId`) REFERENCES `Users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_room_locationId` FOREIGN KEY (`locationId`) REFERENCES `Locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `gender` tinyint(1) DEFAULT NULL,
  `roleId` int NOT NULL DEFAULT '2',
  `deletedBy` int DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `deletedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_roleId` (`roleId`),
  KEY `fk_deletedBy` (`deletedBy`),
  KEY `idx_fullName` (`fullName`),
  CONSTRAINT `fk_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_roleId` FOREIGN KEY (`roleId`) REFERENCES `Roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `BookRooms` (`id`, `roomId`, `checkInDate`, `checkOutDate`, `guestCount`, `userId`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`) VALUES
(2, 14, '2025-06-24 00:00:00', '2025-07-01 00:00:00', 3, 5, NULL, 0, NULL, '2025-06-24 08:40:04', '2025-06-24 08:40:04');
INSERT INTO `Comments` (`id`, `roomId`, `commenterId`, `content`, `rating`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`, `parentId`) VALUES
(7, 14, 5, 'Phòng xịn thật á, view cực đẹp khỏi chê?', 5, NULL, 0, NULL, '2025-06-24 08:34:56', '2025-06-24 08:36:33', NULL);
INSERT INTO `Locations` (`id`, `name`, `province`, `country`, `image`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`, `latitude`, `longitude`) VALUES
(1, 'Phố cổ Hội An', 'Quảng Nam', 'Việt Nam', 'locations/fsafliavfihp1wbtvnul', NULL, 0, NULL, '2025-06-16 11:16:15', '2025-06-22 07:30:58', '15.87970000', '108.32580000'),
(2, 'Quận 2', 'Quảng Ninh', 'Việt Nam', 'locations/mhune1byekgonmc9ezba', NULL, 0, NULL, '2025-06-16 11:16:15', '2025-06-24 10:38:15', '20.91040000', '107.00890000'),
(3, 'Thành Phố Đà Lạt', 'Lâm Đồng', 'Việt Nam', 'locations/t1bktypi5a7zh4u8edhl', NULL, 0, NULL, '2025-06-16 11:16:15', '2025-06-19 03:20:16', NULL, NULL),
(4, 'Phố cổ Hà Nội', 'Hà Nội', 'Việt Nam', 'https://commons.wikimedia.org/wiki/File:Hanoi_Old_Quarter.jpg', NULL, 0, NULL, '2025-06-16 11:16:15', '2025-06-16 11:16:15', NULL, NULL),
(5, 'Đồng bằng sông Cửu Long', 'Cần Thơ', 'Việt Nam', 'https://vietnamtourism.com/images/mekong-delta.jpg', NULL, 0, NULL, '2025-06-16 11:16:15', '2025-06-16 11:16:15', NULL, NULL),
(6, 'Bà Nà Hills', 'Đà Nẵng', 'Việt Nam', 'locations/xdash17fvqt6timrgvhl', NULL, 0, NULL, '2025-06-17 20:28:44', '2025-06-19 05:17:26', NULL, NULL),
(7, 'Vinpearl Land', 'Nha Trang', 'Việt Nam', 'locations/vvkgta9mjvusouyicqex', NULL, 0, NULL, '2025-06-19 04:55:04', '2025-06-19 05:18:01', NULL, NULL),
(8, 'Quận 1', 'Thành Phố Hồ Chí Minh', 'Việt Nam', 'locations/afhyb5i8fkoavclaopzh', NULL, 0, NULL, '2025-06-24 10:37:19', '2025-06-24 10:37:19', NULL, NULL);
INSERT INTO `Permissions` (`id`, `name`, `endpoint`, `method`, `module`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`) VALUES
(1, 'host_create_room', '/api/rooms', 'POST', 'rooms', 0, 0, NULL, '2025-06-23 12:17:11', '2025-06-23 12:17:11'),
(2, 'host_view_rooms', '/api/rooms', 'GET', 'rooms', 0, 0, NULL, '2025-06-23 12:17:11', '2025-06-23 12:17:11'),
(3, 'host_update_room', '/api/rooms/:id', 'PATCH', 'rooms', 0, 0, NULL, '2025-06-23 12:17:11', '2025-06-23 13:54:26'),
(4, 'host_delete_room', '/api/rooms/:id', 'DELETE', 'rooms', 0, 0, NULL, '2025-06-23 12:17:11', '2025-06-23 12:55:09'),
(5, 'host_upload_images', '/api/rooms/*/upload', 'POST', 'rooms', 0, 0, NULL, '2025-06-23 12:17:11', '2025-06-23 12:17:11');
INSERT INTO `RolePermission` (`id`, `roleId`, `permissionId`, `isActive`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`) VALUES
(1, 3, 1, 1, 0, 0, NULL, '2025-06-23 12:20:55', '2025-06-23 12:20:55'),
(2, 3, 2, 1, 0, 0, NULL, '2025-06-23 12:23:45', '2025-06-23 12:23:45'),
(3, 3, 3, 1, 0, 0, NULL, '2025-06-23 12:23:45', '2025-06-23 12:23:45'),
(4, 3, 4, 1, 0, 0, NULL, '2025-06-23 12:23:45', '2025-06-23 12:23:45'),
(5, 3, 5, 1, 0, 0, NULL, '2025-06-23 12:23:45', '2025-06-23 12:23:45');
INSERT INTO `Roles` (`id`, `name`, `description`, `isActive`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`) VALUES
(1, 'ADMIN', 'Quản Trị Hệ Thống', 1, 0, 0, NULL, '2025-06-04 11:43:14', '2025-06-04 11:43:14'),
(2, 'USER', 'Người Dùng Hệ Thống', 1, 0, 0, NULL, '2025-06-04 11:44:17', '2025-06-04 11:44:17'),
(3, 'HOST', 'Chủ Nhà - Quản Lý Phòng', 1, 0, 0, NULL, '2025-06-22 07:11:55', '2025-06-23 12:08:12');
INSERT INTO `Rooms` (`id`, `name`, `guestCount`, `bedroomCount`, `bedCount`, `bathroomCount`, `description`, `price`, `washingMachine`, `iron`, `tv`, `airConditioner`, `wifi`, `kitchen`, `parking`, `pool`, `ironingBoard`, `locationId`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`, `image`, `hostId`) VALUES
(11, 'Panorama Nha Trang - Chợ đêm nhìn ra biển', 4, 1, 1, 1, 'Căn hộ sang trọng thoáng mát và view biển tuyệt đẹp', '1500000.00', 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, NULL, 0, NULL, '2025-06-23 10:47:33', '2025-06-23 10:47:33', '\"[\\\"rooms/uznmqhtqjwhnlrmzzv2i\\\",\\\"rooms/gv9sd4lxcysyhzs9sjkf\\\",\\\"rooms/ribidxtev6j3yguq5j8k\\\",\\\"rooms/uexnz5cxobz8n8mmlegg\\\",\\\"rooms/guw59l6u3w5kamvpxto2\\\"]\"', NULL),
(12, 'Superior Double - Angle Hotel', 4, 1, 1, 1, 'Căn hộ sang trọng thoáng mát và view biển tuyệt đẹp', '1500000.00', 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, NULL, 0, NULL, '2025-06-23 10:58:54', '2025-06-24 01:52:21', '\"[\\\"rooms/bdh9cjbd0mnsj0wvpfh3\\\",\\\"rooms/gwsphpscy3hynozd6hgk\\\",\\\"rooms/vljcbaafa1qjr2j8vzby\\\",\\\"rooms/nqkljmyxs5yif3gwt0to\\\",\\\"rooms/kir3bj5tcozvufbqr4d0\\\"]\"', 6),
(13, 'Căn hộ Goldcoast Nha Trang,Vinpearl Island View', 4, 1, 2, 1, 'Căn hộ sang trọng thoáng mát và view biển tuyệt đẹp', '1500000.00', 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 6, 1, '2025-06-23 14:03:45', '2025-06-23 14:02:54', '2025-06-23 14:03:45', '\"[\\\"rooms/udqbrmloz2rbbwlslhr0\\\",\\\"rooms/ts9muhntvlqfbkwqe8um\\\",\\\"rooms/d1hmflsqb15ioxqkhzci\\\",\\\"rooms/xjqdzx0bemkagiciib87\\\",\\\"rooms/eynorawjrs8n8p4fwabq\\\"]\"', 6),
(14, 'Phòng Deluxe 2 giường Hướng biển (Deluxe Twin Ocean View)', 4, 2, 2, 2, 'Căn hộ sang trọng thoáng mát và view biển tuyệt đẹp', '1500000.00', 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, NULL, 0, NULL, '2025-06-24 08:00:48', '2025-06-24 08:00:48', '\"[\\\"rooms/heu9ue4wechfxftucpmt\\\",\\\"rooms/g6z28nxal2cppnr61uho\\\",\\\"rooms/dox2wcdgqdohdrh8pwhc\\\",\\\"rooms/z9ame9d0uw7zkqdeo1h5\\\",\\\"rooms/kp8qepofakkqhx9ssybd\\\"]\"', 5),
(15, '39 Uchi - Căn Hộ Trung Tâm Thành Phố Đà Lạt', 4, 1, 2, 1, 'Căn hộ sang trọng thoáng mát và view biển tuyệt đẹp', '1500000.00', 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, NULL, 0, NULL, '2025-06-24 10:15:39', '2025-06-24 10:30:12', '\"[\\\"rooms/ymc3ihpnkixu9f5bpkfv\\\",\\\"rooms/xtv6wp8sisc2sd7qeu83\\\",\\\"rooms/l0tkpawzpt8z5c91d5ap\\\",\\\"rooms/gz0j4naxuuhqby3csoy5\\\",\\\"rooms/r3sbjtmope7ogkrxryfe\\\"]\"', 5);
INSERT INTO `Users` (`id`, `fullName`, `email`, `password`, `phone`, `birthday`, `avatar`, `gender`, `roleId`, `deletedBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`) VALUES
(2, 'Hihi', 'kimchi@gmail.com', '$2b$10$HoyUjeAkHEZbFvILbEA9mu/Dio4AkhjqTH1FhsQkyUoUCJCuvfV.a', NULL, NULL, NULL, NULL, 2, NULL, 0, NULL, '2025-06-06 17:45:34', '2025-06-11 19:52:44'),
(3, 'Tuấn Minh', 'tuanminh@gmail.com', '$2b$10$YKRygpOYjMtZLWaEliv9kuYOetp6SCdeQDmjocPZPpbXStn69l.qa', '0123573928', NULL, NULL, 1, 2, NULL, 0, NULL, '2025-06-13 14:11:05', '2025-06-14 10:52:50'),
(4, 'Kim Kim', 'kimkim@gmail.com', '$2b$10$or4O.QNpLO4DzSoZ8YXiW.9V5IGdNPW4N4nohncylnRhVqPC3g732', '01234567', NULL, NULL, 0, 2, NULL, 0, NULL, '2025-06-13 17:33:23', '2025-06-13 17:33:23'),
(5, 'Tuấn Anh', 'tuananh@gmail.com', '$2b$10$Xciywi3nzP0422u5GeVOy.876.VdR3LXP9dnxrAcwS0e8npMRW6j.', '0332146124', NULL, 'avatars/jtbnvirh5srubktpa0fz', 1, 1, NULL, 0, NULL, '2025-06-14 13:06:16', '2025-06-16 13:20:54'),
(6, 'Kim Trọng', 'kimtrong@gmail.com', '$2b$10$Hkr5ZwvRtwclZBS7xrIybuaSFk33avoK0alADLWD.ySOmXAKaSmTW', NULL, NULL, NULL, NULL, 3, NULL, 0, NULL, '2025-06-22 12:29:59', '2025-06-23 12:26:35'),
(7, 'Nguyễn Minh', 'nguyeminh@gmail.com', '$2b$10$h99puGD3wZLbq/J7YdF8IOIPe4cJf15YCGKw7B.fvnGd1WIaQrvkO', NULL, NULL, NULL, NULL, 2, NULL, 0, NULL, '2025-06-23 18:25:53', '2025-06-23 18:25:53');


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;