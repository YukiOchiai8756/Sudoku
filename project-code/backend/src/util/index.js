const isNumber = (no) => !isNaN(no);
const validGroupNo = (n) => n && isNumber(n) && typeof n === "number" && n >= 10 && n < 20;

const EMAIL_REGEX = /^[a-z0-9_.+-]+@[a-z0-9-]+\.[a-z0-9-.]+$/i;

const validEmail = (email) => email && EMAIL_REGEX.test(email);
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const {HttpError} = require("./error");
const PERMISSION = {
    User: 0,
    Moderator: 1,
    Admin: 2
}

/**
 * Makes a HTTP request, intended for intergroup comms.
 * Works based on the assumption that a request will fail - and tries to catch all the edge cases gracefully - and throw
 * them in a consistent way.
 * This method, if successful will return the JSON body.
 * If it fails, it'll throw an error.
 * @param url URL to Request
 * @param options Fetch API Options
 * @throws HttpError where an error is returned in a known format. These objects will match the information returned from
 * upstream, but error messages will indicate the error originated upstream.
 *
 */
async function makeRequest(url, options = {}) {
    const resp = await fetch(url, options);
    const text = await resp.text();

    let json;
    try {
        json = JSON.parse(text);
    } catch (err) {
        if (err instanceof SyntaxError) {
            throw new Error(`Response not JSON: ${text}`);
        }
        throw new HttpError(resp.status, "UpstreamFailed", err);
    }

    if (json.error) {
        throw new HttpError(resp.status, json.error, `${json.error_description || ""} (Upstream - ${url})`);
    }

    return json;
}

/**
 * Converts type number to string
 * @param {} type
 * @returns type as string
 */
function typeToString(type){
    if(type == 1) return "sudoku";
    if(type == 2) return "sudoku variant";
    if(type == 3) return "lights out";
    return "unknown";
}

/**
 * Returns local type number
 * @param {} type
 * @returns type as int, 0 if unknown type
 */
function typeToInt(type){
    if(type === "sudoku") return 1;
    if(type === "sudoku variant") return 2;
    if(type === "lights out") return 3;
    else return 0;
}

const stringPuzzleToNumbers = (puzzle) => puzzle.map(row => row.map(i => typeof i === "string" ? parseInt(i, 10) : i));

module.exports = {isNumber, validGroupNo, makeRequest, PERMISSION, stringPuzzleToNumbers,  typeToInt, typeToString, validEmail};
