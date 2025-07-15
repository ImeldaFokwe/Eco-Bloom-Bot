const mysql = require("mysql2");
require("dotenv").config(); // Load environment variables

const db = mysql.createConnection({
    host: process.env.AWS_DATABASE_HOST,
    user: process.env.AWS_DATABASE_USER,
    password: process.env.AWS_DATABASE_PASSWORD,
    database: process.env.AWS_DATABASE,
    timezone: '-04:00',
    ssl: { rejectUnauthorized: false } // Change to true if SSL errors occur
});

console.log("Host:", process.env.AWS_DATABASE_HOST);
console.log("User:", process.env.AWS_DATABASE_USER);
console.log("Password:", process.env.AWS_DATABASE_PASSWORD ? "******" : "Not Set");
console.log("Database:", process.env.AWS_DATABASE);

// Connect to the database
db.connect((error) => {
    if (error) {
        console.error("❌ Error connecting to AWS:", error);
        return;
    }
    console.log("✅ Connected to AWS MySQL Database!");

    // Explicitly set the session time zone to UTC-4 (Ottawa time)
    db.query("SET time_zone = '-04:00'", (err, results) => {
        if (err) {
            console.error("Error setting session time zone:", err);
        } else {
            console.log("Session time zone set to -04:00");
        }
    });

    // Check and create tables if necessary

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
            console.log("✅ Users table checked/created");
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
            console.log("✅ Sensor data table checked/created");
        }
    });

    const actuatorStatusTableQuery = `
    CREATE TABLE IF NOT EXISTS actuator_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actuator VARCHAR(50) NOT NULL UNIQUE,
        status ENUM('on', 'off') DEFAULT 'off',
        mode ENUM('auto', 'manual') DEFAULT 'auto',
        intensity INT DEFAULT 100,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
`;
    db.query(actuatorStatusTableQuery, (err) => {
        if (err) {
            console.error("Error creating actuator_status table:", err);
        } else {
            console.log("✅ Actuator status table checked/created");
        }
    });

    // Check and create plant_health_score table
    const healthScoreTableQuery = `
CREATE TABLE IF NOT EXISTS plant_health_score (
    id INT AUTO_INCREMENT PRIMARY KEY,
    score FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
    db.query(healthScoreTableQuery, (err) => {
        if (err) {
            console.error("Error creating plant_health_score table:", err);
        } else {
            console.log("✅ Plant health score table checked/created");
        }
    });
});

module.exports = db;