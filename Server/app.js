"use strict";
const express = require("express");
const cors = require("cors");
const { userRouter } = require("./routes/user-routes");

const app = express();
const port = 3000;
const origin = "http://localhost:4200"; // Your frontend's origin

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
    origin: origin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/users", userRouter);

// Error handler middleware
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    console.error(err);
    res.status(500).send("Something broke! " + err);
}
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
