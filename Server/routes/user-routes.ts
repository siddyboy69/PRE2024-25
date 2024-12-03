import * as express from 'express';
import { pool } from "../config/db";
import { User } from "../model/user";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const userRouter = express.Router();

// Secret key for JWT (use environment variables for production)
const JWT_SECRET = 'your_secret_key'; // Replace with an actual secret or use env variables

// Route to get all users (non-admins only)
userRouter.get('/', (req, res) => {
    let data: User[] = [];
    pool.query('SELECT * FROM user WHERE is_admin = 0', (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Server error, please contact support.');
        }
        for (let row of rows) {
            data.push(new User(
                row.id,
                row.uuid,
                row.username,
                row.password,
                row.is_admin,
                row.firstname,
                row.lastname,
                row.sex
            ));
        }
        console.log(data);
        res.status(200).send(data);
    });
});

// Login route - Verifies user credentials, generates JWT on success
userRouter.post('/login/', (req, res, next) => {
    const sqlUsernameCheck = "SELECT * FROM `user` WHERE user.username=" + pool.escape(req.body.username);

    pool.query(sqlUsernameCheck, async (err, rows) => {
        if (err) return next(err);

        if (rows.length === 0) {
            return res.status(400).send({ message: 'Username does not exist' });
        }

        const user = rows[0];
        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordMatch) {
            return res.status(400).send({ message: 'Password is incorrect' });
        }

        // Generate JWT token on successful login
        const token = jwt.sign(
            { id: user.id, username: user.username, isAdmin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '1h' }
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
        res.status(200).send({ user: data, token }); // Send user data and token
    });
});

// Registration route - Hashes password and registers a new user
userRouter.post('/register/', async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const sql = `INSERT INTO user (uuid, username, password, firstname, lastname, sex) 
                     VALUES (uuid(), ${pool.escape(req.body.username)}, ${pool.escape(hashedPassword)}, 
                             ${pool.escape(req.body.firstname)}, ${pool.escape(req.body.lastname)}, 
                             ${pool.escape(req.body.sex)});`;

        pool.query(sql, (err, rows) => {
            if (err) return next(err);

            if (rows.affectedRows > 0) {
                pool.query('SELECT * FROM user WHERE id = ' + rows.insertId, (err, rws) => {
                    if (err) return next(err);
                    if (rws.length > 0) {
                        const usr = {
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

// Update user details
userRouter.put('/update/', (req, res, next) => {
    const sql = `UPDATE user SET firstname = ${pool.escape(req.body.firstName)}, 
                                 lastname = ${pool.escape(req.body.lastName)}, 
                                 sex = ${pool.escape(req.body.sex)} 
                 WHERE id = ${pool.escape(req.body.id)}`;
    console.log("_________   " + sql);
    pool.query(sql, (err) => {
        if (err) return next(err);
        res.status(200).send('User updated successfully.');
    });
});

// Delete user by ID
userRouter.delete('/delete/:id', (req, res, next) => {
    const userId = req.params.id;
    const sql = "DELETE FROM user WHERE id = " + pool.escape(userId);

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

// Get user details by ID (excluding password)
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

    // test
    userRouter.get('/shifts/:userId', (req, res, next) => {
        const userId = req.params.userId;
        const query = `
        SELECT id, shiftStart, shiftEnd, breakStart, breakEnd
        FROM shift
        WHERE user_id = ?;
    `;
        pool.query(query, [userId], (err, rows) => {
            if (err) return next(err);
            res.status(200).send(rows);
        });
    });

    userRouter.post('/shifts', (req, res, next) => {
        const { userId, shiftStart, shiftEnd, breakStart, breakEnd } = req.body;
        const query = `
        INSERT INTO shift (user_id, shiftStart, shiftEnd, breakStart, breakEnd)
        VALUES (?, ?, ?, ?, ?);
    `;
        pool.query(query, [userId, shiftStart, shiftEnd, breakStart, breakEnd], (err, result) => {
            if (err) return next(err);
            res.status(200).send({ message: 'Shift added successfully.', id: result.insertId });
        });
    });



});
