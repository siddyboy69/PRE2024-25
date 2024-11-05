"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const mysql_1 = __importDefault(require("mysql"));
const config_1 = __importDefault(require("config"));
const connectionLimit = config_1.default.get('dbConfig.connectionLimit');
const host = config_1.default.get('dbConfig.host');
const user = config_1.default.get('dbConfig.user');
const pwd = config_1.default.get('dbConfig.pwd');
const database = config_1.default.get('dbConfig.database');
exports.pool = mysql_1.default.createPool({
    connectionLimit: connectionLimit,
    host: host,
    user: user,
    password: pwd,
    database: database
});
