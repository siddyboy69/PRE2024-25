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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firmenRouter = void 0;
const express = __importStar(require("express"));
const db_1 = require("../config/db"); // <-- adjust if needed
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firmen_1 = require("../model/firmen");
exports.firmenRouter = express.Router();
// Example JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 's3cureP@ssW0rd12345!';
// Middleware to verify token (similar to your other routes)
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (typeof token !== 'string') {
        res.status(403).send({ message: 'No token provided!' });
        return; // Return only to stop execution, not returning the Response
    }
    const parts = token.split(' ');
    const actualToken = parts[1];
    if (!actualToken) {
        res.status(403).send({ message: 'No token provided!' });
        return;
    }
    jsonwebtoken_1.default.verify(actualToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).send({ message: 'Unauthorized!' });
            return;
        }
        req.userId = decoded.id;
        next();
    });
};
exports.firmenRouter.post('/', verifyToken, (req, res, next) => {
    const { bezeichnung } = req.body;
    if (!bezeichnung) {
        res.status(400).send({ message: 'Missing bezeichnung' });
        return; // Stop execution here
    }
    const sql = `INSERT INTO firma (bezeichnung) VALUES (?)`;
    db_1.pool.query(sql, [bezeichnung], (err, result) => {
        if (err) {
            console.error('Error creating firma:', err);
            res.status(500).send({ message: 'Error creating firma' });
            return;
        }
        // Respond with 201 Created
        res.status(201).send({
            message: 'Firma created successfully',
            firmaId: result.insertId,
            bezeichnung
        });
        // No need to return the Response
    });
});
// === READ all Firmen (GET /firmen) ===
exports.firmenRouter.get('/', verifyToken, (req, res) => {
    const sql = 'SELECT * FROM firma ORDER BY bezeichnung ASC';
    db_1.pool.query(sql, (err, rows) => {
        if (err) {
            console.error('Error fetching Firmen:', err);
            return res.status(500).send({ message: 'Error fetching Firmen' });
        }
        // Convert each row to a Firma model instance if desired
        const result = rows.map((row) => new firmen_1.Firma(row.id, row.bezeichnung));
        return res.status(200).send(result);
    });
});
// === READ single Firma by ID (GET /firmen/:id) ===
exports.firmenRouter.get('/:id', verifyToken, (req, res) => {
    const firmaId = parseInt(req.params.id, 10);
    if (!firmaId) {
        res.status(400).send({ message: 'Invalid ID' });
        return; // End execution
    }
    const sql = 'SELECT * FROM firma WHERE id = ?';
    db_1.pool.query(sql, [firmaId], (err, rows) => {
        if (err) {
            console.error('Error fetching firma:', err);
            res.status(500).send({ message: 'Error fetching firma' });
            return; // End execution
        }
        if (rows.length === 0) {
            res.status(404).send({ message: 'Firma not found' });
            return;
        }
        const row = rows[0];
        const firma = new firmen_1.Firma(row.id, row.bezeichnung);
        res.status(200).send(firma);
        // No need to return anything here
    });
});
// === UPDATE Firma by ID (PUT /firmen/:id) ===
exports.firmenRouter.put('/:id', verifyToken, (req, res) => {
    const firmaId = parseInt(req.params.id, 10);
    const { bezeichnung } = req.body;
    if (!firmaId || !bezeichnung) {
        res.status(400).send({ message: 'Invalid input' });
        return;
    }
    const sql = `
    UPDATE firma
    SET bezeichnung = ?
    WHERE id = ?;
  `;
    db_1.pool.query(sql, [bezeichnung, firmaId], (err, result) => {
        if (err) {
            console.error('Error updating firma:', err);
            res.status(500).send({ message: 'Error updating firma' });
            return;
        }
        res.status(200).send({ message: 'Firma updated successfully' });
    });
});
// === DELETE Firma by ID (DELETE /firmen/:id) ===
exports.firmenRouter.delete('/:id', verifyToken, (req, res) => {
    const firmaId = parseInt(req.params.id, 10);
    if (!firmaId) {
        res.status(400).send({ message: 'Invalid ID' });
        return;
    }
    const sql = 'DELETE FROM firma WHERE id = ?';
    db_1.pool.query(sql, [firmaId], (err, result) => {
        if (err) {
            console.error('Error deleting firma:', err);
            res.status(500).send({ message: 'Error deleting firma' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).send({ message: 'Firma not found or already deleted' });
            return;
        }
        res.status(200).send({ message: 'Firma deleted successfully' });
    });
});
