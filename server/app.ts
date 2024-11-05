import express from 'express';
import cors from 'cors';
import { userRouter } from './routes/user-routes';


const app = express();
const port: number = 3000;
const origin: string = 'http://localhost:4200';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/users', userRouter);

function errorHandler(err: any, req: any, res: any, next: any) {
    if (res.headersSent) {
        return next(err);
    }
    console.error(err);
    res.status(500).send('Something broke! ' + err);
}
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
