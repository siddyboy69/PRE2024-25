"use strict";
const express = require("express");
const { pool } = require("../config/db");
const { User } = require("../model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userRouter = express.Router();
exports.userRouter = userRouter;

const JWT_SECRET = process.env.JWT_SECRET;


// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from 'Bearer <token>'

    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id; // Save user ID for future use
        next();
    });
};

// Route to get all users (non-admins only)
userRouter.get("/", verifyToken, (req, res) => {
    let data = [];
    pool.query("SELECT * FROM user WHERE is_admin = 0", (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send("Server error, please contact support.");
        } else {
            for (let i = 0; i < rows.length; i++) {
                data.push(
                    new User(
                        rows[i].id,
                        rows[i].uuid,
                        rows[i].username,
                        rows[i].password,
                        rows[i].is_admin,
                        rows[i].firstname,
                        rows[i].lastname,
                        rows[i].sex
                    )
                );
            }
            console.log(data);
            res.status(200).send(data);
        }
    });
});

// Login route with password comparison using bcrypt and JWT generation
userRouter.post("/login/", (req, res, next) => {
    const sqlUsernameCheck = "SELECT * FROM `user` WHERE user.username=" + pool.escape(req.body.username);

    pool.query(sqlUsernameCheck, async (err, rows) => {
        if (err) return next(err);

        if (rows.length === 0) {
            return res.status(400).send({ message: "Username does not exist" });
        } else {
            const user = rows[0];
            const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);

            if (!isPasswordMatch) {
                return res.status(400).send({ message: "Password is incorrect" });
            } else {
                // Generate JWT token
                const token = jwt.sign(
                    { id: user.id, username: user.username, isAdmin: user.is_admin },
                    JWT_SECRET,
                    { expiresIn: '1h' } // Token expires in 1 hour
                );

                const data = new User(
                    user.id,
                    user.uuid,
                    user.username,
                    user.password,
                    user.is_admin,
                    user.firstname,
                    user.lastname,
                    user.sex
                );

                console.log("-><<<< " + JSON.stringify(data));
                return res.status(200).send({ user: data, token }); // Send user data and token
            }
        }
    });
});

// Registration route with password hashing using bcrypt
userRouter.post("/register/", async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        let sql = "INSERT INTO user (uuid, username, password, firstname, lastname, sex) VALUES (uuid(), " +
            pool.escape(req.body.username) + ", " +
            pool.escape(hashedPassword) + ", " +
            pool.escape(req.body.firstname) + ", " +
            pool.escape(req.body.lastname) + ", " +
            pool.escape(req.body.sex) + ");";

        pool.query(sql, (err, rows) => {
            if (err) return next(err);
            if (rows.affectedRows > 0) {
                pool.query("SELECT * FROM user WHERE id = " + rows.insertId, (err, rws) => {
                    if (err) return next(err);
                    if (rws.length > 0) {
                        let usr = {
                            id: rws[0].id,
                            uuid: rws[0].uuid,
                            username: rws[0].username,
                            password: rws[0].password,
                            is_admin: rws[0].is_admin,
                            firstname: rws[0].firstname,
                            lastname: rws[0].lastname,
                            sex: rws[0].sex
                        };
                        res.status(200).send(usr);
                    } else {
                        res.status(404).send(null);
                    }
                });
            } else {
                res.status(404).send("User not created.");
            }
        });
    } catch (err) {
        next(err);
    }
});

// Update user details (protected)
userRouter.put("/update/", verifyToken, (req, res, next) => {
    let sql = "UPDATE user SET firstname = " + pool.escape(req.body.firstName) +
        ", lastname = " + pool.escape(req.body.lastName) +
        ", sex = " + pool.escape(req.body.sex) +
        " WHERE id = " + pool.escape(req.body.id);
    console.log("_________   " + sql);
    pool.query(sql, (err) => {
        if (err) return next(err);
        res.status(200).send("User updated successfully.");
    });
});

// Delete user by ID (protected)
userRouter.delete('/delete/:id', verifyToken, (req, res, next) => {
    const userId = req.params.id;
    console.log("Attempting to delete user with ID:", userId);

    // First, check if the user exists
    pool.query('SELECT * FROM user WHERE id = ?', [userId], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking user:", checkErr);
            return res.status(500).send("Server error");
        }

        if (checkResult.length === 0) {
            console.log(`No user found with ID ${userId}`);
            return res.status(404).send(`User with ID ${userId} not found.`);
        }

        // If user exists, proceed with deletion
        let sql = "DELETE FROM user WHERE id = ?";
        pool.query(sql, [userId], (err, result) => {
            if (err) {
                console.error("Delete error:", err);
                return res.status(500).send("Error deleting user");
            }

            console.log("Delete result:", result);
            if (result.affectedRows > 0) {
                res.status(200).send(`User with ID ${userId} deleted successfully.`);
            } else {
                res.status(404).send(`User with ID ${userId} not found.`);
            }
        });
    });
});

// Get user details by ID without sending password (protected)
userRouter.get("/:id", verifyToken, (req, res, next) => {
    const userId = req.params.id;
    pool.query("SELECT username, firstname, lastname, sex FROM user WHERE id = ?", [userId], (err, rows) => {
        if (err) return next(err);
        if (rows.length > 0) {
            res.status(200).send(rows[0]);
        } else {
            res.status(404).send({ message: "User not found" });
        }
    });
});
