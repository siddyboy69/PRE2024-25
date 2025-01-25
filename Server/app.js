"use strict"
require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { userRouter } = require("./routes/user-routes")
const { shiftRouter } = require("./routes/shift-routes")
const { firmenRouter } = require("./routes/firmen-routes")

const app = express()
const port = 3000
const origin = "http://localhost:4200"

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin, methods: ["GET","POST","PUT","DELETE"], allowedHeaders: ["Content-Type","Authorization"] }))

app.use((req, res, next) => {
    res.setHeader("Cache-Control","no-store,no-cache,must-revalidate,proxy-revalidate")
    res.setHeader("Pragma","no-cache")
    res.setHeader("Expires","0")
    res.setHeader("Surrogate-Control","no-store")
    next()
})

app.use("/users", userRouter)
app.use("/shifts", shiftRouter)
app.use("/firmen", firmenRouter)

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }
    console.error("Error:", err)
    res.status(500).send("Something broke! " + err)
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})
