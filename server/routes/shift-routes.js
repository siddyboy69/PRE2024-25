"use strict";
const express = require("express");
const { pool } = require("../config/db");
const { Shift } = require("../model/shift");
const { User } = require("../model/user");
const jwt = require('jsonwebtoken');
const {Request, Response} = require("express");

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
        SELECT s.*,
               b.id as break_id,
               b.breakStart as break_start,
               b.breakEnd as break_end,
               DATE_FORMAT(s.shiftStart, '%Y-%m-%d %H:%i:%s') as formattedShiftStart,
               DATE_FORMAT(s.shiftEnd, '%Y-%m-%d %H:%i:%s') as formattedShiftEnd
        FROM shift s
        LEFT JOIN break b ON s.id = b.shift_id
        WHERE s.user_id = ? 
        AND DATE(s.shiftStart) = CURDATE()
        ORDER BY s.shiftStart DESC, b.breakStart ASC;
    `;

    pool.query(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching today shift:', err);
            return res.status(500).send({ message: 'Error fetching today shift' });
        }

        if (rows.length > 0) {
            // Gruppiere Pausen zur jeweiligen Schicht
            const shift = {
                id: rows[0].id,
                user_id: rows[0].user_id,
                shiftStart: rows[0].formattedShiftStart,
                shiftEnd: rows[0].formattedShiftEnd,
                breaks: rows
                    .map(row => row.break_id ? {
                        id: row.break_id,
                        breakStart: row.break_start,
                        breakEnd: row.break_end
                    } : null)
                    .filter(Boolean)
            };

            return res.status(200).send(shift);
        } else {
            return res.status(404).send({ message: 'No shift found for today' });
        }
    });
});

shiftRouter.post('/break/start/:shiftId', verifyToken, (req, res) => {
    const shiftId = req.params.shiftId;
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    const mysqlDateTime = localDate.toISOString().slice(0, 19).replace('T', ' ');

    const query = `
        INSERT INTO break (shift_id, breakStart)
        VALUES (?, ?);
    `;

    pool.query(query, [shiftId, mysqlDateTime], (err, result) => {
        if (err) {
            console.error('Error starting break:', err);
            return res.status(500).send({ message: 'Error starting break' });
        }
        res.status(201).send({
            message: 'Break started successfully',
            breakId: result.insertId,
            breakStart: mysqlDateTime
        });
    });
});
shiftRouter.post('/', verifyToken, (req, res) => {
    const { userId } = req.body;
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

// **2. Pause beenden**
shiftRouter.put('/break/end/:breakId', verifyToken, (req, res) => {
    const breakId = req.params.breakId;
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    const mysqlDateTime = localDate.toISOString().slice(0, 19).replace('T', ' ');

    const query = `
        UPDATE break 
        SET breakEnd = ? 
        WHERE id = ?;
    `;

    pool.query(query, [mysqlDateTime, breakId], (err, result) => {
        if (err) {
            console.error('Error ending break:', err);
            return res.status(500).send({ message: 'Error ending break' });
        }
        res.status(200).send({
            message: 'Break ended successfully',
            breakEnd: mysqlDateTime
        });
    });
});


shiftRouter.get('/breaks/:shiftId', verifyToken, (req, res) => {
    const shiftId = req.params.shiftId;
    const query = `
        SELECT * 
        FROM break 
        WHERE shift_id = ?
        ORDER BY breakStart;
    `;

    pool.query(query, [shiftId], (err, rows) => {
        if (err) {
            console.error('Error fetching breaks:', err);
            return res.status(500).send({ message: 'Error fetching breaks' });
        }
        res.status(200).send(rows);
    });
});
shiftRouter.get('/monthly/:userId/:year/:month', verifyToken, (req, res) => {
    const { userId, year, month } = req.params;
    const query = `
        SELECT s.*, b.id as break_id, b.breakStart, b.breakEnd
        FROM shift s
        LEFT JOIN break b ON s.id = b.shift_id
        WHERE s.user_id = ?
        AND YEAR(s.shiftStart) = ?
        AND MONTH(s.shiftStart) = ?
        ORDER BY s.shiftStart ASC;
    `;

    pool.query(query, [userId, year, month], (err, rows) => {
        if (err) {
            console.error('Error fetching monthly shifts:', err);
            return res.status(500).send({ message: 'Error fetching monthly shifts' });
        }

        // Gruppiere Pausen nach Schicht
        const shifts = [];
        const shiftsMap = new Map();

        rows.forEach(row => {
            if (!shiftsMap.has(row.id)) {
                shiftsMap.set(row.id, {
                    id: row.id,
                    shiftStart: row.shiftStart,
                    shiftEnd: row.shiftEnd,
                    breaks: []
                });
                shifts.push(shiftsMap.get(row.id));
            }

            if (row.break_id) {
                shiftsMap.get(row.id).breaks.push({
                    id: row.break_id,
                    breakStart: row.breakStart,
                    breakEnd: row.breakEnd
                });
            }
        });

        res.status(200).send(shifts);
    });
});
shiftRouter.get('/date/:userId/:date', verifyToken, (req, res) => {
    const { userId, date } = req.params;
    const query = `
        SELECT s.*, 
               DATE_FORMAT(s.shiftStart, '%Y-%m-%d %H:%i:%s') as formattedShiftStart,
               DATE_FORMAT(s.shiftEnd, '%Y-%m-%d %H:%i:%s') as formattedShiftEnd,
               b.id as break_id, 
               DATE_FORMAT(b.breakStart, '%Y-%m-%d %H:%i:%s') as formattedBreakStart,
               DATE_FORMAT(b.breakEnd, '%Y-%m-%d %H:%i:%s') as formattedBreakEnd
        FROM shift s
        LEFT JOIN break b ON s.id = b.shift_id
        WHERE s.user_id = ?
        AND DATE(s.shiftStart) = DATE(?)
        ORDER BY s.shiftStart ASC, b.breakStart ASC;
    `;

    pool.query(query, [userId, date], (err, rows) => {
        if (err) {
            console.error('Error fetching shift:', err);
            return res.status(500).send({ message: 'Error fetching shift' });
        }

        if (rows.length === 0) {
            return res.status(200).send(null);
        }

        // Gruppiere alle Pausen für die Schicht
        const shift = {
            id: rows[0].id,
            shiftStart: rows[0].formattedShiftStart,
            shiftEnd: rows[0].formattedShiftEnd,
            breaks: rows
                .filter(row => row.break_id)
                .map(row => ({
                    id: row.break_id,
                    breakStart: row.formattedBreakStart,
                    breakEnd: row.formattedBreakEnd
                }))
        };

        console.log('Sending shift with breaks:', shift);
        res.status(200).send(shift);
    });
});
