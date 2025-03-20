// backend/routes/report-routes.ts
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import { generateEmployeeReport } from '../services/report.service';

const router = express.Router();

router.get('/download-report', (req: Request, res: Response, next: NextFunction) => {
    const employeeId = parseInt(req.query.employeeId as string, 10);
    const year = parseInt(req.query.year as string, 10);
    const month = parseInt(req.query.month as string, 10);

    if (!employeeId || !year || !month) {
        res.status(400).send({ message: 'Missing or invalid query parameters' });
        return;
    }

    // 2) Use promise chaining or async/await
    generateEmployeeReport(employeeId, year, month)
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

export default router;
