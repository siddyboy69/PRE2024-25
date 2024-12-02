import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { userRouter } from './routes/user-routes';
import { shiftRouter } from './routes/shift-routes';    // New import for shift routes

const app = express();
const port: number = 3000;
const origin: string = 'http://localhost:4200';

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup to allow requests from specific origin
app.use(
    cors({
        origin: origin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
);

// Prevent caching of responses to enhance security
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// Define routes
app.use('/users', userRouter);          // User-related routes
app.use('/shifts', shiftRouter);        // Shift-related routes (new)

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error('Error:', err);
    res.status(500).send('Something broke! ' + err);
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
