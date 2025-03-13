import * as express from "express";
import { Request, Response, NextFunction } from 'express';
import { pool } from "../config/db";
import { Shift } from "../model/shift";
import { User } from "../model/user";
import jwt from 'jsonwebtoken';
interface MonthlyStatsRow {
    shift_id: number;
    shiftStart: string;
    shiftEnd: string | null;
    breakStart: string | null;
    breakEnd: string | null;
}

export const shiftRouter = express.Router();

// Reuse the same JWT verification middleware from user-routes
const JWT_SECRET = process.env.JWT_SECRET || 's3cureP@ssW0rd12345!';

const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
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
                .filter((row: { break_id: any; }) => row.break_id)
                .map((row: { break_id: any; formattedBreakStart: any; formattedBreakEnd: any; }) => ({
                    id: row.break_id,
                    breakStart: row.formattedBreakStart,
                    breakEnd: row.formattedBreakEnd
                }))
        };

        console.log('Sending shift with breaks:', shift);
        res.status(200).send(shift);
    });
});
shiftRouter.get('/monthly-stats/:userId/:year/:month', verifyToken, (req: Request, res: Response): void => {
    const userId = parseInt(req.params.userId, 10);
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    // 1. Construct date range for start/end of the given month
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;

    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
    }
    const endOfMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01 00:00:00`;

    // 2. Query for shifts & breaks in [startOfMonth, endOfMonth)
    const query = `
        SELECT 
            s.id as shift_id,
            s.shiftStart,
            s.shiftEnd,
            b.breakStart,
            b.breakEnd
        FROM shift s
        LEFT JOIN break b ON s.id = b.shift_id
        WHERE s.user_id = ?
          AND s.shiftStart >= ?
          AND s.shiftStart < ?
        ORDER BY s.shiftStart ASC;
    `;

    pool.query(query, [userId, startOfMonth, endOfMonth], (err, rows) => {
        if (err) {
            console.error('Error fetching monthly stats:', err);
            return res.status(500).send({ message: 'Error fetching monthly stats' });
        }

        // We'll store date => { shifts: [], breaks: [] }
        type DateData = {
            shifts: { id: number; start: Date; end: Date | null }[];
            breaks: { start: Date; end: Date }[];
        };

        const shiftsByDate = new Map<string, DateData>();

        for (const row of rows) {
            // Convert shiftStart to a "YYYY-MM-DD" string
            const shiftDate = new Date(row.shiftStart).toISOString().split('T')[0];

            // Ensure we have an entry in the map
            if (!shiftsByDate.has(shiftDate)) {
                shiftsByDate.set(shiftDate, { shifts: [], breaks: [] });
            }

            const dateData = shiftsByDate.get(shiftDate)!;


            // Check if we already have that shift in dateData.shifts
            const existingShift = dateData.shifts.find(s => s.id === row.shift_id);
            if (!existingShift) {
                dateData.shifts.push({
                    id: row.shift_id,
                    start: new Date(row.shiftStart),
                    end: row.shiftEnd ? new Date(row.shiftEnd) : null
                });
            }

            // If there's a break with both start & end, record it
            if (row.breakStart && row.breakEnd) {
                dateData.breaks.push({
                    start: new Date(row.breakStart),
                    end: new Date(row.breakEnd)
                });
            }
        }

        // 4. Calculate total/average stats
        let totalWorkMinutes = 0;
        let totalBreakMinutes = 0;
        const dailyStats: any[] = [];

        shiftsByDate.forEach((dateData, date) => {
            // sum shift durations
            const dayWorkMinutes = dateData.shifts.reduce((acc, shift) => {
                if (shift.start && shift.end) {
                    return acc + (shift.end.getTime() - shift.start.getTime()) / 60000;
                }
                return acc;
            }, 0);

            // sum break durations
            const dayBreakMinutes = dateData.breaks.reduce((acc, b) => {
                return acc + (b.end.getTime() - b.start.getTime()) / 60000;
            }, 0);

            totalWorkMinutes += dayWorkMinutes;
            totalBreakMinutes += dayBreakMinutes;

            // We'll show the "first" shift's start/end in dailyStats
            dailyStats.push({
                date: date,
                hoursWorked: Math.round((dayWorkMinutes - dayBreakMinutes) / 60 * 100) / 100,
                breakMinutes: Math.round(dayBreakMinutes),
                shiftStart: dateData.shifts[0]?.start ?? null,
                shiftEnd: dateData.shifts[0]?.end ?? null
            });
        });

        // Avoid division-by-zero
        const totalDays = shiftsByDate.size || 1;

        const stats = {
            totalWorkDays: shiftsByDate.size,
            totalWorkHours: Math.round(totalWorkMinutes / 60 * 100) / 100,
            totalBreakMinutes: Math.round(totalBreakMinutes),
            averageShiftLength: Math.round(totalWorkMinutes / totalDays / 60 * 100) / 100,
            daysWithShifts: Array.from(shiftsByDate.keys()),
            dailyStats
        };

        res.status(200).send(stats);
    });
});
