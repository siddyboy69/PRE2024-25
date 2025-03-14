import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { userRouter } from './routes/user-routes'
import { shiftRouter } from './routes/shift-routes'
import { firmenRouter } from './routes/firmen-routes'
import reportRouter from './routes/report-routes';

const app = express()
const port = 3000
const origin = 'http://localhost:4200'

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin, methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }))

app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control','no-store,no-cache,must-revalidate,proxy-revalidate')
    res.setHeader('Pragma','no-cache')
    res.setHeader('Expires','0')
    res.setHeader('Surrogate-Control','no-store')
    next()
})

app.use('/users', userRouter)
app.use('/shifts', shiftRouter)
app.use('/firmen', firmenRouter)
app.use('/reports', reportRouter)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err)
    }
    console.error('Error:', err)
    res.status(500).send('Something broke! ' + err)
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})
