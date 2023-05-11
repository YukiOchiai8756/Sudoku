const express = require('express');
const router = express.Router();
const {isNumber, validGroupNo, makeRequest, typeToString} = require("../util");
const {HttpError, OAuthViolation, wrapHandler} = require("../util/error");
const {getUserFromToken, storeOAuthToken, createOAuthUser, db} = require("../util/db");
const {getToken} = require("../util/auth");
const {fedAPI: {servers}} = require("../config.json");
const {fedapi} = require("../middleware/auth");
const fetch = require("node-fetch");
const { isStandard } = require("../util/solver");
const Sentry = require("@sentry/node");
const {captureMessage} = require("@sentry/node");

const frontendBase = process.env.FRONTEND_BASE;
const groupNo = parseInt(process.env.GROUP_NO, 10);

function getSuperhostBase(groupId) {
    return `https://cs3099user${groupId}.host.cs.st-andrews.ac.uk/fedapi`;
}

function optionalState(state) {
    return state ? `&state=${state}` : ""
}


// Grants are never actually persisted to the database;
// There's not really any point. They're short-lived and relatively easy to re-acquire, and shouldn't be held
// by other servers long-term. If we need to scale up for some odd reason in the future, we cna move these to a DB table too.
// This will be a map from "userId-groupId" to an object with keys:
// userId: userId for user
// groupId: Server/group id
// grant
const oAuthGrants = new Map();

/**
 * Federation API
 * This API is made according to https://cs3099user11.host.cs.st-andrews.ac.uk/swagger/api-docs/#/
 */

router.get("/", (req, res) => {
    res.send({
        title: "Tens Supergroup API",
        description: "The shared federation API for the Tens Supergroup in CS3099.",
        group: groupNo,
        redirectUrl: `https://${req.hostname}/fedapi/auth/redirect`,
        authoriseUrl: `https://${req.hostname}/fedapi/auth/authorise`
    });
});

router.get("/auth/authorise", wrapHandler(async (req, res) => {
    const server = req.query.client_id;
    const state = req.query.state;


    if (server && isNumber(server) && server.length > 0) {
        if (parseInt(server, 10) === groupNo) {
            throw new HttpError(400, "You cannot authorise as an OAuth2 user for this server - log in normally.");
        }

        // Check if user is logged in
        if (req.cookies.authorization && typeof req.cookies.authorization === "string") {
            const user = await getUserFromToken(req.cookies.authorization);
            if (user) {
                // Generate grant
                const key = `${user.userID}`;
                if (!oAuthGrants.has(key)) {
                    const grant = await getToken();
                    oAuthGrants.set(key, {
                        userId: user.userID,
                        server: parseInt(server, 10),
                        grant
                    });
                }

                const obj = oAuthGrants.get(key);
                // Send them back to redirect URL
                const grant = encodeURIComponent(obj.grant);


                console.log(`Issuing: `, obj);


                const cfg = servers.find(s => s.groupNo === parseInt(server, 10));
                if (cfg) {
                    if (cfg.redirect !== "") {
                        // Special redirect
                        res.redirect(`https://cs3099user${server}.host.cs.st-andrews.ac.uk/${cfg.redirect}/${groupNo}?code=${grant}${optionalState(state)}`);

                        return;
                    }
                }
                // Default to ordinary redirect
                res.redirect(`${getSuperhostBase(server)}/auth/redirect/${groupNo}?code=${grant}${optionalState(state)}`);


                return;
            }
        }

        // Not logged in
        res.redirect(`${frontendBase}/oauth?client_id=${server}${optionalState(state)}`);


    } else {
        throw new HttpError(400, "invalid_request", "You must provide a client_id.");
    }

}));


