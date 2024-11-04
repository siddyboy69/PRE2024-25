DROP DATABASE IF EXISTS Zeitausgleich;
CREATE DATABASE Zeitausgleich;
USE Zeitausgleich;

CREATE TABLE user (
  id INT(11) NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) DEFAULT NULL,
  username VARCHAR(20) NOT NULL UNIQUE,
  password CHAR(60) NOT NULL,
  email VARCHAR(60) NOT NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  firstname VARCHAR(20) DEFAULT NULL,
  lastname VARCHAR(20) DEFAULT NULL,
  sex VARCHAR(12) NOT NULL DEFAULT 'thing',
  address VARCHAR(100) DEFAULT NULL,
  postalcode VARCHAR(10) DEFAULT NULL,
  city VARCHAR(20) DEFAULT NULL,
  country VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (id)
);
INSERT INTO user 
(id, uuid, username, password, email, is_admin, firstname, lastname, sex, address, postalcode, city, country)
VALUES 
(1, '25d8e727-a0ee-11ee-b4cd-1c697ab46a24', 'admin', 'admin', 'admin@BNC-AUSTRIA.tv', 1, 'Admine', 'Adminsdorfer', 'female', 'Admingasse 1/2/3', '8010', 'Graz', 'Austria');

select * from user; 

CREATE TABLE employee (
  employee_id INT(11) NOT NULL,
  department VARCHAR(50) DEFAULT NULL,
  position VARCHAR(50) DEFAULT NULL,
  shift_type ENUM('Day', 'Night', 'Flexible') DEFAULT 'Flexible',
  FOREIGN KEY (employee_id) REFERENCES user(id)
);

CREATE TABLE shift (
  id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  break_duration INT DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
);

CREATE TABLE attendance (
  id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  clock_in DATETIME NOT NULL,
  clock_out DATETIME DEFAULT NULL,
  is_late TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
);
CREATE TABLE role (
  role_id INT(11) NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(20) NOT NULL,
  PRIMARY KEY (role_id)
);

CREATE TABLE document_repository (
  doc_id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  doc_name VARCHAR(100) NOT NULL,
  doc_type ENUM('contract', 'shift_plan', 'report') NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_path VARCHAR(255) NOT NULL,
  PRIMARY KEY (doc_id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
);

CREATE TABLE report (
  report_id INT(11) NOT NULL AUTO_INCREMENT,
  report_name VARCHAR(100) NOT NULL,
  generated_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  report_type ENUM('work_hours', 'schedule') NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  PRIMARY KEY (report_id)
);