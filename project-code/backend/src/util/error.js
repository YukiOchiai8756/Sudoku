class HttpError extends Error {
    status = 500;

    /**
     * Create a new http error with a given status, message and optional description.
     * @param status Number - HTTP Status integer - https://httpstatuses.org/
     * @param message String - message to display to user or error code for OAuth2
     * @param description Optional String - User-readable error
     */
    constructor(status, message, description) {
        super(message);
        this.status = status;
        this.desc = description;
    }

    toJSON() {
        return {
            error: this.message,
            status: this.status,
            error_description: this.desc || undefined
        }

    }

}

class OAuthViolation extends HttpError {
    /**
     * Create a new http error with a given status, message and optional description.
     * @param status
     * @param groupOrServer Number - Group number of server that violated protocol.
     * @param message String - message to display to user or error code for OAuth2
     * @param description Optional String - User-readable error
     */
    constructor(status, groupOrServer, message, description) {
        super(status, message, description);
        // TODO: Report error
        this.responsibleGroup = groupOrServer;
    }
}

/**
 * Used to wrap async route handlers and catches any asnyc errors thrown.
 * @param fn Route handler to wrap
 */
function wrapHandler(fn) {
    return function inner(req, res, next) {
        const result = fn(req, res, next);
        if (result && result.then && result.catch) {
            // if it has a .then method then it's a valid promise as per the spec
            // and we can only catch it if it has a .catch
            result.catch((err) => {
                next(err);
            });
        }
    }
}


module.exports = {HttpError, OAuthViolation, wrapHandler}