"use strict";
const express = require("express");
const { pool } = require("../config/db");
const { User } = require("../model/user");

const userRouter = express.Router();
exports.userRouter = userRouter;

// Route to get all users
userRouter.get('/', (req, res) => {
    let data = [];
    pool.query('SELECT * FROM user WHERE is_admin = 0', (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send('Server error, please contact support.');
        } else {
            for (let i = 0; i < rows.length; i++) {
                data.push(new User(
                    rows[i].id,
                    rows[i].uuid,
                    rows[i].username,
                    rows[i].password,
                    rows[i].is_admin,
                    rows[i].firstname,
                    rows[i].lastname,
                    rows[i].sex
                ));
            }
            console.log(data);
            res.status(200).send(data);
        }
    });
});

userRouter.post('/login/', (req, res, next) => {
    const sqlUsernameCheck = "SELECT * FROM `user` WHERE user.username=" + pool.escape(req.body.username);

    pool.query(sqlUsernameCheck, (err, rows) => {
        if (err) return next(err);

        if (rows.length === 0) {
            return res.status(400).send({ message: 'Username does not exist' });
        } else {
            const sqlPasswordCheck = sqlUsernameCheck + " AND user.password=" + pool.escape(req.body.password);

            pool.query(sqlPasswordCheck, (err, rows) => {
                if (err) return next(err);

                if (rows.length === 0) {
                    return res.status(400).send({ message: 'Password is incorrect' });
                } else {
                    let data = new User(
                        rows[0].id,
                        rows[0].uuid,
                        rows[0].username,
                        rows[0].password,
                        rows[0].is_admin,
                        rows[0].firstname,
                        rows[0].lastname,
                        rows[0].sex
                    );
                    console.log("-><<<< " + JSON.stringify(data));
                    return res.status(200).send(data);
                }
            });
        }
    });
});

userRouter.post('/register/', (req, res, next) => {
    // Adjusted SQL to include firstname, lastname, and sex
    let sql = "INSERT INTO user (uuid, username, password, firstname, lastname, sex) VALUES (uuid(), " +
        pool.escape(req.body.username) + ", " +
        pool.escape(req.body.password) + ", " +
        pool.escape(req.body.firstname) + ", " +
        pool.escape(req.body.lastname) + ", " +
        pool.escape(req.body.sex) + ");";

    try {
        pool.query(sql, (err, rows) => {
            if (err) return next(err);
            if (rows.affectedRows > 0) {
                // Retrieve the inserted user to confirm the details
                pool.query('SELECT * FROM user WHERE id = ' + rows.insertId, (err, rws) => {
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
                res.status(404).send("0");
            }
        });
    } catch (err) {
        next(err);
    }
});


userRouter.put('/update/', (req, res, next) => {
    let sql = "UPDATE user SET firstname = " + pool.escape(req.body.firstName) +
        ", lastname = " + pool.escape(req.body.lastName) +
        ", sex = " + pool.escape(req.body.sex) +
        " WHERE id = " + pool.escape(req.body.id);

    console.log("_________   " + sql);
    pool.query(sql, (err) => {
        if (err) return next(err);
        res.status(200).send(null);
    });
});

userRouter.delete('/delete/:id', (req, res, next) => {
    const userId = req.params.id;
    let sql = "DELETE FROM user WHERE id = " + pool.escape(userId);
    pool.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (result.affectedRows > 0) {
            res.status(200).send(`User with ID ${userId} deleted successfully.`);
        } else {
            res.status(404).send(`User with ID ${userId} not found.`);
        }
    });
});
userRouter.get('/:id', (req, res, next) => {
    const userId = req.params.id;
    pool.query('SELECT username, firstname, lastname, sex FROM user WHERE id = ?', [userId], (err, rows) => {
        if (err) return next(err);
        if (rows.length > 0) {
            res.status(200).send(rows[0]);
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    });
});

