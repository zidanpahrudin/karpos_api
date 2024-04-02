const express = require('express');
const https = require("https");
const fs = require("fs");
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const logger = require('morgan');
const connectDB = require('./config/db');

require("dotenv").config({ path: path.resolve(__dirname, '.env') });


connectDB();

var app = express();


process.env.NODE_CONFIG_DIR = __dirname + "/config/";

// security checklist
app.use(xss());
app.use(hpp());
app.use(cors());
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));
app.use(mongoSanitize());
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // Max requests per window
// });
// app.use(limiter);


app.use(logger('combined'));
app.use(express.json());

app.use(express.urlencoded());

app.use(compression());

app.use(cookieParser());

app.use("/api/company", require("./src/routes/company/users"));
app.get("/", (req, res) => res.send("oke"));
app.use('/api', require('./src/routes'));




module.exports = app;
