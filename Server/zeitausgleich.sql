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

CREATE TABLE shift (
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(11) NOT NULL,
    shiftStart DATETIME NOT NULL,
    shiftEnd DATETIME NOT NULL,
    breakStart DATETIME,
    breakEnd DATETIME,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id ON shift(user_id);
CREATE INDEX idx_shiftStart ON shift(shiftStart);
CREATE INDEX idx_shiftEnd ON shift(shiftEnd);

-- Validation to prevent overlapping shifts for the same user
DELIMITER //
CREATE TRIGGER before_insert_shift
BEFORE INSERT ON shift
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM shift 
        WHERE user_id = NEW.user_id 
        AND (
            (NEW.shiftStart BETWEEN shiftStart AND shiftEnd) OR 
            (NEW.shiftEnd BETWEEN shiftStart AND shiftEnd)
        )
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Shift overlaps with an existing shift for this user.';
    END IF;
END;
//
DELIMITER ;

/* inserts */
INSERT INTO user (uuid, username, password, is_admin, firstname, lastname, sex)
VALUES
(UUID(), 'employee1', 'hashed_password', 0, 'John', 'Doe', 'M'),
(UUID(), 'employee2', 'hashed_password', 0, 'Jane', 'Smith', 'F');

INSERT INTO shift (user_id, shiftStart, shiftEnd, breakStart, breakEnd)
VALUES
(1, '2023-12-01 09:00:00', '2023-12-01 17:00:00', '2023-12-01 12:00:00', '2023-12-01 12:30:00'),
(2, '2023-12-01 08:30:00', '2023-12-01 16:30:00', '2023-12-01 12:00:00', '2023-12-01 12:45:00');

/* use cases / selects */
SELECT u.firstname, u.lastname, s.shiftStart, s.shiftEnd FROM user u JOIN shift s ON u.id = s.user_id;