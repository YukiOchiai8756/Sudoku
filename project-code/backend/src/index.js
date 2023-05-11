// CS3099 Group 19 Backend
// Set up Environment Vars
require('dotenv').config();

const express = require("express");
const app = express();
const api = require("./api");
const cors = require('cors');
const fedapi = require("./api/fedapi");
const cookie = require("cookie-parser");
const {HttpError, OAuthViolation} = require("./util/error");
const bodyParser = require('body-parser');

// Set up error reporting
const Sentry = require("@sentry/node");

Sentry.init({
    dsn: process.env.SENTRY_DSN || null
});
app.use(Sentry.Handlers.requestHandler());

app.use(cors({
    origin: process.env.FRONTEND_BASE,
    credentials: true
}));

app.use(express.json())
app.use(cookie());
app.use(bodyParser.urlencoded({extended: true}));
app.use("/api", api);
app.use("/fedapi", fedapi);

app.get("/", (req, res) => {
    res.send("Backend online");
});


// Error handler

app.use((err, req, res, next) => {
    console.log(err);
    if (!res.headersSent) {
        if (err instanceof HttpError) {
            res.status(err.status);
            res.send(err);

            if (err instanceof OAuthViolation) {
                Sentry.captureException(err);
            }

        } else {
            res.status(500);
            Sentry.captureException(err);
            res.send({
                error: err.message
            })
        }

    } else {
        next(err);
    }
});

app.listen(process.env.PORT || 8080);
