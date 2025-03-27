"use strict";
// backend/services/report.service.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmployeeReport = generateEmployeeReport;
const db_1 = require("../config/db");
const exceljs_1 = __importDefault(require("exceljs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Step 1: Query the shifts from the DB for the specified user & month
 */
function fetchEmployeeShifts(employeeId, year, month) {
    return __awaiter(this, void 0, void 0, function* () {
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
            db_1.pool.query(sql, [employeeId, startDate, endDate], (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    });
}
/**
 * Generate an Excel report using exceljs without handling multiple shifts per day.
 * Each shift is placed on the row corresponding to its day-of-month.
 * If multiple shifts share the same day, they overwrite each other.
 */
function generateEmployeeReport(employeeId, year, month) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1) Fetch shifts
        const shifts = yield fetchEmployeeShifts(employeeId, year, month);
        // 2) Copy the template to a temp folder
        const sourceFile = path.join(__dirname, '..', 'assets', 'empty_report.xlsx');
        const tempDir = path.join(__dirname, 'temp');
        yield fs.promises.mkdir(tempDir, { recursive: true });
        const timestamp = Date.now();
        const tempFileName = `report-${timestamp}.xlsx`;
        const tempFilePath = path.join(tempDir, tempFileName);
        yield fs.promises.copyFile(sourceFile, tempFilePath);
        // 3) Read the copied file with exceljs
        const workbook = new exceljs_1.default.Workbook();
        yield workbook.xlsx.readFile(tempFilePath);
        // 4) Get the main sheet (sheet index 1)
        const sheet = workbook.getWorksheet(1);
        if (!sheet) {
            throw new Error("Sheet #1 not found in the workbook. Check your template.");
        }
        // 5) Suppose row 4 is day 1 in your template, row 5 is day 2, etc.
        const baseRow = 4;
        // 6) Place each shift in the correct row
        for (const shift of shifts) {
            const shiftStartDate = shift.shiftStart;
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
            dayRow.getCell('B').value = shiftStartDate.toLocaleDateString('de-DE'); // Shift date
            dayRow.getCell('F').value = shiftStartDate.toLocaleTimeString('de-DE'); // Start time
            if (shift.shiftEnd) {
                const shiftEndDate = shift.shiftEnd;
                dayRow.getCell('G').value = shiftEndDate.toLocaleTimeString('de-DE'); // End time
            }
        }
        // 7) Write workbook to a buffer
        yield workbook.xlsx.writeFile(tempFilePath);
        const fileBuffer = yield fs.promises.readFile(tempFilePath);
        // Clean up
        yield fs.promises.unlink(tempFilePath);
        return fileBuffer;
    });
}
