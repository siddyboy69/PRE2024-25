import { pool } from "./config/db";

async function insertShift(userId: number, date: Date) {
    try {
        // 1) Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) {
            console.log(`Skipping weekend ${date.toDateString()}`);
            return;
        }

        // 2) Define shift & break hours in local time
        //    Here, shiftStart = 10:00, shiftEnd = 17:00, break = 14:00–14:30
        const shiftDate = new Date(date);
        shiftDate.setHours(0, 0, 0, 0);

        const shiftStart = new Date(shiftDate);
        shiftStart.setHours(10, 0, 0, 0);

        const shiftEnd = new Date(shiftDate);
        shiftEnd.setHours(17, 0, 0, 0);

        const breakStart = new Date(shiftDate);
        breakStart.setHours(14, 0, 0, 0);

        const breakEnd = new Date(shiftDate);
        breakEnd.setHours(14, 30, 0, 0);

        // 3) Format for MySQL without subtracting getTimezoneOffset()
        //    => store exactly "YYYY-MM-DD HH:mm:ss" local time
        const formatDateForMySQL = (d: Date) => {
            return d.toISOString().slice(0, 19).replace('T', ' ');
        };

        const mysqlShiftStart = formatDateForMySQL(shiftStart);
        const mysqlShiftEnd = formatDateForMySQL(shiftEnd);
        const mysqlBreakStart = formatDateForMySQL(breakStart);
        const mysqlBreakEnd = formatDateForMySQL(breakEnd);

        console.log(`Inserting shift for ${date.toDateString()}`);
        console.log(`Shift start: ${mysqlShiftStart}`);
        console.log(`Shift end:   ${mysqlShiftEnd}`);

        // 4) Insert the shift record
        const shiftSql = `
            INSERT INTO shift (user_id, shiftStart, shiftEnd)
            VALUES (?, ?, ?);
        `;

        const shiftResult: any = await new Promise((resolve, reject) => {
            pool.query(shiftSql, [userId, mysqlShiftStart, mysqlShiftEnd], (err, result) => {
                if (err) {
                    console.error('Error inserting shift:', err);
                    return reject(err);
                }
                resolve(result);
            });
        });

        // 5) Insert the break record
        const breakSql = `
            INSERT INTO break (shift_id, breakStart, breakEnd)
            VALUES (?, ?, ?);
        `;

        await new Promise((resolve, reject) => {
            pool.query(breakSql, [shiftResult.insertId, mysqlBreakStart, mysqlBreakEnd], (err, result) => {
                if (err) {
                    console.error('Error inserting break:', err);
                    return reject(err);
                }
                resolve(result);
            });
        });

        console.log(`Successfully inserted shift & break for ${date.toDateString()}\n`);
    } catch (error) {
        console.error('Error inserting shift and break:', error);
        throw error;
    }
}

async function initializeNovemberShifts() {
    try {
        // userId = 2 => Whichever user you want to assign these shifts to
        const userId = 2;

        // 2024 => year
        // 10   => 0-based index for November
        const year = 2024;
        const month = 10;

        console.log(`Starting initialization for November ${year} (0-based month index: ${month})`);

        // 1) Optionally clear existing shifts for that month
        await new Promise((resolve, reject) => {
            const clearSql = `
                DELETE s
                FROM shift s
                LEFT JOIN break b ON s.id = b.shift_id
                WHERE MONTH(s.shiftStart) = ?
                  AND YEAR(s.shiftStart) = ?
                  AND s.user_id = ?
            `;
            pool.query(clearSql, [month + 1, year, userId], (err, result) => {
                if (err) {
                    console.error('Error clearing existing shifts:', err);
                    return reject(err);
                }
                console.log('Cleared existing shifts for that user in that month');
                resolve(result);
            });
        });

        // 2) Insert new shifts for each day
        const lastDay = new Date(year, month + 1, 0).getDate();
        console.log(`Processing days 1 through ${lastDay}`);

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

// Run the initialization script
initializeNovemberShifts();
