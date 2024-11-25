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

DELIMITER //
CREATE TRIGGER before_insert_user
BEFORE INSERT ON user
FOR EACH ROW
BEGIN
    IF NEW.is_admin = 1 THEN
        -- Check if there's already an admin
        IF (SELECT COUNT(*) FROM user WHERE is_admin = 1) >= 1 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only one admin is allowed in the database.';
        END IF;
    END IF;
END;
//
DELIMITER ;

CREATE TABLE shift (
 id INT(11) NOT NULL AUTO_INCREMENT
);
select * from user;

