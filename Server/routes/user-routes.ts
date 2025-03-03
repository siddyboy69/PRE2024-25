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
    const authHeader = req.headers['authorization'];
    if (typeof authHeader !== 'string') {
        res.status(403).send({ message: 'No token provided!' });
        return;
    }

    const parts = authHeader.split(' ');
    const token = parts[1];
    if (!token) {
        res.status(403).send({ message: 'No token provided!' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
        if (err) {
            res.status(401).send({ message: 'Unauthorized!' });
            return;
        }
        (req as any).userId = decoded.id;
        next();
    });
};

// Route to get all users (non-admins only)
userRouter.get('/', verifyToken, (req: Request, res: Response): void => {
    let data: User[] = [];
    pool.query('SELECT * FROM user WHERE is_admin = 0 AND deleted = 0', (err, rows) => {
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
                row.sex,
                row.deleted
            ));
        }
        res.status(200).send(data);
    });
});

// soft-delete (get user from bin)
userRouter.get('/soft-delete', verifyToken, (req: Request, res: Response): void => {
    let data: User[] = [];
    pool.query('SELECT * FROM user WHERE is_admin = 0 AND deleted = 1', (err, rows) => {
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
                row.sex,
                row.deleted
            ));
        }
        res.status(200).send(data);
    });
});

// put soft-delete (move user into bin)
userRouter.put('/soft-delete/:id', verifyToken, (req: Request, res: Response, next: NextFunction): void => {

    pool.query('UPDATE user SET deleted = 1 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send('Error moving user to bin');
        res.status(200).send({ message: 'User moved to bin' });
    });

});

// restore user (from bin)
userRouter.put('/restore/:id', verifyToken, (req, res) => {
    pool.query('UPDATE user SET deleted = 0 WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send('Error restoring user');
        res.status(200).send({ message: 'User restored' });
    });
});

// Login route
userRouter.post('/login/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const sqlUsernameCheck = "SELECT * FROM `user` WHERE user.username=" + pool.escape(req.body.username);

    pool.query(sqlUsernameCheck, async (err, rows) => {
        if (err) {
            next(err);
            return;
        }

        // Check if username exists
        if (rows.length === 0) {
            res.status(401).send({ message: 'The username is incorrect.' }); // Custom error message
            return;
        }

        const user = rows[0];
        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);

        // Check if password matches
        if (!isPasswordMatch) {
            res.status(401).send({ message: 'The password is incorrect.' }); // Custom error message
            return;
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, isAdmin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Create User object
        const data = new User(
            user.id,
            user.uuid,
            user.username,
            user.password,
            user.is_admin,
            user.firstname,
            user.lastname,
            user.sex,
            user.deleted
        );

        // Return success response
        res.status(200).send({ user: data, token });
    });
});


// Registration route
userRouter.post('/register/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password, firstname, lastname, sex } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO user (uuid, username, password, firstname, lastname, sex)
                     VALUES (uuid(), ${pool.escape(username)}, ${pool.escape(hashedPassword)},
                             ${pool.escape(firstname)}, ${pool.escape(lastname)},
                             ${pool.escape(sex)});`;

        pool.query(sql, (err, rows) => {
            if (err) {
                next(err);
                return;
            }

            if (rows.affectedRows > 0) {
                pool.query('SELECT * FROM user WHERE id = ?', [rows.insertId], (err, rws) => {
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
                            sex: rws[0].sex,
                            deleted: rws[0].deleted
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
userRouter.put('/update', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const { id, userId, ...updateFields } = req.body; // Exclude both id and userId

    if (!id) {
        res.status(400).send({ message: 'User ID is required' });
        return;
    }

    const updateParts = Object.entries(updateFields)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, _]) => `${key} = ${pool.escape(updateFields[key])}`);

    if (updateParts.length === 0) {
        res.status(400).send({ message: 'No fields to update' });
        return;
    }

    const sql = `UPDATE user SET ${updateParts.join(', ')} WHERE id = ${pool.escape(id)}`;

    pool.query(sql, (err) => {
        if (err) {
            console.error("Update error:", err);
            next(err);
            return;
        }

        pool.query('SELECT id, username, firstname, lastname, sex, deleted FROM user WHERE id = ?',
            [id],
            (err, rows) => {
                if (err) {
                    console.error("Select error:", err);
                    next(err);
                    return;
                }
                if (rows.length > 0) {
                    res.status(200).send(rows[0]);
                } else {
                    res.status(404).send({ message: 'User not found after update' });
                }
            }
        );
    });
});

// Delete user by ID
userRouter.delete('/delete/:id', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.params.id;
    const sql = "DELETE FROM user WHERE id = ?";

    pool.query(sql, [userId], (err, result) => {
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

// Get user details by ID
userRouter.get('/:id', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.params.id;
    pool.query('SELECT username, firstname, lastname, sex, deleted FROM user WHERE id = ?',
        [userId],
        (err, rows) => {
            if (err) {
                next(err);
                return;
            }
            if (rows.length > 0) {
                res.status(200).send(rows[0]);
            } else {
                res.status(404).send({ message: 'User not found' });
            }
        }
    );
});

