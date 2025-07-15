const nodemailer = require("nodemailer");
const fs = require("fs");
const mysql = require("mysql2"); 
require("dotenv").config(); // Load environment variables

class emailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        //gmail account made to send emails
        user: "ecobloomnotification@gmail.com",
        //App password for the gmail account
        pass: "hyqi chgp kgyg gwho",
      },
    });
  }

  isOutOfRange(value, [min, max]) {
    return value < min || value > max;
  }

  //Function to send an email
  async send(to, subject, text) {
    const mailOptions = {
      from: '"EcoBloomBot" <ecobloomnotification@gmail.com>',
      to,
      subject,
      text,
    };
    const result = await this.transporter.sendMail(mailOptions);
    return result;
  }

  //Function to retrieve sensor data
  async fetchData() {
    //Create connection to database using environment variables
    const connection = mysql.createConnection({
      host: process.env.AWS_DATABASE_HOST,
      user: process.env.AWS_DATABASE_USER,
      password: process.env.AWS_DATABASE_PASSWORD,
      database: process.env.AWS_DATABASE,
    });

    //Query to get latest values for each sensor type
    const query = `
      SELECT 
        s.sensor_type,
        s.value,
        s.timestamp
      FROM 
        sensor_data s
      JOIN (
        SELECT 
          sensor_type,
          MAX(timestamp) AS latest_timestamp
        FROM 
          sensor_data
        GROUP BY 
          sensor_type
      ) latest_data 
      ON s.sensor_type = latest_data.sensor_type 
      AND s.timestamp = latest_data.latest_timestamp;
    `;

    return new Promise((resolve, reject) => {
      connection.query(query, function (err, result) {
        connection.end(); //Ends connection after query
        if (err) return reject(err);

        // Check we got enough sensor values
        if (!result || result.length < 6) {
          return reject(new Error("Not enough sensor data returned."));
        }

        //Should return an array with all the latest sensor readings
        const sensorValues = [
          result[0].value,
          result[1].value,
          result[2].value,
          result[3].value,
          result[4].value,
          result[5].value,
        ];
        resolve(sensorValues);
      });
    });
  }

  //Function to check if an alert should be sent and handles it
  async checkAlert() {
    var alertBody = "Hello user! Some of your thresholds have been tripped. Below are the sensors that were detected: \n";
    var alert = false;

    let data;
    try {
      //Reading the JSON file synchronously
      data = fs.readFileSync("./data/alertThreshold.json");
      console.log("JSON file successfully read");
    } catch (error) {
      console.log("An error has occurred:", error);
      return;
    }

    //Parsing the JSON string into a JavaScript object
    var parsedData = JSON.parse(data);

    // Get the current timestamp
    const currentDate = new Date();
    const time = currentDate.getTime();

    //Gets the latest sensor values
    let sensorValue;
    try {
      sensorValue = await this.fetchData();
    } catch (err) {
      console.error("Error fetching sensor data:", err.message);
      return;
    }

    if (this.isOutOfRange(sensorValue[5], parsedData.sensors.TSL2561)) {
      alertBody += "LIGHT\n";
      alert = true;
    }
    
    if (this.isOutOfRange(sensorValue[0], parsedData.sensors.BME280_Temperature)) {
      alertBody += "TEMPERATURE\n";
      alert = true;
    }
    
    if (this.isOutOfRange(sensorValue[1], parsedData.sensors.BME280_Humidity)) {
      alertBody += "HUMIDITY\n";
      alert = true;
    }
    
    if (this.isOutOfRange(sensorValue[2], parsedData.sensors.BME280_Pressure)) {
      alertBody += "PRESSURE\n";
      alert = true;
    }
    
    if (this.isOutOfRange(sensorValue[4], parsedData.sensors.SoilMoisture)) {
      alertBody += "SOIL MOISTURE\n";
      alert = true;
    }
    
    if (this.isOutOfRange(sensorValue[3], parsedData.sensors.HC_SR04_Distance)) {
      alertBody += "DISTANCE\n";
      alert = true;
    }

    alertBody = alertBody + "Please check on your plant at your earliest convenience.";

    //Checks if 1h has passed since last alarm and if a threshold is tripped
    if (time - parsedData.lastAlarmTimestamp > 3600000 && alert) {
      // Modify the JSON
      const updatedData = {
        sensors: parsedData.sensors,  // keep existing threshold values
        lastAlarmTimestamp: time,
      };
      // const updatedData = {
      //   sensors: {
      //     TSL2561_threshold: parsedData.sensors.TSL2561_threshold || 0, // Default to 0 if not found
      //     BME280_Temperature_threshold: parsedData.sensors.BME280_Temperature_threshold || 0,
      //     BME280_Humidity_threshold: parsedData.sensors.BME280_Humidity_threshold || 0,
      //     BME280_Pressure_threshold: parsedData.sensors.BME280_Pressure_threshold || 0,
      //     SoilMoisture_threshold: parsedData.sensors.SoilMoisture_threshold || 0,
      //     HC_SR04_Distance_threshold: parsedData.sensors.HC_SR04_threshold || 0,
      //   },
      //   lastAlarmTimestamp: time,
      // };

      //Writing the updated data back to the file
      try {
        fs.writeFileSync(
          "./data/alertThreshold.json",
          JSON.stringify(updatedData, null, 2)
        );
        console.log("JSON rewritten");
      } catch (error) {
        console.log("An error has occurred ", error);
      }

      //Sending the email
      try {
        await this.send(process.env.ALERT_RECIPIENT, "WARNING", alertBody);
        console.log("✅ Alert email sent.");
      } catch (emailErr) {
        console.error("❌ Failed to send email:", emailErr.message);
      }
    } else if (time - parsedData.lastAlarmTimestamp <= 3600000)
      console.log("Too early to send alarm");
    else if (alert) console.log("All sensors are good");
    else console.log("I don't know why this failed");
  }
}

module.exports = emailService;