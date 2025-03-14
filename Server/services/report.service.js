"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = void 0;
// backend/services/report.service.ts
const XLSX = __importStar(require("xlsx"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const generateReport = () => {
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
                    const ws = XLSX.utils.aoa_to_sheet([[]]);
                    // Append the new worksheet to the workbook
                    XLSX.utils.book_append_sheet(workbook, ws, 'Report2-Test');
                    // Write the workbook to a buffer
                    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
                    // Optionally delete the temporary file
                    fs.unlink(destFile, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error("Error deleting temporary file", unlinkErr);
                        }
                    });
                    resolve(wbout);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    });
};
exports.generateReport = generateReport;
