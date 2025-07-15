const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../config/dbInit");

// Scoring helper
function scoreSensor(value, min, max, scale = 1) {
  if (value >= min && value <= max) return 10;
  const deviation = Math.abs(value < min ? value - min : value - max);
  return Math.max(1, 10 - deviation * scale);
}

// GET /api/plant/score/history
router.get("/score/history", (req, res) => {
  const query = `
    SELECT score, timestamp
    FROM plant_health_score
    ORDER BY timestamp DESC
    LIMIT 10;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Failed to fetch score history:", err);
      return res.status(500).json({ error: "Score history fetch failed" });
    }

    res.json(results.reverse());
  });
});

// GET /api/plant/score
router.get("/score", (req, res) => {
  try {
    const thresholdPath = path.join(__dirname, "../data/idealThresholds.json");
    const thresholds = JSON.parse(fs.readFileSync(thresholdPath, "utf8"));

    const query = `
      SELECT s.sensor_type, s.value
      FROM sensor_data s
      INNER JOIN (
        SELECT sensor_type, MAX(timestamp) AS latest_timestamp
        FROM sensor_data
        GROUP BY sensor_type
      ) latest ON s.sensor_type = latest.sensor_type AND s.timestamp = latest.latest_timestamp;
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Failed to fetch sensor data:", err);
        return res.status(500).json({ error: "Sensor data fetch failed" });
      }

      const data = {};
      results.forEach(({ sensor_type, value }) => {
        data[sensor_type] = value;
      });

      const weights = {
        temperature: 0.3,
        humidity: 0.2,
        soil_moisture: 0.3,
        light: 0.2,
      };

      const temp = data["BME280_Temperature"];
      const humidity = data["BME280_Humidity"];
      const soil = data["SoilMoisture"];
      const light = data["TSL2561"];

      const tempScore = scoreSensor(temp, thresholds.temperature[0], thresholds.temperature[1], 0.5);
      const humidityScore = scoreSensor(humidity, thresholds.humidity[0], thresholds.humidity[1], 0.3);
      const soilScore = scoreSensor(soil, thresholds.soil_moisture[0], thresholds.soil_moisture[1], 0.05);
      const lightScore = scoreSensor(light, thresholds.light[0], thresholds.light[1], 0.03);

      const weightedScore = (
        tempScore * weights.temperature +
        humidityScore * weights.humidity +
        soilScore * weights.soil_moisture +
        lightScore * weights.light
      );

      const finalScore = Math.round(weightedScore * 10) / 10;

      const insertQuery = `INSERT INTO plant_health_score (score) VALUES (?);`;
      db.query(insertQuery, [finalScore], (insertErr) => {
        if (insertErr) {
          console.error("❌ Error inserting score:", insertErr);
        } else {
          console.log("✅ Score saved:", finalScore);
        }

        res.json({
          temperature: { value: temp, score: tempScore },
          humidity: { value: humidity, score: humidityScore },
          soil_moisture: { value: soil, score: soilScore },
          light: { value: light, score: lightScore },
          total_score: finalScore,
        });
      });
    });
  } catch (err) {
    console.error("❌ Error calculating score:", err);
    res.status(500).json({ error: "Score calculation failed" });
  }
});

module.exports = router;