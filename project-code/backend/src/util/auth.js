// Authorisation related utility functions
const crypto = require("crypto");
const len = process.env.TOKEN_LENGTH;
const TOKEN_LENGTH = len ? parseInt(len, 10) : 100;


/**
 * Promise polyfill for random bytes. Returns a randomly generated cryptographically secure token.
 * The token will be set according to TOKEN_LENGTH and be a valid Base64 String.
 * This complies with the standards set out by the supergroup.
 * @returns {Promise<String>}
 */
function getToken() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(TOKEN_LENGTH * 2, (err, res) => {
            if (err) {
                return reject(err);
            }
            resolve(res.toString("base64").substring(0, TOKEN_LENGTH));
        });

    });

}

module.exports = {

    getToken, TOKEN_LENGTH
}
