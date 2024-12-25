"use strict";
const express = require("express");
const { pool } = require("../config/db");
const { Shift } = require("../model/shift");
const { User } = require("../model/user");
const jwt = require('jsonwebtoken');

const shiftRouter = express.Router();
exports.shiftRouter = shiftRouter;

const JWT_SECRET = process.env.JWT_SECRET || 's3cureP@ssW0rd12345!';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id;
        next();
    });
};


shiftRouter.post('/', verifyToken, (req, res) => {
    const { userId } = req.body;

    // Aktuelles Datum und Zeitzone anpassen
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    const mysqlDateTime = localDate.toISOString().slice(0, 19).replace('T', ' ');

    const query = `
        INSERT INTO shift (user_id, shiftStart)
        VALUES (?, ?);
    `;

    pool.query(query, [userId, mysqlDateTime], (err, result) => {
        if (err) {
            console.error('Error creating shift:', err);
            return res.status(500).send({ message: 'Error creating shift' });
        }
        res.status(201).send({
            message: 'Shift created successfully',
            shiftId: result.insertId,
            shiftStart: mysqlDateTime
        });
    });
});

shiftRouter.get('/user/:userId', verifyToken, (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT * FROM shift 
        WHERE user_id = ?
        ORDER BY shiftStart DESC;
    `;

    pool.query(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching shifts:', err);
            return res.status(500).send({ message: 'Error fetching shifts' });
        }
        res.status(200).send(rows);
    });
});

shiftRouter.put('/:shiftId', verifyToken, (req, res) => {
    const shiftId = req.params.shiftId;
    const { shiftEnd, breakStart, breakEnd } = req.body;
    const query = `
        UPDATE shift 
        SET shiftEnd = ?, breakStart = ?, breakEnd = ?
        WHERE id = ?;
    `;

    pool.query(query, [shiftEnd, breakStart, breakEnd, shiftId], (err, result) => {
        if (err) {
            console.error('Error updating shift:', err);
            return res.status(500).send({ message: 'Error updating shift' });
        }
        res.status(200).send({ message: 'Shift updated successfully' });
    });
});
shiftRouter.delete('/:shiftId', verifyToken, (req, res) => {
    const shiftId = req.params.shiftId;
    const query = 'DELETE FROM shift WHERE id = ?';

    pool.query(query, [shiftId], (err, result) => {
        if (err) {
            console.error('Error deleting shift:', err);
            return res.status(500).send({ message: 'Error deleting shift' });
        }
        res.status(200).send({ message: 'Shift deleted successfully' });
    });
});
shiftRouter.get('/all', verifyToken, (req, res) => {
    const query = `
        SELECT s.*, u.firstname, u.lastname 
        FROM shift s
        JOIN user u ON s.user_id = u.id
        ORDER BY s.shiftStart DESC;
    `;

    pool.query(query, (err, rows) => {
        if (err) {
            console.error('Error fetching all shifts:', err);
            return res.status(500).send({ message: 'Error fetching shifts' });
        }
        res.status(200).send(rows);
    });
});
shiftRouter.get('/active/:userId', verifyToken, (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT *, 
        DATE_FORMAT(shiftStart, '%Y-%m-%d %H:%i:%s') as formattedShiftStart 
        FROM shift 
        WHERE user_id = ? 
        AND shiftStart IS NOT NULL 
        AND shiftEnd IS NULL 
        ORDER BY shiftStart DESC 
        LIMIT 1
    `;

    pool.query(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching active shift:', err);
            return res.status(500).send({ message: 'Error fetching active shift' });
        }
        if (rows.length > 0) {
            const shift = rows[0];
            // Konvertiere MySQL datetime zu JavaScript ISO-Format
            const shiftDate = new Date(shift.formattedShiftStart + 'Z');
            shift.shiftStart = shiftDate.toISOString();
            res.status(200).send(shift);
        } else {
            res.status(404).send({ message: 'No active shift found' });
        }
    });
});
shiftRouter.put('/end/:userId', verifyToken, (req, res) => {
    const userId = req.params.userId;
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    const mysqlDateTime = localDate.toISOString().slice(0, 19).replace('T', ' ');

    const query = `
        UPDATE shift 
        SET shiftEnd = ? 
        WHERE user_id = ? 
        AND shiftEnd IS NULL 
        AND shiftStart IS NOT NULL
        ORDER BY shiftStart DESC 
        LIMIT 1
    `;

    pool.query(query, [mysqlDateTime, userId], (err, result) => {
        if (err) {
            console.error('Error ending shift:', err);
            return res.status(500).send({ message: 'Error ending shift' });
        }
        res.status(200).send({
            message: 'Shift ended successfully',
            shiftEnd: mysqlDateTime
        });
    });
});
shiftRouter.get('/today/:userId', verifyToken, (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT *, 
        DATE_FORMAT(shiftStart, '%Y-%m-%d %H:%i:%s') as formattedShiftStart,
        DATE_FORMAT(shiftEnd, '%Y-%m-%d %H:%i:%s') as formattedShiftEnd
        FROM shift 
        WHERE user_id = ? 
        AND DATE(shiftStart) = CURDATE()
        ORDER BY shiftStart DESC 
        LIMIT 1
    `;

    pool.query(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching today shift:', err);
            return res.status(500).send({ message: 'Error fetching today shift' });
        }
        if (rows.length > 0) {
            const shift = rows[0];
            // Convert MySQL datetime to JS Date
            const shiftStartDate = new Date(shift.formattedShiftStart + '');
            const shiftEndDate = shift.formattedShiftEnd ? new Date(shift.formattedShiftEnd + '') : null;

            shift.shiftStart = shiftStartDate.toISOString();
            shift.shiftEnd = shiftEndDate ? shiftEndDate.toISOString() : null;

            res.status(200).send(shift);
        } else {
            res.status(404).send({ message: 'No shift found for today' });
        }
    });
});