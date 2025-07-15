const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// GET /api/actuators/thresholds
router.get("/api/actuators/thresholds", (req, res) => {
  const filePath = path.join(__dirname, "../data/idealThresholds.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to read ideal thresholds:", err);
      return res.status(500).json({ error: "Could not read threshold config." });
    }

    try {
      const thresholds = JSON.parse(data);
      res.json(thresholds);
    } catch (parseErr) {
      res.status(500).json({ error: "Invalid JSON format." });
    }
  });
});

module.exports = router;