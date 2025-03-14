// backend/services/report.service.ts
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export const generateReport = (): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        // Define the source file (move empty_report.xlsx into a backend folder, e.g., /assets)
        const sourceFile = path.join(__dirname, '..', 'assets', 'empty_report.xlsx');
        // Create a temporary file name using the current date
        const tempDir = path.join(__dirname, 'temp');
        const newFile = new Date().getDate().toString() + "-report.xlsx";
        const destFile = path.join(tempDir, newFile);

        // Ensure the temp directory exists
        fs.mkdir(tempDir, { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
                console.error("Error creating temp directory", mkdirErr);
                return reject(mkdirErr);
            }

            // Copy the source file to the temporary destination
            fs.copyFile(sourceFile, destFile, (copyErr) => {
                if (copyErr) {
                    console.error("Error copying file", copyErr);
                    return reject(copyErr);
                }
                try {
                    // Read the copied file as a workbook
                    const workbook = XLSX.readFile(destFile);
                    // Create an empty worksheet (you can modify this as needed)
                    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([[]]);
                    // Append the new worksheet to the workbook
                    XLSX.utils.book_append_sheet(workbook, ws, 'Report2-Test');
                    // Write the workbook to a buffer
                    const wbout: Buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
                    // Optionally delete the temporary file
                    fs.unlink(destFile, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error("Error deleting temporary file", unlinkErr);
                        }
                    });
                    resolve(wbout);
                } catch (err) {
                    reject(err);
                }
            });
        });
    });
};
