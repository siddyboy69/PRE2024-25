"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express = __importStar(require("express"));
const db_1 = require("../config/db");
const user_1 = require("../model/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.userRouter = express.Router();
// Secret key for JWT (use environment variables for production)
const JWT_SECRET = process.env.JWT_SECRET || 's3cureP@ssW0rd12345!';
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (typeof authHeader !== 'string') {
        res.status(403).send({ message: 'No token provided!' });
        return;
    }
    const parts = authHeader.split(' ');
    const token = parts[1];
    if (!token) {
        res.status(403).send({ message: 'No token provided!' });
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).send({ message: 'Unauthorized!' });
            return;
        }
        req.userId = decoded.id;
        next();
    });
};
// Route to get all users (non-admins only)
exports.userRouter.get('/', verifyToken, (req, res) => {
    let data = [];
    db_1.pool.query('SELECT * FROM user WHERE is_admin = 0 AND deleted = 0', (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send('Server error, please contact support.');
            return;
        }
        for (let row of rows) {
            data.push(new user_1.User(row.id, row.uuid, row.username, row.password, row.is_admin, row.firstname, row.lastname, row.sex, row.deleted));
        }
        res.status(200).send(data);
    });
});
// soft-delete (get user from bin)
exports.userRouter.get('/soft-delete', verifyToken, (req, res) => {
    let data = [];
    db_1.pool.query('SELECT * FROM user WHERE is_admin = 0 AND deleted = 1', (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send('Server error, please contact support.');
            return;
        }
        for (let row of rows) {
            data.push(new user_1.User(row.id, row.uuid, row.username, row.password, row.is_admin, row.firstname, row.lastname, row.sex, row.deleted));
        }
        res.status(200).send(data);
    });
});
// put soft-delete (move user into bin)
exports.userRouter.put('/soft-delete/:id', verifyToken, (req, res, next) => {
    db_1.pool.query('UPDATE user SET deleted = 1 WHERE id = ?', [req.params.id], (err) => {
        if (err)
            return res.status(500).send('Error moving user to bin');
        res.status(200).send({ message: 'User moved to bin' });
    });
});
// restore user (from bin)
exports.userRouter.put('/restore/:id', verifyToken, (req, res) => {
    db_1.pool.query('UPDATE user SET deleted = 0 WHERE id = ?', [req.params.id], (err) => {
        if (err)
            return res.status(500).send('Error restoring user');
        res.status(200).send({ message: 'User restored' });
    });
});
// Login route
exports.userRouter.post('/login/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const sqlUsernameCheck = "SELECT * FROM `user` WHERE user.username=" + db_1.pool.escape(req.body.username);
    db_1.pool.query(sqlUsernameCheck, (err, rows) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            next(err);
            return;
        }
        // Check if username exists
        if (rows.length === 0) {
            res.status(401).send({ message: 'The username is incorrect.' }); // Custom error message
            return;
        }
        const user = rows[0];
        const isPasswordMatch = yield bcrypt_1.default.compare(req.body.password, user.password);
        // Check if password matches
        if (!isPasswordMatch) {
            res.status(401).send({ message: 'The password is incorrect.' }); // Custom error message
            return;
        }
        // Generate JWT Token
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });
        // Create User object
        const data = new user_1.User(user.id, user.uuid, user.username, user.password, user.is_admin, user.firstname, user.lastname, user.sex, user.deleted);
        // Return success response
        res.status(200).send({ user: data, token });
    }));
}));
// Registration route
exports.userRouter.post('/register/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, firstname, lastname, sex } = req.body;
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const sql = `INSERT INTO user (uuid, username, password, firstname, lastname, sex)
                     VALUES (uuid(), ${db_1.pool.escape(username)}, ${db_1.pool.escape(hashedPassword)},
                             ${db_1.pool.escape(firstname)}, ${db_1.pool.escape(lastname)},
                             ${db_1.pool.escape(sex)});`;
        db_1.pool.query(sql, (err, rows) => {
            if (err) {
                next(err);
                return;
            }
            if (rows.affectedRows > 0) {
                db_1.pool.query('SELECT * FROM user WHERE id = ?', [rows.insertId], (err, rws) => {
                    if (err) {
                        next(err);
                        return;
                    }
                    if (rws.length > 0) {
                        const usr = {
                            id: rws[0].id,
                            uuid: rws[0].uuid,
                            username: rws[0].username,
                            password: rws[0].password,
                            is_admin: rws[0].is_admin,
                            firstname: rws[0].firstname,
                            lastname: rws[0].lastname,
                            sex: rws[0].sex,
                            deleted: rws[0].deleted
                        };
                        res.status(200).send(usr);
                    }
                    else {
                        res.status(404).send(null);
                    }
                });
            }
            else {
                res.status(404).send("User not created.");
            }
        });
    }
    catch (err) {
        next(err);
    }
}));
// Update user details
exports.userRouter.put('/update', verifyToken, (req, res, next) => {
    const _a = req.body, { id, userId } = _a, updateFields = __rest(_a, ["id", "userId"]); // Exclude both id and userId
    if (!id) {
        res.status(400).send({ message: 'User ID is required' });
        return;
    }
    const updateParts = Object.entries(updateFields)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, _]) => `${key} = ${db_1.pool.escape(updateFields[key])}`);
    if (updateParts.length === 0) {
        res.status(400).send({ message: 'No fields to update' });
        return;
    }
    const sql = `UPDATE user SET ${updateParts.join(', ')} WHERE id = ${db_1.pool.escape(id)}`;
    db_1.pool.query(sql, (err) => {
        if (err) {
            console.error("Update error:", err);
            next(err);
            return;
        }
        db_1.pool.query('SELECT id, username, firstname, lastname, sex, deleted FROM user WHERE id = ?', [id], (err, rows) => {
            if (err) {
                console.error("Select error:", err);
                next(err);
                return;
            }
            if (rows.length > 0) {
                res.status(200).send(rows[0]);
            }
            else {
                res.status(404).send({ message: 'User not found after update' });
            }
        });
    });
});
// Delete user by ID
exports.userRouter.delete('/delete/:id', verifyToken, (req, res, next) => {
    const userId = req.params.id;
    const sql = "DELETE FROM user WHERE id = ?";
    db_1.pool.query(sql, [userId], (err, result) => {
        if (err) {
            console.log(err);
            next(err);
            return;
        }
        if (result.affectedRows > 0) {
            res.status(200).send(`User with ID ${userId} deleted successfully.`);
        }
        else {
            res.status(404).send(`User with ID ${userId} not found.`);
        }
    });
});
// Get user details by ID
exports.userRouter.get('/:id', verifyToken, (req, res, next) => {
    const userId = req.params.id;
    db_1.pool.query('SELECT username, firstname, lastname, sex, deleted FROM user WHERE id = ?', [userId], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        if (rows.length > 0) {
            res.status(200).send(rows[0]);
        }
        else {
            res.status(404).send({ message: 'User not found' });
        }
    });
});
