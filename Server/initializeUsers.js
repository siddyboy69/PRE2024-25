"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
function insertAdminUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Hash the admin password "admin"
            const hashedPassword = yield bcrypt_1.default.hash('admin', 10);
            const sql = `
            INSERT INTO user (username, password, is_admin, firstname, lastname, sex) 
            VALUES (?, ?, 1, ?, ?, ?)
            ON DUPLICATE KEY UPDATE password = VALUES(password);
        `;
            yield new Promise((resolve, reject) => {
                db_1.pool.query(sql, ['admin', hashedPassword, 'Admin', 'Adminsdorfer', 'female'], (err, result) => {
                    if (err) {
                        console.error('Error inserting admin user:', err);
                        reject(err);
                    }
                    else {
                        console.log('Admin user inserted successfully.');
                        resolve(result);
                    }
                });
            });
        }
        catch (error) {
            console.error('Error hashing admin password:', error);
            process.exit(1);
        }
    });
}
// Function to insert multiple users
function insertUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Hash the consistent password "Montag01"
            const hashedPassword = yield bcrypt_1.default.hash('Montag01', 10);
            // Array of user data
            const users = [
                ['user01', 'Jane', 'Smith', 'female'],
                ['user02', 'Alice', 'Brown', 'female'],
                ['user03', 'Bob', 'Johnson', 'male'],
                ['user04', 'Charlie', 'Miller', 'other'],
                ['user05', 'Sam', 'Taylor', 'male'],
                ['user06', 'Alex', 'Lee', 'non-binary'],
                ['user07', 'Morgan', 'White', 'female'],
                ['user08', 'Jordan', 'Green', 'male'],
                ['user09', 'Chris', 'Black', 'other']
            ];
            // SQL statement with placeholders
            const sql = `
            INSERT INTO user (username, password, is_admin, firstname, lastname, sex) 
            VALUES (?, ?, 0, ?, ?, ?)
            ON DUPLICATE KEY UPDATE password = VALUES(password);
        `;
            // Loop through each user and insert them
            for (const user of users) {
                const [username, firstname, lastname, sex] = user;
                // Use a prepared statement to insert the user
                yield new Promise((resolve, reject) => {
                    db_1.pool.query(sql, [username, hashedPassword, firstname, lastname, sex], (err, result) => {
                        if (err) {
                            console.error(`Error inserting user ${username}:`, err);
                            reject(err);
                        }
                        else {
                            console.log(`User ${username} inserted successfully.`);
                            resolve(result);
                        }
                    });
                });
            }
            console.log('All users inserted successfully.');
            process.exit(0); // Exit the script successfully
        }
        catch (error) {
            console.error('Error hashing password or inserting users:', error);
            process.exit(1); // Exit the script with an error
        }
    });
}
// Call the functions to insert admin and other users
(function runInsertion() {
    return __awaiter(this, void 0, void 0, function* () {
        yield insertAdminUser();
        yield insertUsers();
    });
})();
