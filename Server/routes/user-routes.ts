import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import { pool } from "../config/db";
import { User } from "../model/user";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const userRouter = express.Router();

// Secret key for JWT (use environment variables for production)
const JWT_SECRET = process.env.JWT_SECRET || 's3cureP@ssW0rd12345!';

// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from 'Bearer <token>'

    if (!token) {
        res.status(403).send({ message: 'No token provided!' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
        if (err) {
            res.status(401).send({ message: 'Unauthorized!' });
            return;
        }
        (req as any).userId = decoded.id; // Save user ID for future use
        next();
    });
};

// Route to get all users (non-admins only)
userRouter.get('/', verifyToken, (req: Request, res: Response): void => {
    let data: User[] = [];
    pool.query('SELECT * FROM user WHERE is_admin = 0', (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send('Server error, please contact support.');
            return;
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
userRouter.post('/login/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sqlUsernameCheck = "SELECT * FROM `user` WHERE user.username=" + pool.escape(req.body.username);

    pool.query(sqlUsernameCheck, async (err, rows) => {
        if (err) {
            next(err);
            return;
        }

        if (rows.length === 0) {
            res.status(400).send({ message: 'Username does not exist' });
            return;
        }

        const user = rows[0];
        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isPasswordMatch) {
            res.status(400).send({ message: 'Password is incorrect' });
            return;
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
userRouter.post('/register/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const sql = `INSERT INTO user (uuid, username, password, firstname, lastname, sex) 
                     VALUES (uuid(), ${pool.escape(req.body.username)}, ${pool.escape(hashedPassword)}, 
                             ${pool.escape(req.body.firstname)}, ${pool.escape(req.body.lastname)}, 
                             ${pool.escape(req.body.sex)});`;

        pool.query(sql, (err, rows) => {
            if (err) {
                next(err);
                return;
            }

            if (rows.affectedRows > 0) {
                pool.query('SELECT * FROM user WHERE id = ' + rows.insertId, (err, rws) => {
                    if (err) {
                        next(err);
                        return;
                    }
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
userRouter.put('/update/', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const sql = `UPDATE user SET firstname = ${pool.escape(req.body.firstName)}, 
                                 lastname = ${pool.escape(req.body.lastName)}, 
                                 sex = ${pool.escape(req.body.sex)} 
                 WHERE id = ${pool.escape(req.body.id)}`;
    console.log("_________   " + sql);
    pool.query(sql, (err) => {
        if (err) {
            next(err);
            return;
        }
        res.status(200).send('User updated successfully.');
    });
});

// Delete user by ID
userRouter.delete('/delete/:id', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.params.id;
    const sql = "DELETE FROM user WHERE id = " + pool.escape(userId);

    pool.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            next(err);
            return;
        }
        if (result.affectedRows > 0) {
            res.status(200).send(`User with ID ${userId} deleted successfully.`);
        } else {
            res.status(404).send(`User with ID ${userId} not found.`);
        }
    });
});

// Get user details by ID (excluding password)
userRouter.get('/:id', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.params.id;
    pool.query('SELECT username, firstname, lastname, sex FROM user WHERE id = ?', [userId], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        if (rows.length > 0) {
            res.status(200).send(rows[0]);
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    });
});

// Get user shifts
userRouter.get('/shifts/:userId', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.params.userId;
    const query = `
        SELECT id, shiftStart, shiftEnd, breakStart, breakEnd
        FROM shift
        WHERE user_id = ?;
    `;
    pool.query(query, [userId], (err, rows) => {
        if (err) {
            next(err);
            return;
        }
        res.status(200).send(rows);
    });
});

// Add user shifts
userRouter.post('/shifts', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const { userId, shiftStart, shiftEnd, breakStart, breakEnd } = req.body;
    const query = `
        INSERT INTO shift (user_id, shiftStart, shiftEnd, breakStart, breakEnd)
        VALUES (?, ?, ?, ?, ?);
    `;
    pool.query(query, [userId, shiftStart, shiftEnd, breakStart, breakEnd], (err, result) => {
        if (err) {
            next(err);
            return;
        }
        res.status(200).send({ message: 'Shift added successfully.', id: result.insertId });
    });
});