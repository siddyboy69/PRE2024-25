        DROP DATABASE IF EXISTS Zeitausgleich;
        CREATE DATABASE Zeitausgleich;
        USE Zeitausgleich;

        CREATE TABLE user (
            id INT(11) NOT NULL AUTO_INCREMENT,
            uuid VARCHAR(36) DEFAULT (UUID()),
            username VARCHAR(20) NOT NULL UNIQUE,
            password CHAR(60) NOT NULL,
            is_admin TINYINT(1) NOT NULL DEFAULT 0,
            firstname VARCHAR(20) DEFAULT NULL,
            lastname VARCHAR(20) DEFAULT NULL,
            sex VARCHAR(12) NOT NULL DEFAULT 'thing',
            deleted TINYINT(1) DEFAULT 0,
            PRIMARY KEY (id)
        );

        CREATE TABLE shift (
            id INT(11) NOT NULL AUTO_INCREMENT,
            user_id INT(11) NOT NULL,
            shiftStart DATETIME NOT NULL,
            shiftEnd DATETIME,
            PRIMARY KEY (id),
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        );

        CREATE TABLE break (
            id INT(11) NOT NULL AUTO_INCREMENT,
            shift_id INT(11) NOT NULL,
            breakStart DATETIME NOT NULL,
            breakEnd DATETIME,
            PRIMARY KEY (id),
            FOREIGN KEY (shift_id) REFERENCES shift(id) ON DELETE CASCADE
        );

