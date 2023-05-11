const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const {getToken} = require("../util/auth");
const {compare} = require("bcrypt");
const {HttpError, wrapHandler} = require("../util/error");
const {db, getByEmailOrUsername} = require("../util/db");
const {validEmail} = require("../util");


router.get("/", (req, res) => {
    res.send("Auth here");
});

router.post("/register", wrapHandler(async (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    const email = req.body.email
    // Check that fields aren't empty
    if (!username || !password || !email) {
        throw new HttpError(400, "You must provide username, password & email.");
    }
    // Check that the email is in a valid format
    if (!validEmail(email)) {
        throw new HttpError(400, "InvalidEmail", "Please supply an email in a valid format.");
    }

    // Check if username or email already in use with group 19
    const existingUser = await getByEmailOrUsername(username, email);

    if (existingUser) {
        if (existingUser.username === username) {
            throw new HttpError(400, "UsernameTaken", "That username is already in use, please choose another.");
        } else {
            throw new HttpError(400, "EmailTaken", "That email is already in use, please choose another.");
        }
    }

    // Hash the password wih the salt
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    const tok = await getToken();

    db.run("INSERT INTO Users(userName,email,password,secretToken) values(?,?,?,?)",
        username, email, hash, tok, (err) => {
            if (err) {
                return next(err);
            }
            // Set the cookie indicating a user is logged in
            res.cookie("authorization", tok, {
                httpOnly: true,
                // Two weeks
                expires: new Date(Date.now() + 1209600000),
                secure: req.secure || false,
                sameSite: "lax"
            });
            res.status(200).json('Insert Success');
        })


}));


router.post("/login", (req, res, next) => {
    const username = req.body.username;
    // Check that fields aren't empty
    if (!username || !req.body.password) {
        throw new HttpError(400, "You must provide username and password.");
    }

    let sql = 'SELECT password, secretToken FROM Users WHERE userName= ? AND password IS NOT NULL';
    // Retrieve the password using the username
    db.get(sql, [username], async (err, data) => {
        if (err) {
            return console.error(err.message);
        }

        if (data) {
            const submittedPassword = req.body.password;
            // Compare password with the decoded password fetched from the database
            const match = await compare(submittedPassword, data.password);

            if (match) {
                res.cookie("authorization", data.secretToken, {
                    httpOnly: true,
                    // Two weeks
                    expires: new Date(Date.now() + 1209600000),
                    secure: req.secure || false,
                    sameSite: "lax"
                });

                return res.status(200).json('Validated!');

            }

            return next(new HttpError(403, "IncorrectDetails", "Your username or password are incorrect."));
        }

        return next(new HttpError(400, "UserNotFound", "No user exists with that username."));

    })
});

router.get("/logout", (req, res, next) => {
    console.log("Logout endpoint reached");
    // Remove the cookie from the backend (has to be here since httpOnly is set to true on creation)
    res.cookie("authorization", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: req.secure || false,
        sameSite: "lax"
    });

    return res.status(200).json('Logged out successfully!');
});



module.exports = router;

// db.close((err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log('Close the database connection.');
// });
