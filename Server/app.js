"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const user_routes_1 = require("./routes/user-routes");
const shift_routes_1 = require("./routes/shift-routes");
const firmen_routes_1 = require("./routes/firmen-routes");
const report_routes_1 = __importDefault(require("./routes/report-routes"));
const app = (0, express_1.default)();
const port = 3000;
const origin = 'http://localhost:4200';
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({ origin, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store,no-cache,must-revalidate,proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});
app.use('/users', user_routes_1.userRouter);
app.use('/shifts', shift_routes_1.shiftRouter);
app.use('/firmen', firmen_routes_1.firmenRouter);
app.use('/reports', report_routes_1.default);
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error('Error:', err);
    res.status(500).send('Something broke! ' + err);
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
