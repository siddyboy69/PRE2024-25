// backend/services/report.service.ts

import { pool } from '../config/db';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Step 1: Query the shifts from the DB for the specified user & month
 */
async function fetchEmployeeShifts(
    employeeId: number,
    year: number,
    month: number
): Promise<any[]> {
    return new Promise((resolve, reject) => {
        // Build date range
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        const sql = `
      SELECT
        s.id as shiftId,
        s.shiftStart,
        s.shiftEnd,
        u.firstname,
        u.lastname
      FROM shift s
      JOIN user u ON s.user_id = u.id
      WHERE s.user_id = ?
        AND s.shiftStart >= ?
        AND s.shiftStart < ?
      ORDER BY s.shiftStart ASC
    `;

        pool.query(sql, [employeeId, startDate, endDate], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Generate an Excel report using exceljs without handling multiple shifts per day.
 * Each shift is placed on the row corresponding to its day-of-month.
 * If multiple shifts share the same day, they overwrite each other.
 */
export async function generateEmployeeReport(
    employeeId: number,
    year: number,
    month: number
): Promise<Buffer> {
    // 1) Fetch shifts
    const shifts = await fetchEmployeeShifts(employeeId, year, month);

    // 2) Copy the template to a temp folder
    const sourceFile = path.join(__dirname, '..', 'assets', 'empty_report.xlsx');
    const tempDir = path.join(__dirname, 'temp');
    await fs.promises.mkdir(tempDir, { recursive: true });

    const timestamp = Date.now();
    const tempFileName = `report-${timestamp}.xlsx`;
    const tempFilePath = path.join(tempDir, tempFileName);

    await fs.promises.copyFile(sourceFile, tempFilePath);

    // 3) Read the copied file with exceljs
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(tempFilePath);

    // 4) Get the main sheet (sheet index 1)
    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
        throw new Error("Sheet #1 not found in the workbook. Check your template.");
    }

    // 5) Suppose row 4 is day 1 in your template, row 5 is day 2, etc.
    const baseRow = 4;

    // 6) Place each shift in the correct row
    for (const shift of shifts) {
        const shiftStartDate: Date = shift.shiftStart;
        // If invalid date, skip
        if (isNaN(shiftStartDate.getTime())) {
            continue;
        }

        // dayOfMonth => e.g., 26 => rowIndex=4+(26-1)=29
        const dayOfMonth = shiftStartDate.getDate();
        const rowIndex = baseRow + (dayOfMonth - 1);

        // Overwrite the weekday name in col A
        const weekdayName = shiftStartDate.toLocaleDateString('de-DE', { weekday: 'long' });
        const dayRow = sheet.getRow(rowIndex);
        dayRow.getCell('A').value = weekdayName;

        // Write date, start, end times
        dayRow.getCell('B').value = shiftStartDate.toLocaleDateString('de-DE');  // Shift date
        dayRow.getCell('F').value = shiftStartDate.toLocaleTimeString('de-DE'); // Start time
        if (shift.shiftEnd) {
            const shiftEndDate = shift.shiftEnd as Date;
            dayRow.getCell('G').value = shiftEndDate.toLocaleTimeString('de-DE'); // End time
        }
    }

    // 7) Write workbook to a buffer
    await workbook.xlsx.writeFile(tempFilePath);
    const fileBuffer = await fs.promises.readFile(tempFilePath);

    // Clean up
    await fs.promises.unlink(tempFilePath);

    return fileBuffer;
}