router.get("/auth/redirect/:id", wrapHandler(async (req, res) => {
    Sentry.captureMessage(`Got redirect from ${req.params.id}`, {extra: {
       group: req.params.id,
        grant: req.query.code
    }});
    if (!req.params.id || !isNumber(req.params.id)) {
        throw new OAuthViolation(400, 0, "invalid_request", "You must provide a valid group number from 10-19.");
    }
    const groupFrom = parseInt(req.params.id, 10);


    if (!validGroupNo(groupFrom)) {
        throw new OAuthViolation(400, 0, "invalid_request", "You must provide a valid group number from 10-19.");
    }

    // Get Grant
    const grant = req.query.code;
    if (!grant || typeof grant !== "string") {
        throw new OAuthViolation(400, groupFrom, "invalid_grant", `Bad Grant: Not valid format.`);
    }



    // Send Grant away to home server for auth
    const server = servers.find(s => s.groupNo === groupNo);

    let result;

    const body = new URLSearchParams();
    body.set("client_id", groupNo);
    body.set("client_secret", server.token);
    body.set("grant_type", "authorization_code");
    body.set("code", grant);

    try {
        result = await makeRequest(`${getSuperhostBase(groupFrom)}/auth/token`, {
            method: "POST",
            body: body,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
    } catch (err) {
        if (err instanceof HttpError) {
            console.log(`Failed to exchange grant for token. Server responded with error ${err.message}.\nError Description: ${err.desc}`);
            throw err;
        }
        console.log(err.message);
        Sentry.captureException(err);
        throw new HttpError(500, "FailedToExchange", `Failed to exchange grant for token. Error not following OAuth, status code: ${err.status} ${err.message} ${err.desc}`);
    }

    if (!result["access_token"]) {
        throw new OAuthViolation(500, groupFrom, "NoCode", "Upstream server didn't provide an error or an OAuth code.")
    }

    const code = result["access_token"];

    const userInfo = await makeRequest(`${getSuperhostBase(groupFrom)}/user?client_id=${groupNo}`, {
        headers: {
            "Authorization": `Bearer ${code}`
        }
    });

    // Validate the object has all keys
    const {username, id, email, group} = userInfo;
    if (!username || !id || !email || !group || !validGroupNo(group) || typeof username !== "string" || username.length === 0 || group !== groupFrom) {
        console.log(userInfo);
        Sentry.setUser(userInfo);
        throw new OAuthViolation(400, groupFrom, "invalid_request", "Upstream server responded with a malformed user object that does not comply with the fedapi spec");
    }
    // Check that the user does not already exist

    const ourToken = await getToken();


    // Store new auth token
    await createOAuthUser(id, username, email, code, groupFrom, ourToken);
    // if there is an existing tok, this OAuth user already had a record with us.
    // The DB will have updated their record with new token and user information in-case it's changed.

    // Retrieve user information
    // store it
    // Send user to application
    res.cookie("authorization", ourToken, {
        httpOnly: true,
        // Two weeks
        expires: new Date(Date.now() + 1209600000),
        secure: req.secure || false,
        sameSite: "lax"
    });

    res.redirect(`${frontendBase}/browser`);
    Sentry.captureMessage(`Redirect`);
}));

router.post("/auth/token", wrapHandler(async (req, res) => {
    console.log("Got Token request");
    // Validate Server token
    let targetServer = req.body.client_id;
    const serverToken = req.body.client_secret;
    const grant = req.body.code;

    Sentry.setContext("OAuth", {
        targetServer,
            serverToken,
            grant
    });

    if (!targetServer || !isNumber(targetServer)) {
        throw new OAuthViolation(400, 0, "invalid_client", "You must provide a valid group number from 10-19.");
    } else if (!serverToken) {
        throw new OAuthViolation(401, targetServer, "unauthorized_client", "You must provide a server authentication token.");
    }

    targetServer = parseInt(targetServer, 10);

    if (!validGroupNo(targetServer)) {
        throw new OAuthViolation(400, 0, "invalid_client", "You must provide a valid group number from 10-19.");
    }

    // Validate server token is a valid token
    const expectedServer = servers.find(server => server.groupNo === targetServer);
    if (!expectedServer) {
        throw new Error("Failed to find auth token for server " + targetServer);
    }

    if (expectedServer.token !== serverToken) {
        throw new OAuthViolation(403, targetServer, "unauthorized_client", `Supplied token is not correct for ${targetServer}.`);
    }


    // Validate Grant
    if (!grant || typeof grant !== "string") {
        throw new OAuthViolation(400, targetServer, "invalid_grant", `Bad Grant: Not valid format.`);
    }
    let userId = undefined;
    for ([_, val] of oAuthGrants) {
        if (val.server === targetServer) {
            if (val.grant === grant) {
                userId = val.userId;
                break;
            }
        }
    }


    if (userId === undefined) {
        // No grants existed with the desired groupId
        throw new OAuthViolation(403, targetServer, "invalid_grant");
    }
    oAuthGrants.delete(`${userId}`);

    // Generate auth token
    const authToken = await getToken();

    // Store it
    await storeOAuthToken(userId, targetServer, authToken);

    // Send it
    Sentry.setUser({id: userId});
    captureMessage("Issuing access_token");
    res.send({
        access_token: authToken
    });
}));

router.get("/user", fedapi, (req, res) => {
    const {userID, email, username} = req.user;
    Sentry.setUser(req.user);

    const toSend = {
        username,
        id: userID,
        group: groupNo,
        email: email
    };

    Sentry.captureMessage("Sending /user", {extra: {
            toSend
        }})
    res.send(toSend);
});

/**
	 * Method for checking if puzzle has valid metadata
	 * If puzzle is invalid BUT fixable (e.g. doesn't contain some optional fields) it will modify and return fixed puzzle
	 * @param {} puzzle 
	 * @returns the puzzle if valid, null if not
	 */
const validateForeignPuzzle = (puzzle) => {
    // Check if puzzle unfixable
    // Group must be >= 10 and <= 19
    if(!("group" in puzzle)) return null;
    if(parseInt(puzzle.group.toString()) === undefined | puzzle.group < 10 | puzzle.group > 19) return null; 
    // Sudoku ID must be present
    if(!("sudoku_id" in puzzle)) return null;
    // Puzzle puzzle - try to parse as 2d array

    // Fix puzzle if possible
    // Name can be fixed ANON + group
    if('title' in puzzle === false) puzzle['title'] = "ANON";
    // Difficulty can be fixed
    if('difficulty' in puzzle === false) puzzle['difficulty'] = 0;
    // Author name can be fixed
    if('author_name' in puzzle === false) puzzle['author_name'] = "some person";
    // Rating can be fixed
    if('rating' in puzzle === false) puzzle['rating'] = 0;
    // We only handles ratings between 1 to 3 but some groups have 1 - 5 so multiply it by 3/5 (0.6)
    puzzle['rating'] = Math.round(puzzle['rating'] * 0.6)
    // hasBeenCompleted can be fixed (assume no)
    if('hasBeenCompleted' in puzzle === false) puzzle['hasBeenCompleted'] = 0;
    // only allowed valid sudokus through so fine to label as sudoku (some websites label their 9x9 sudokus as traditional)
    if('type' in puzzle === false || puzzle['type'] === "traditional") puzzle['type'] = "sudoku";

    // Replace 0s with ""s
    puzzle['puzzle'] = puzzle['puzzle'].map(row => row.map(cell => cell == 0 ? "" : cell));
    
    return puzzle;
}


const puzzleValid = (puzzle) => {
    try{
        let gridSize = Math.sqrt(puzzle.length);
        // Check rows
        for (let row of puzzle) {
            // Contains[x-1] = number of occurrences of x
            let contains = Array(gridSize * gridSize).fill(0);
            for (let cell of row) {
                if (cell.value >= 1 && cell.value <= (gridSize * gridSize)) {
                    contains[cell.value - 1]++;
                }
            }
            // If more than one occurrence of x, return false.
            if (contains.filter(x => x <= 1).length !== (gridSize * gridSize)) {
                return false;
            }
        }

        // Check columns
        for (let row_num in puzzle) {
            // Contains[x-1] = number of occurrences of x
            let contains = Array((gridSize * gridSize)).fill(0);
            for (let cell_num in puzzle[row_num]) {
                let cell = puzzle[cell_num][row_num];
                if (cell.value >= 1 && cell.value <= (gridSize * gridSize)) {
                    contains[cell.value - 1]++;
                }
            }
            // If more than one occurrence of x, return false.
            if (contains.filter(x => x <= 1).length !== (gridSize * gridSize)) {
                return false;
            }
            
    }

    // Sub-grids
    for (let x = 0; x < (gridSize * gridSize); x += gridSize) {
        for (let y = 0; y < (gridSize * gridSize); y += gridSize) {
            // Contains[x-1] = number of occurrences of x
            let contains = Array((gridSize * gridSize)).fill(0);
            for (let i = x; i <= x + (gridSize - 1); i++) {
                for (let j = y; j <= y + (gridSize - 1); j++) {
                    let cell = puzzle[j][i];
                    if (cell.value >= 1 && cell.value <= (gridSize * gridSize)) {
                        contains[cell.value - 1]++;
                    }
                }
            }
            // If more than one occurrence of x, return false.
            if (contains.filter(x => x <= 1).length !== (gridSize * gridSize)) {
                return false;
            }
        }
    }
    // If false hasn't already been returned, solution must be valid.
    return true;}
    catch{
        return false;
    }

}

router.get("/sudoku", (req, res, next) => {
    // No need to check valid token for this method

    let difficulty = [req.query['difficulty']];
    let ratings = [req.query['ratings']];

    let offset = req.query['offset'];
    let limit = req.query['limit'];
    let group = req.query['group'];

    difficulty = difficulty.flat().map(x => {
        if(!isNaN(x)) return x;
        try{
            return Array(JSON.parse(x));
        }
        catch{
            return x;
        }
    })

    // These filters ensure all elements are integers
    difficulty = Array((difficulty)).flat(3).filter(x => !isNaN(x) && Number.isInteger(Number.parseFloat(x))).map(x => Number.parseInt(x))
    ratings = Array((ratings)).flat(3).filter(x => !isNaN(x) && Number.isInteger(Number.parseFloat(x))).map(x => Number.parseInt(x))

    // If empty get all
    if(difficulty.length === 0) difficulty = [0,1,2,3];
    if(ratings.length === 0) ratings = [0,1,2,3,4,5];

    let difficulty_text = difficulty.map(x => "difficulty=" + x + "&").join("").slice(0,-1);
    let ratings_text = ratings.map(x => "ratings=" + x + "&").join("").slice(0,-1)

    // Pass onto other website if group number not group 19
    try{
        if(!Number.isNaN(parseInt(group)) && group >= 10 && group <= 18){    
            let url = `https://cs3099user${group.toString()}.host.cs.st-andrews.ac.uk/fedapi/sudoku?${difficulty_text}&${ratings_text}`;

            fetch(url, {credentials: "include"})
                .then(r => {
                        if(r.status >= 200 && r.status < 400){
                            return r.json();
                        }
                        else{
                            throw new Error("FAILED TO GET DATA");
                        }
                })
                .then(puzzleList => {
                    // Handles single puzzles being sent
                    if(puzzleList.length === undefined) puzzleList = [puzzleList];
                    // If response is single puzzle NOT in a list, put it in one
                    if(Object.prototype.toString.call(puzzleList) !== '[object Array]') puzzleList = [puzzleList];
                    puzzleList = puzzleList.map(x => {
                        // isStandard requires puzzles to contain ONLY ints
                        x.puzzle = x.puzzle.map(row => row.map(cell => cell === "" ? 0 : parseInt(cell)));
                        // Only accept 9x9, sudokus from other servers)
                        if (!isStandard(x.puzzle) || !puzzleValid(x.puzzle)) return null;
                        // Check that this puzzle metadata is valid
                        return validateForeignPuzzle(x);
                    }).filter(x => x !== null);

                    console.log(group + ": " + puzzleList.length);
                    res.status(200);                    
                    if(group === 10) console.log(puzzleList.length);
                    if(!Number.isInteger(offset) || offset < 0) offset = 0;
                    if(!Number.isInteger(limit) || limit < 0) limit = 256;
                    res.send(puzzleList.slice(offset, limit + 1));
                })
                .catch(e => {
                    res.status(404);
                    res.send([]);
                })
        }
        else{
            let puzzleList = [];
            difficulty = JSON.stringify(difficulty.filter(x => Number.isInteger(x))).replace("[", "(").replace("]", ")");
            ratings = JSON.stringify(ratings.filter(x => Number.isInteger(x))).replace("[", "(").replace("]", ")");
        
            // Query builder (for binary queries e.g. username == "Jack" (rather than IN operations))
            // Can easily add other query fields to this
        
            let username = req.query['username'];
            // If all omitted then only return standard sudokus (for other supegroup servers)
            let allTypes = req.query['all'];
            let queryParams = [];
        
            // Verify query fields - if fine add to queryParams
            if (username !== '' && username !== undefined) queryParams.push(["Users.username", username]);
            
            // Use ? placeholder to avoid SQL injection - construct the query (LIST OF ANDs and WHEREs)
            // query string follows the IN statements, so start with AND
            let query = "";
            if (queryParams.length > 0) {
                query += ' AND ';
                query += "WHERE";
                for (let i = 0; i < queryParams.length; i++) {
                    query += `\ ${queryParams[i][0]} = ?`;
                }
            }
        
        
            let sql = `
                    SELECT Puzzles.*, Users.*  \
                    FROM Puzzles \
                    INNER JOIN Users \
                    ON Users.userID=Puzzles.userID \
                    WHERE Puzzles.difficultyLevel IN ${difficulty} AND Puzzles.avgUserDifficulty IN ${ratings} ${query};`;
        
            db.all(sql , queryParams.map(x => x[1]), (err, rows) => {
                if (err) {
                    return next(err);
                }
                rows.forEach(element => {
                    // Send each puzzle, convert to supergroup format
                    let puzzle = {};
                    puzzle.group = 19;
                    puzzle.type = typeToString(element.puzzleType);
                    puzzle.sudoku_id = element.puzzleID;
                    puzzle.difficulty = element.difficultyLevel;
                    puzzle.author_id = element.userID;
                    puzzle.author_name = element.username;
                    puzzle.title = element.puzzleName;
                    puzzle.rating = element.avgUserDifficulty;

                    puzzle.puzzle = JSON.parse(element.puzzlesUnSolved);
                    puzzle.solution = element.puzzleSolved ? JSON.parse(element.puzzleSolved) : null;
                    puzzle.hasBeenCompleted = element.hasBeenCompleted;
                    puzzleList.push(puzzle)
                });
                res.status(200);
                if(allTypes === undefined) puzzleList = puzzleList.filter(x => x.type === "sudoku");
                if(!Number.isInteger(offset) || offset < 0) offset = 0;
                if(!Number.isInteger(limit) || limit < 0) limit = 256;
                res.send(puzzleList.slice(offset, limit + 1));
        
            });
        
        }}
        catch(ex){
            throw new HttpError(400, "You cannot currently access server of group " + group.toString());
        }
    


});


module.exports = router;
