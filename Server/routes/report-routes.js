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
// backend/routes/report-routes.ts
const express = __importStar(require("express"));
const report_service_1 = require("../services/report.service");
const router = express.Router();
router.get('/download-report', (req, res, next) => {
    const employeeId = parseInt(req.query.employeeId, 10);
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!employeeId || !year || !month) {
        res.status(400).send({ message: 'Missing or invalid query parameters' });
        return;
    }
    // 2) Use promise chaining or async/await
    (0, report_service_1.generateEmployeeReport)(employeeId, year, month)
        .then((reportBuffer) => {
        res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(reportBuffer);
    })
        .catch((error) => {
        console.error('Error generating report:', error);
        res.status(500).send({ message: 'Error generating report' });
    });
});
exports.default = router;
