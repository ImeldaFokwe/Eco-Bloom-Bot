const mysql = require("mysql");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
});

// Connect to MySQL and create database if it doesn’t exist
db.connect((error) => {
    if (error) {
        console.log("Error connecting to MySQL:", error);
        return;
    }
    console.log("Connected to MySQL");

    const dbName = process.env.DATABASE;
    db.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) {
            console.error("Error creating database:", err);
            return;
        }
        console.log(`Database ${dbName} checked/created`);

        db.changeUser({ database: dbName }, (err) => {
            if (err) {
                console.error("Error selecting database:", err);
                return;
            }

            const usersTableQuery = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL
                );
            `;
            db.query(usersTableQuery, (err) => {
                if (err) {
                    console.error("Error creating users table:", err);
                } else {
                    console.log("users table checked/created");
                }
            });

            const sensorDataTableQuery = `
                CREATE TABLE IF NOT EXISTS sensor_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sensor_type VARCHAR(50) NOT NULL,
                    value FLOAT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
            db.query(sensorDataTableQuery, (err) => {
                if (err) {
                    console.error("Error creating sensor_data table:", err);
                } else {
                    console.log("sensor_data table checked/created");
                }
            });

            const actuatorStatusTableQuery = `
                CREATE TABLE IF NOT EXISTS actuator_status (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    actuator VARCHAR(50) NOT NULL UNIQUE,
                    status ENUM('on', 'off') DEFAULT 'off',
                    mode ENUM('auto', 'manual') DEFAULT 'auto',
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                );
            `;
            db.query(actuatorStatusTableQuery, (err) => {
                if (err) {
                    console.error("Error creating actuator_status table:", err);
                } else {
                    console.log("actuator_status table checked/created");
                }
            });
        });
    });
});

module.exports = db;
