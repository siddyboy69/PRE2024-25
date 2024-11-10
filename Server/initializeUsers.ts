import {pool} from "./config/db";
import bcrypt from 'bcrypt';
// Function to insert admin user with a hashed password
async function insertAdminUser() {
    try {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash('admin', 10); // 'admin' is the plaintext password

        const sql = `
            INSERT INTO user (username, password, is_admin, firstname, lastname, sex) 
            VALUES (?, ?, 1, 'Admine', 'Adminsdorfer', 'F')
            ON DUPLICATE KEY UPDATE password = VALUES(password);
        `;

        // Use a prepared statement to prevent SQL injection
        pool.query(sql, ['admin', hashedPassword], (err, result) => {
            if (err) {
                console.error('Error inserting admin user:', err);
                process.exit(1);
            } else {
                console.log('Admin user inserted successfully with hashed password');
                process.exit(0); // Exit the script successfully
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        process.exit(1); // Exit the script with an error
    }
}

// Call the function to insert the admin user
insertAdminUser();