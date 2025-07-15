const express = require("express");
const router = express.Router();
const db = require("../config/dbInit"); // Ensure the database connection is initialized

// Existing sensor data route
router.get("/data", (req, res) => {
    console.log("Received GET request on /data");

    const query = "SELECT * FROM sensor_data ORDER BY timestamp DESC";
    db.query(query, (error, results) => {
        if (error) {
            console.log("Error fetching sensor data:", error);
            res.status(500).send("Error retrieving data");
        } else {
            console.log("Fetched sensor data:", results);
            res.render("sensor_data", { sensorData: results });
        }
    });
});

// New route to get actuator status and mode
router.get("/api/actuator/status", (req, res) => {
    const query = "SELECT * FROM actuator_status";
    db.query(query, (error, results) => {
        if (error) {
            console.log("Error fetching actuator status:", error);
            res.status(500).send("Error retrieving actuator status");
        } else {
            res.json(results.map(row => ({
                actuator: row.actuator,
                status: row.status,
                mode: row.mode || 'auto'  // Assume 'auto' if mode not set
            })));
        }
    });
});

// Route to set control mode (auto or manual) for an actuator
router.post("/api/actuator/mode", (req, res) => {
    const { actuator, mode } = req.body;
    if (!actuator || !mode) {
        return res.status(400).json({ message: "Actuator and mode are required" });
    }

    // Update actuator mode in the database
    const query = `
        INSERT INTO actuator_status (actuator, mode)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE mode = VALUES(mode);
    `;
    db.query(query, [actuator, mode], (error) => {
        if (error) {
            console.error(`Error updating mode for ${actuator}:`, error);
            res.status(500).json({ message: `Error updating ${actuator} mode` });
        } else {
            console.log(`${actuator} mode set to ${mode}`);
            res.status(200).json({ message: `${actuator} mode set to ${mode}` });
        }
    });
});

// Route to manually control an actuator (only works if in MANUAL mode)
router.post("/api/actuator/control", (req, res) => {
    const { actuator, action } = req.body;
    if (!actuator || !action) {
        return res.status(400).json({ message: "Actuator and action are required" });
    }

    const status = action === 'start' ? 'on' : 'off';
    const query = `
        UPDATE actuator_status SET status = ? WHERE actuator = ? AND mode = 'manual';
    `;
    db.query(query, [status, actuator], (error) => {
        if (error) {
            console.error(`Error controlling ${actuator}:`, error);
            res.status(500).json({ message: `Error controlling ${actuator}` });
        } else {
            console.log(`${actuator} manually turned ${action}`);
            res.status(200).json({ message: `${actuator} manually turned ${action}`, status });
        }
    });
});

router.get("/api/actuator/overrides", (req, res) => {
    const query = "SELECT actuator, mode, status FROM actuator_status WHERE mode = 'manual'";
    db.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching overrides:", error);
            res.status(500).send("Error retrieving overrides");
        } else {
            res.json(results);
        }
    });
});


// Existing POST route for sensor data
router.post("/api/sensor", (req, res) => {
    console.log("Received POST request on /api/sensor");

    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log("Client IP:", clientIP);

    console.log("Request body:", req.body);

    const { sensor_type, value } = req.body;

    if (!sensor_type || value === undefined) {
        console.log("Invalid data received: Missing sensor_type or value");
        return res.status(400).send("Invalid data: sensor_type and value are required");
    }

    const query = "INSERT INTO sensor_data (sensor_type, value) VALUES (?, ?)";
    db.query(query, [sensor_type, value], (error, results) => {
        if (error) {
            console.error("Error inserting sensor data:", error);
            res.status(500).send("Error storing data");
        } else {
            console.log("Sensor data inserted:", results);
            res.status(200).send("Data stored successfully");
        }
    });
});

module.exports = router;
