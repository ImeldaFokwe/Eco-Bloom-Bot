const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require('cookie-parser');

dotenv.config({path: "./.env"});

const app = express();

// Initialize the database and tables
require("./config/dbInit"); // Ensures tables are created if they don't exist

const db =mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
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

app.listen(5002,() => {
    console.log("EBB server run correctly and started on port 5002");
})