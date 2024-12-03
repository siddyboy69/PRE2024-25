import * as express from "express";
import { pool } from "../config/db";
import { Shift } from "../model/shift";
import { User } from "../model/user";

export const shiftRouter = express.Router();

// Define an interface for the database row to provide type safety
interface ShiftRow {
    id: number;
    user_id: number;
    shiftStart: Date;
    shiftEnd: Date;
    breakStart: Date;
    breakEnd: Date;
    uuid: string;
    username: string;
    password: string;
    is_admin: boolean;
    firstname: string;
    lastname: string;
    sex: string;
}

// Route to get all shifts of a specific user
shiftRouter.get('/:userId', (req, res, next) => {
    const userId = req.params.userId;
    const sql = `
        SELECT 
            shift.id,
            shift.user_id,
            shift.shiftStart,
            shift.shiftEnd,
            shift.breakStart,
            shift.breakEnd,
            user.uuid,
            user.username,
            user.password,
            user.is_admin,
            user.firstname,
            user.lastname,
            user.sex
        FROM 
            shift
        JOIN 
            user ON shift.user_id = user.id
        WHERE 
            shift.user_id = ?
    `;

    pool.query(sql, [userId], (err, rows: ShiftRow[]) => {
        if (err) {
            console.error('Error querying shifts:', err);
            return next(err);
        }

        const data: Shift[] = rows.map(row => {
            const user = new User(
                row.user_id,
                row.uuid,
                row.username,
                row.password,
                row.is_admin,
                row.firstname,
                row.lastname,
                row.sex
            );

            return new Shift(
                row.id,
                user.id,
                row.shiftStart,
                row.shiftEnd,
                row.breakStart,
                row.breakEnd
            );
        });

        res.status(200).json(data);
    });
});

// Route to post a new shift
shiftRouter.post('/', (req, res, next) => {
    const { user_id, shiftStart, shiftEnd, breakStart, breakEnd } = req.body;

    const sql = `
        INSERT INTO shift (user_id, shiftStart, shiftEnd, breakStart, breakEnd)
        VALUES (?, ?, ?, ?, ?)
    `;

    pool.query(sql, [user_id, shiftStart, shiftEnd, breakStart, breakEnd], (err, result) => {
        if (err) {
            console.error('Error inserting shift:', err);
            return next(err);
        }

        res.status(201).json({
            message: "Shift created",
            shiftId: result.insertId
        });
    });
});

// Route to delete a shift
shiftRouter.delete('/:shiftId', (req, res, next) => {
    const shiftId = req.params.shiftId;

    const sql = "DELETE FROM shift WHERE id = ?";

    pool.query(sql, [shiftId], (err, result) => {
        if (err) {
            console.error('Error deleting shift:', err);
            return next(err);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Shift not found" });
        }

        res.status(200).json({ message: "Shift deleted" });
    });
});

// Route to update a shift
shiftRouter.put('/:shiftId', (req, res, next) => {
    const shiftId = req.params.shiftId;
    const { shiftStart, shiftEnd, breakStart, breakEnd } = req.body;

    const sql = `
        UPDATE shift
        SET shiftStart = ?, shiftEnd = ?, breakStart = ?, breakEnd = ?
        WHERE id = ?
    `;

    pool.query(sql, [shiftStart, shiftEnd, breakStart, breakEnd, shiftId], (err, result) => {
        if (err) {
            console.error('Error updating shift:', err);
            return next(err);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Shift not found" });
        }

        res.status(200).json({ message: "Shift updated" });
    });
});
