const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const multer = require("multer");
const db = require("../config/dbInit");

// GET /camera/api/camera - Returns the latest stored camera frame from the database along with its timestamp
router.get("/api/camera", authController.isLoggedIn, (req, res) => {
  const query = "SELECT frame_data, timestamp FROM camera_frames ORDER BY timestamp DESC LIMIT 1";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching camera frame from DB:", err);
      return res.status(500).send("Error fetching frame");
    }
    if (results.length === 0) {
      return res.status(404).send("No frames found");
    }
    const imageBuffer = results[0].frame_data;
    const timestamp = results[0].timestamp;
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    // Return a JSON object containing the image and the timestamp
    res.json({ image: base64Image, timestamp: timestamp });
  });
});

// Configure multer to use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /camera/upload - Receives a JPEG snapshot and stores it in the database
router.post("/upload", authController.isLoggedIn, upload.single("frame"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  
  const query = "INSERT INTO camera_frames (frame_data) VALUES (?)";
  db.query(query, [req.file.buffer], (error, results) => {
    if (error) {
      console.error("Error inserting camera frame:", error);
      return res.status(500).send("Error storing frame");
    }
    console.log("Camera frame inserted with ID:", results.insertId);
    res.status(200).send("Frame uploaded and stored successfully");
  });
});

module.exports = router;