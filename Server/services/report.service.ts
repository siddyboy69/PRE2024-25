// backend/services/report.service.ts
import { pool } from '../config/db';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// 1) A helper function to query shift data for an employee, year, and month
async function fetchEmployeeShifts(employeeId: number, year: number, month: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
        // Construct date range for the given year/month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        // Naively build next month by incrementing month
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        const sql = `
      SELECT 
        s.id as shiftId,
        s.shiftStart,
        s.shiftEnd,
        b.breakStart,
        b.breakEnd,
        u.firstname,
        u.lastname
      FROM shift s
      JOIN user u ON s.user_id = u.id
      LEFT JOIN break b ON b.shift_id = s.id
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

// 2) Generate the Excel file from the template
export async function generateEmployeeReport(employeeId: number, year: number, month: number): Promise<Buffer> {
    // 2a) Fetch shift data from the DB
    const rows = await fetchEmployeeShifts(employeeId, year, month);

    // 2b) Copy the existing template to a temp folder
    const sourceFile = path.join(__dirname, '..', 'assets', 'empty_report.xlsx'); // Adjust path if needed
    const tempDir = path.join(__dirname, 'temp');
    await fs.promises.mkdir(tempDir, { recursive: true });

    const timestamp = Date.now();
    const tempFileName = `report-${timestamp}.xlsx`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Copy the template
    await fs.promises.copyFile(sourceFile, tempFilePath);

    // 2c) Read the copied file into a workbook
    const workbook = XLSX.readFile(tempFilePath);

    // 2d) Decide which sheet to populate.
    // For example, if your template’s main sheet is named "Sheet1":
    const sheetName = workbook.SheetNames[0];  // or "Sheet1"
    const worksheet = workbook.Sheets[sheetName];

    // 2e) Insert data into the template
    // Suppose you want to start writing data at row 10, with columns:
    //   A => Firstname
    //   B => Lastname
    //   C => Datum
    //   D => Beginn
    //   E => Ende
    //   F => Break Start
    //   G => Break End
    let rowIndex = 10; // or wherever you want to start
    for (const row of rows) {
        const shiftDate = new Date(row.shiftStart).toLocaleDateString('de-DE');
        const startTime = row.shiftStart ? new Date(row.shiftStart).toLocaleTimeString('de-DE') : '';
        const endTime = row.shiftEnd ? new Date(row.shiftEnd).toLocaleTimeString('de-DE') : '';
        const breakStart = row.breakStart ? new Date(row.breakStart).toLocaleTimeString('de-DE') : '';
        const breakEnd = row.breakEnd ? new Date(row.breakEnd).toLocaleTimeString('de-DE') : '';

        // Assign cell values (type 's' for string)
        worksheet[`A${rowIndex}`] = { t: 's', v: row.firstname };
        worksheet[`B${rowIndex}`] = { t: 's', v: row.lastname };
        worksheet[`C${rowIndex}`] = { t: 's', v: shiftDate };
        worksheet[`D${rowIndex}`] = { t: 's', v: startTime };
        worksheet[`E${rowIndex}`] = { t: 's', v: endTime };
        worksheet[`F${rowIndex}`] = { t: 's', v: breakStart };
        worksheet[`G${rowIndex}`] = { t: 's', v: breakEnd };

        rowIndex++;
    }

    // 2f) Write the updated workbook to a buffer
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Optionally delete the temp file
    await fs.promises.unlink(tempFilePath);

    return wbout;
}
