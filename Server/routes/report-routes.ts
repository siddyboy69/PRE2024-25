// backend/routes/report-routes.ts
import * as express from 'express';
import { generateReport } from '../services/report.service';

const router = express.Router();

// This route will generate and send the Excel file as a download
router.get('/download-report', async (req, res) => {
    try {
        const reportBuffer = await generateReport();
        // Set headers so that the browser downloads the file
        res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(reportBuffer);
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).send({ message: 'Error generating report' });
    }
});

export default router;
