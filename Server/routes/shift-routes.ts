import * as express from "express";
import { Request, Response, NextFunction } from 'express';
import { pool } from "../config/db";
import { Shift } from "../model/shift";
import { User } from "../model/user";
import jwt from 'jsonwebtoken';

export const shiftRouter = express.Router();

// Reuse the same JWT verification middleware from user-routes
const JWT_SECRET = process.env.JWT_SECRET || 's3cureP@ssW0rd12345!';

const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['authorization']?.split(' ')[1];  // Add space between quotes here

    if (!token) {
        res.status(403).send({ message: 'No token provided!' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
        if (err) {
            res.status(401).send({ message: 'Unauthorized!' });
            return;
        }
        (req as any).userId = decoded.id;
        next();
    });
};

shiftRouter.post('/', verifyToken, (req: Request, res: Response): void => {
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
            res.status(500).send({ message: 'Error creating shift' });
            return;
        }
        res.status(201).send({
            message: 'Shift created successfully',
            shiftId: result.insertId,
            shiftStart: mysqlDateTime
        });
    });
});


shiftRouter.get('/user/:userId', verifyToken, (req: Request, res: Response): void => {
    const userId = req.params.userId;
    const query = `
        SELECT * FROM shift 
        WHERE user_id = ?
        ORDER BY shiftStart DESC;
    `;

    pool.query(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching shifts:', err);
            res.status(500).send({ message: 'Error fetching shifts' });
            return;
        }
        res.status(200).send(rows);
    });
});

// Update a shift
shiftRouter.put('/:shiftId', verifyToken, (req: Request, res: Response): void => {
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
            res.status(500).send({ message: 'Error updating shift' });
            return;
        }
        res.status(200).send({ message: 'Shift updated successfully' });
    });
});

// Delete a shift
shiftRouter.delete('/:shiftId', verifyToken, (req: Request, res: Response): void => {
    const shiftId = req.params.shiftId;
    const query = 'DELETE FROM shift WHERE id = ?';

    pool.query(query, [shiftId], (err, result) => {
        if (err) {
            console.error('Error deleting shift:', err);
            res.status(500).send({ message: 'Error deleting shift' });
            return;
        }
        res.status(200).send({ message: 'Shift deleted successfully' });
    });
});

// Get all shifts (admin only)
shiftRouter.get('/all', verifyToken, (req: Request, res: Response): void => {
    const query = `
        SELECT s.*, u.firstname, u.lastname 
        FROM shift s
        JOIN user u ON s.user_id = u.id
        ORDER BY s.shiftStart DESC;
    `;

    pool.query(query, (err, rows) => {
        if (err) {
            console.error('Error fetching all shifts:', err);
            res.status(500).send({ message: 'Error fetching shifts' });
            return;
        }
        res.status(200).send(rows);
    });
});

// In shift-routes.ts
shiftRouter.get('/active/:userId', verifyToken, (req: Request, res: Response): void => {
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
            res.status(500).send({ message: 'Error fetching active shift' });
            return;
        }
        if (rows.length > 0) {
            const shift = rows[0];
            // Convert MySQL datetime to JS Date
            const shiftDate = new Date(shift.formattedShiftStart + 'Z');
            shift.shiftStart = shiftDate.toISOString();
            res.status(200).send(shift);
        } else {
            res.status(404).send({ message: 'No active shift found' });
        }
    });
});
shiftRouter.put('/end/:userId', verifyToken, (req: Request, res: Response): void => {
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
            res.status(500).send({ message: 'Error ending shift' });
            return;
        }
        res.status(200).send({
            message: 'Shift ended successfully',
            shiftEnd: mysqlDateTime
        });
    });
});
shiftRouter.get('/today/:userId', verifyToken, (req: Request, res: Response): void => {
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
        ORDER BY s.shiftStart DESC, b.breakStart ASC
    `;
    interface ShiftRow {
        id: number;
        user_id: number;
        shiftStart: string;
        shiftEnd: string | null;
        break_id: number | null;
        break_start: string | null;
        break_end: string | null;
        formattedShiftStart: string;
        formattedShiftEnd: string | null;
    }

    pool.query(query, [userId], (err, rows: ShiftRow[]) => {
        if (err) {
            console.error('Error fetching today shift:', err);
            res.status(500).send({ message: 'Error fetching today shift' });
            return;
        }

        if (rows.length > 0) {
            // Group breaks by shift
            const shift = {
                ...rows[0],
                breaks: rows.map((row: ShiftRow) => row.break_id ? {
                    id: row.break_id,
                    breakStart: row.break_start,
                    breakEnd: row.break_end
                } : null).filter(Boolean)
            };

            res.status(200).send(shift);
        } else {
            res.status(404).send({ message: 'No shift found for today' });
        }
    });
});

// For starting a break
shiftRouter.post('/break/start/:shiftId', verifyToken, (req: Request, res: Response): void => {
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
            res.status(500).send({ message: 'Error starting break' });
            return;
        }
        res.status(201).send({
            message: 'Break started successfully',
            breakId: result.insertId,
            breakStart: mysqlDateTime
        });
    });
});

// For ending a break
shiftRouter.put('/break/end/:breakId', verifyToken, (req: Request, res: Response): void => {
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
            res.status(500).send({ message: 'Error ending break' });
            return;
        }
        res.status(200).send({
            message: 'Break ended successfully',
            breakEnd: mysqlDateTime
        });
    });
});

// Get all breaks for a shift
shiftRouter.get('/breaks/:shiftId', verifyToken, (req: Request, res: Response): void => {
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
            res.status(500).send({ message: 'Error fetching breaks' });
            return;
        }
        res.status(200).send(rows);
    });
});

shiftRouter.get('/date/:userId/:date', verifyToken, (req: Request, res: Response): void => {
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

        // Group all breaks for the shift
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
