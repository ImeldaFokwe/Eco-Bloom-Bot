const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require('cookie-parser');

dotenv.config({ path: "./.env" });

const app = express();

const cors = require('cors');
app.use(cors());

// Initialize the database and tables
require("./config/dbInit"); // Ensures tables are created if they don't exist

const db = mysql.createConnection({

    host: process.env.AWS_DATABASE_HOST,
    user: process.env.AWS_DATABASE_USER,
    password: process.env.AWS_DATABASE_PASSWORD,
    database: process.env.AWS_DATABASE,
});

const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "hbs");

db.connect((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("MYSQL is connected");
    }
});

//Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use('/sensors', require('./routes/sensors'));
app.use('/actuators', require('./routes/actuators'));

app.use('/camera', require('./routes/camera'));

app.use('/thresholds', require("./routes/thresholds"));
app.use('/api/plant', require('./routes/score'));



app.listen(5002, () => {
    console.log("EBB server run correctly and started on port 5002");
})