import { pool } from "./config/db";

async function insertShift(userId: number, date: Date) {
    try {
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) {
            return;
        }

        // Set times for the shift
        const shiftStart = new Date(date);
        shiftStart.setHours(10, 0, 0);

        const shiftEnd = new Date(date);
        shiftEnd.setHours(17, 0, 0);

        // First, insert the shift
        const shiftSql = `
            INSERT INTO shift (user_id, shiftStart, shiftEnd)
            VALUES (?, ?, ?);
        `;

        const shiftResult: any = await new Promise((resolve, reject) => {
            pool.query(shiftSql, [userId, shiftStart, shiftEnd], (err, result) => {
                if (err) {
                    console.error('Error inserting shift:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Then, insert the break for this shift
        const breakStart = new Date(date);
        breakStart.setHours(14, 0, 0);

        const breakEnd = new Date(date);
        breakEnd.setHours(14, 30, 0);

        const breakSql = `
            INSERT INTO break (shift_id, breakStart, breakEnd)
            VALUES (?, ?, ?);
        `;

        await new Promise((resolve, reject) => {
            pool.query(breakSql, [shiftResult.insertId, breakStart, breakEnd], (err, result) => {
                if (err) {
                    console.error('Error inserting break:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        console.log(`Shift and break inserted successfully for ${date.toLocaleDateString()}`);

    } catch (error) {
        console.error('Error inserting shift and break:', error);
        throw error;
    }
}

async function initializeNovemberShifts() {
    try {
        const userId = 2; // User with primary key 2
        const year = 2024;
        const month = 10; // 10 for November (0-based month)

        // Get last day of November 2024
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Insert shifts for each day
        for (let day = 1; day <= lastDay; day++) {
            const currentDate = new Date(year, month, day);
            await insertShift(userId, currentDate);
        }

        console.log('All November shifts initialized successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing November shifts:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeNovemberShifts();