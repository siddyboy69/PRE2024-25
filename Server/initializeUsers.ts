import { pool } from "./config/db";
import bcrypt from 'bcrypt';


async function insertAdminUser() {
    try {
        // Hash the admin password "admin"
        const hashedPassword = await bcrypt.hash('admin', 10);

        const sql = `
            INSERT INTO user (username, password, is_admin, firstname, lastname, sex) 
            VALUES (?, ?, 1, ?, ?, ?)
            ON DUPLICATE KEY UPDATE password = VALUES(password);
        `;

        await new Promise((resolve, reject) => {
            pool.query(sql, ['admin', hashedPassword, 'Admin', 'Adminsdorfer', 'female'], (err, result) => {
                if (err) {
                    console.error('Error inserting admin user:', err);
                    reject(err);
                } else {
                    console.log('Admin user inserted successfully.');
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.error('Error hashing admin password:', error);
        process.exit(1);
    }
}

// Function to insert multiple users
async function insertUsers() {
    try {
        // Hash the consistent password "Montag01"
        const hashedPassword = await bcrypt.hash('Montag01', 10);

        // Array of user data
        const users = [
            ['user01', 'Jane', 'Smith', 'female'],
            ['user02', 'Alice', 'Brown', 'female'],
            ['user03', 'Bob', 'Johnson', 'male'],
            ['user04', 'Charlie', 'Miller', 'other'],
            ['user05', 'Sam', 'Taylor', 'male'],
            ['user06', 'Alex', 'Lee', 'non-binary'],
            ['user07', 'Morgan', 'White', 'female'],
            ['user08', 'Jordan', 'Green', 'male'],
            ['user09', 'Chris', 'Black', 'other']
        ];

        // SQL statement with placeholders
        const sql = `
            INSERT INTO user (username, password, is_admin, firstname, lastname, sex) 
            VALUES (?, ?, 0, ?, ?, ?)
            ON DUPLICATE KEY UPDATE password = VALUES(password);
        `;

        // Loop through each user and insert them
        for (const user of users) {
            const [username, firstname, lastname, sex] = user;

            // Use a prepared statement to insert the user
            await new Promise((resolve, reject) => {
                pool.query(sql, [username, hashedPassword, firstname, lastname, sex], (err, result) => {
                    if (err) {
                        console.error(`Error inserting user ${username}:`, err);
                        reject(err);
                    } else {
                        console.log(`User ${username} inserted successfully.`);
                        resolve(result);
                    }
                });
            });
        }

        console.log('All users inserted successfully.');
        process.exit(0); // Exit the script successfully

    } catch (error) {
        console.error('Error hashing password or inserting users:', error);
        process.exit(1); // Exit the script with an error
    }
}

// Call the functions to insert admin and other users
(async function runInsertion() {
    await insertAdminUser();
    await insertUsers();
})();
