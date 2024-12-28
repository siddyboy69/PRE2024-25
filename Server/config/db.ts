import mysql from 'mysql';
import config from 'config';

const connectionLimit: number = config.get<number>('dbConfig.connectionLimit');
const host: string = config.get<string>('dbConfig.host');
const user: string = config.get<string>('dbConfig.user');
const pwd: string = config.get<string>('dbConfig.pwd');
const database: string = config.get<string>('dbConfig.database');

export const pool = mysql.createPool({
    connectionLimit: connectionLimit,
    host: host,
    user: user,
    password: pwd,
    database: database
});