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
    PRIMARY KEY (id)
  );
INSERT INTO user
	(id, username, password,is_admin, firstname, lastname, sex)
VALUES
	(1, 'admin', 'admin',1, 'Admine', 'Adminsdorfer', 'female');
