import { pool } from "./config/db";

async function insertShift(userId: number, date: Date) {
    try {
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) {
            console.log(`Skipping weekend ${date.toDateString()}`);
            return;
        }

        // Set shift times with proper timezone handling
        const shiftDate = new Date(date);
        shiftDate.setHours(0, 0, 0, 0);

        const shiftStart = new Date(shiftDate);
        shiftStart.setHours(10, 0, 0);

        const shiftEnd = new Date(shiftDate);
        shiftEnd.setHours(17, 0, 0);

        // Create break times
        const breakStart = new Date(shiftDate);
        breakStart.setHours(14, 0, 0);

        const breakEnd = new Date(shiftDate);
        breakEnd.setHours(14, 30, 0);

        // Format all dates for MySQL (YYYY-MM-DD HH:mm:ss)
        const formatDateForMySQL = (date: Date) => {
            const offset = date.getTimezoneOffset();
            const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
            return adjustedDate.toISOString().slice(0, 19).replace('T', ' ');
        };

        const mysqlShiftStart = formatDateForMySQL(shiftStart);
        const mysqlShiftEnd = formatDateForMySQL(shiftEnd);
        const mysqlBreakStart = formatDateForMySQL(breakStart);
        const mysqlBreakEnd = formatDateForMySQL(breakEnd);

        console.log(`Inserting shift for ${date.toDateString()}`);
        console.log(`Shift start: ${mysqlShiftStart}`);
        console.log(`Shift end: ${mysqlShiftEnd}`);

        // Insert shift
        const shiftSql = `
           INSERT INTO shift (user_id, shiftStart, shiftEnd)
           VALUES (?, ?, ?);
       `;

        const shiftResult: any = await new Promise((resolve, reject) => {
            pool.query(shiftSql, [userId, mysqlShiftStart, mysqlShiftEnd], (err, result) => {
                if (err) {
                    console.error('Error inserting shift:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        // Insert break
        const breakSql = `
           INSERT INTO break (shift_id, breakStart, breakEnd)
           VALUES (?, ?, ?);
       `;

        await new Promise((resolve, reject) => {
            pool.query(breakSql, [shiftResult.insertId, mysqlBreakStart, mysqlBreakEnd], (err, result) => {
                if (err) {
                    console.error('Error inserting break:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        console.log(`Successfully inserted shift and break for ${date.toDateString()}\n`);

    } catch (error) {
        console.error('Error inserting shift and break:', error);
        throw error;
    }
}

async function initializeNovemberShifts() {
    try {
        const userId = 2;
        const year = 2024;
        const month = 10; // 10 for November (0-based month)

        console.log(`Starting initialization for November ${year}`);

        // Clear existing shifts first
        await new Promise((resolve, reject) => {
            const clearSql = `DELETE s FROM shift s 
                           LEFT JOIN break b ON s.id = b.shift_id 
                           WHERE MONTH(s.shiftStart) = ? 
                           AND YEAR(s.shiftStart) = ? 
                           AND s.user_id = ?`;
            pool.query(clearSql, [month + 1, year, userId], (err, result) => {
                if (err) {
                    console.error('Error clearing existing shifts:', err);
                    reject(err);
                } else {
                    console.log('Cleared existing shifts');
                    resolve(result);
                }
            });
        });

        // Get last day of November
        const lastDay = new Date(year, month + 1, 0).getDate();
        console.log(`Processing days 1 through ${lastDay}`);

        // Insert shifts for each day
        for (let day = 1; day <= lastDay; day++) {
            const currentDate = new Date(year, month, day);
            await insertShift(userId, currentDate);
        }

        console.log('Successfully initialized all November shifts');
        process.exit(0);

    } catch (error) {
        console.error('Error initializing November shifts:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeNovemberShifts();