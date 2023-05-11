// Middleware that checks if a user is logged in.
// if the user is logged in, Request.user is set to their user information
// if they are not, a 401 unauthorised is returned.

const {HttpError} = require("../util/error");
const {getUserFromToken, getUserFromFedToken} = require("../util/db");
const Sentry = require("@sentry/node");


const auth = async (req, res, next) => {
    if (req.cookies.authorization && typeof req.cookies.authorization === "string") {
        const user = await getUserFromToken(req.cookies.authorization);
        if (user) {
            req.user = user;
            Sentry.setUser(req.user);
            return next();
        }
    }
    // Pass error to next to be sent to client
    // This is an alternative to throwing it, and it still goes to the default error handler.
    return next(new HttpError(401, "Unauthorized", "You cannot access that resource - please login."));
};

const fedapiAuthenticate = async (req, res, next) => {
    const token = req.get("authorization");
    if (token && typeof token === "string") {
        const user = await getUserFromFedToken(token.replace(/bearer/i, "").trim())

        if (user) {
            req.user = user;
            req.fedapiRequest = true;
            req.user.fedapi = true;
            return next();
        }
    }
    // Pass error to next to be sent to client
    // This is an alternative to throwing it, and it still goes to the default error handler.
    return next(new HttpError(401, "Unauthorized", "You cannot access that resource - please authenticate (FedAPI)."));
};


module.exports = auth;

// Make the fedApi a key on the function object of auth
module.exports.fedapi = fedapiAuthenticate;
