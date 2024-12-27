"use strict";
const mysql = require('mysql');

exports.pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DATABASE_HOST || 'database',
    user: 'root',
    password: '',
    database: 'Zeitausgleich'
});