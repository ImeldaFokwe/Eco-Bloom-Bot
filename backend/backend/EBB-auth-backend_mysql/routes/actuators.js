const express = require("express");
const router = express.Router();
const db = require("../config/dbInit");
const authController = require('../controllers/auth');

// Route to get actuator status and mode
router.get("/api/actuator/status", authController.isLoggedIn, (req, res) => {
    const query = "SELECT * FROM actuator_status";
    db.query(query, (error, results) => {
        if (error) {
            console.log("Error fetching actuator status:", error);
            res.status(500).send("Error retrieving actuator status");
        } else {
            res.json(results.map(row => ({
                actuator: row.actuator,
                status: row.status,
                mode: row.mode || 'auto',  // Assume 'auto' if mode not set
                intensity: row.intensity || 0 
            })));
        }
    });
});

// Route to update actuator intensity (0-100%)
router.post("/api/actuator/intensity", authController.isLoggedIn, (req, res) => {
    const { actuator, intensity } = req.body;

    if (typeof intensity !== "number" || intensity < 0 || intensity > 100) {
        return res.status(400).json({ message: "Intensity must be a number from 0 to 100" });
    }

    const query = `
        UPDATE actuator_status
        SET intensity = ?
        WHERE actuator = ? AND mode = 'manual';
    `;
    db.query(query, [intensity, actuator], (error) => {
        if (error) {
            console.error(`Error updating intensity for ${actuator}:`, error);
            return res.status(500).json({ message: "Failed to update intensity" });
        }

        console.log(`${actuator} intensity set to ${intensity}%`);
        res.status(200).json({ message: `Intensity updated to ${intensity}%` });
    });
});

// Route to set control mode (auto or manual) for an actuator
router.post("/api/actuator/mode", authController.isLoggedIn, (req, res) => {
    const { actuator, mode } = req.body;
    if (!actuator || !mode) {
        return res.status(400).json({ message: "Actuator and mode are required" });
    }

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

// Route to manually control an actuator
router.post("/api/actuator/control", authController.isLoggedIn, (req, res) => {
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

// Route to get all manual overrides
router.get("/api/actuator/overrides", authController.isLoggedIn, (req, res) => {
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

module.exports = router;
