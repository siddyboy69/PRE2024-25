#!/bin/sh

# Wait for database to be ready
sleep 10

# Run the database schema
mysql -u root -h database < /usr/src/app/init.sql

# Run the user initialization script
npx ts-node /usr/src/app/initializeUsers.ts

# Start the application
npm run dev