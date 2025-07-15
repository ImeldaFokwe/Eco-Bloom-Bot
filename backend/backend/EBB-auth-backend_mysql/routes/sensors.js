const express = require("express");
const router = express.Router();
const db = require("../config/dbInit");
const authController = require('../controllers/auth');

router.get("/api/data", authController.isLoggedIn, (req, res) => {
    console.log("Received GET request on /api/data");

    const query = "SELECT sensor_type, value, timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 20";
    db.query(query, (error, results) => {
        if (error) {
            console.log("Error fetching sensor data:", error);
            res.status(500).json({ error: "Error retrieving data" });
        } else {
            console.log("Fetched sensor data:", results);
            res.status(200).json(results); // Return JSON for Angular
        }
    });
});

// Existing sensor data route
router.get("/data", authController.isLoggedIn, (req, res) => {
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

/* // Route to handle incoming sensor data (POST)
router.post("/api/sensor", authController.isLoggedIn, (req, res) => {
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
}); */

router.post("/api/sensor", authController.isLoggedIn, (req, res) => {
    const data = req.body;
  
    // Check if it's a batch object (not a single sensor payload)
    if (typeof data === 'object' && !Array.isArray(data)) {
      const timestamp = new Date();
  
      const entries = Object.entries(data)
        .filter(([sensorType, value]) => typeof value === 'number')
        .map(([sensorType, value]) => [sensorType, value, timestamp]);
  
      if (entries.length === 0) {
        return res.status(400).json({ message: "No valid sensor values" });
      }
  
      const query = `
        INSERT INTO sensor_data (sensor_type, value, timestamp)
        VALUES ?
      `;
  
      db.query(query, [entries], (err) => {
        if (err) {
          console.error("Error inserting batch sensor data:", err);
          return res.status(500).json({ message: "Failed to save sensor data" });
        }
  
        console.log("✅ Batch sensor data saved:", entries);
        res.status(200).json({ message: "Batch sensor data saved" });
      });
    }
  
    // Old fallback (single payload)
    else if (data.sensor_type && data.value !== undefined) {
      const query = `
        INSERT INTO sensor_data (sensor_type, value)
        VALUES (?, ?)
      `;
      db.query(query, [data.sensor_type, data.value], (err) => {
        if (err) {
          console.error("Error saving sensor data:", err);
          return res.status(500).json({ message: "Failed to save sensor data" });
        }
  
        console.log("✅ Single sensor data saved:", data);
        res.status(200).json({ message: "Sensor data saved" });
      });
    }
  
    else {
      console.warn("❌ Invalid data received:", data);
      res.status(400).json({ message: "Invalid data received: Missing sensor_type or value" });
    }
  });

module.exports = router;
