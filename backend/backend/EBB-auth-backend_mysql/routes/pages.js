const authController = require("../controllers/auth");
console.log("authController:", authController);
console.log("✅ pages.js loaded");
const express = require("express");
const router = express.Router();
const db = require("../config/dbInit");


const cron = require("node-cron");
const EmailService = require("../services/emailService");
const emailService = new EmailService();

// Runs every 30 minutes
cron.schedule("*/30 * * * *", () => {
  console.log("Cron job running...");
  emailService.checkAlert(process.env.ALERT_RECIPIENT);
});

router.get("/", authController.isLoggedIn, (req, res) => {
  res.render("index", {
    user: req.user,
  });
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/profile", authController.isLoggedIn, (req, res) => {
  console.log(req.user);
  if (req.user) {
    res.render("profile", {
      user: req.user,
    });
  } else {
    res.redirect("/login");
  }
});

router.get("/sensor-data", (req, res) => {
  const query = "SELECT * FROM sensor_data ORDER BY timestamp DESC";
  db.query(query, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error retrieving sensor data");
    } else {
      res.render("sensor_data", { sensorData: results });
    }
  });
});

module.exports = router;
