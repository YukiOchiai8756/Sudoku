const sqlite3 = require("sqlite3");
const {stringPuzzleToNumbers, typeToString} = require("./index");

const no = process.env.GROUP_NO;
if (!no) {
    throw new Error(`Group number is required - please provide one through .env.`);
}

const db = new sqlite3.Database('SystemDesign', sqlite3.OPEN_READWRITE | sqlite3.OPEN_FULLMUTEX, (err) => {
    // This will (usually) kill the server. This is a good thing: We can't work without a DB.
    if (err) {
        console.log("Failed to open database: Do you need to run the import script?");
        console.log("Run it by going to the project root (project-code) and running ./database.sh import.");
        console.log("You may need to run 'bash ./database.sh import' on some systems.");
        throw err;
    }
    db.exec("PRAGMA foreign_keys = ON;", (err)=> err && console.log(err));
    console.log('Connected to the System design database.');
});

function getUserFromToken(token) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT userName, permission, userID, email, points FROM Users WHERE secretToken=?;"

        db.get(SQL, [token], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

/*
    This is for storing where users of our server have logged into another group.
    This means we know their userGroupID is our server, and serverId/groupid is the one they've logged into.
 */
function storeOAuthToken(userId, groupId, token) {
    return new Promise(function (resolve, reject) {
        const SQL = "INSERT INTO OAuthTokens(userId, serverId, token) VALUES(?,?,?);"

        db.run(SQL, [userId, groupId, token], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

function createOAuthUser(externalId, username, email, externalToken, groupNumber, token) {
    return new Promise(function (resolve, reject) {
        // Check if user already exists
        const SQLCheck = "SELECT userID FROM ExternalUsers WHERE ExternalUsers.externalId=?;"
        db.get(SQLCheck, [externalId], (err, existing) => {
            if (err) return reject(err);
            // if they already exist, update it
            // if they do not, create a new record
            if (existing) {
                const SQL = "UPDATE Users SET username = ?, email = ?, secretToken=? WHERE userID=?"

                db.run(SQL, [username, email, token, existing.userID], (err) => {
                    if (err) return reject(err);
                    resolve();
                });


            } else {
                db.serialize(() => {

                    const INSERTMain = "INSERT INTO Users (userName,email,secretToken) values(?,?,?)"
                    // It's rather unlikely all of these will appear twice, but I suppose it's possible.
                    // If it does: too bad!
                    const getMainIdSQL = "SELECT userID FROM Users WHERE username=? AND email=? AND secretToken=?;"
                    const createExternalUser = "INSERT INTO ExternalUsers (groupID, externalId, userID, token) VALUES (?,?,?,?);"

                    db.exec("BEGIN TRANSACTION")
                        // Insert main user
                        .run(INSERTMain, [username, email, token])
                        // Get the new user id
                        .get(getMainIdSQL, [username, email, token],(err, data)=> {
                            if (err) throw err;
                            const userId = data.userID;
                            db.run(createExternalUser, [groupNumber, externalId, userId, externalToken])
                                .exec("COMMIT", (e) => {
                                    if (e) throw e;
                                    resolve();
                                });
                        })

                });
            }
        });
    });
}


function getUserFromFedToken(token) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT OAuthTokens.userID, email, permission, username, points, serverID as groupToken FROM Users, OAuthTokens WHERE OAuthTokens.token = ? AND OAuthTokens.userID = Users.userID"

        db.get(SQL, [token], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}


/**
 * Returns the user with the given username or email.
 * @param username
 * @param email
 * @returns {Promise<unknown>}
 */
function getByEmailOrUsername(username, email) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT username, email FROM Users WHERE username = ? OR email = ? AND password IS NOT NULL"

        db.get(SQL, [username, email], (err, data) => {
            if (err) return reject(err);
            resolve(data);


        });
    });
}

function getComment (commentId) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT * FROM PuzzlesComments WHERE commentID=?";

        db.get(SQL, [commentId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

function getUserById(userId) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT userID, username, email, permission, points FROM Users WHERE userID= ?"

        db.get(SQL, [userId], (err, data) => {
            if (err) return reject(err);
            resolve(data);


        });
    });
}

// The following SQL statements are used on the Profile page
// They are pretty complex, so please don't change them...

function getCreations(userId) {
    return new Promise(function (resolve, reject) {
        const SQL = `SELECT pt.puzzleID, pt.puzzleType, pt.puzzleName, pt.likes, count(pct.puzzleID) as comments, ut.username as author, ut.userID as authorID
                     FROM Puzzles pt, PuzzlesComments pct, Users ut
                     WHERE pt.userID=? AND ut.userID = PT.userID`;

        db.all(SQL, [userId], (err, data) => {
            if (err) return reject(err);
            if (!data) return resolve(data);

            console.log(data);
            resolve(data.filter(i => i.puzzleID !== null));
        });
    });
}


 function getSolved(userId) {
    return new Promise(function (resolve, reject) {
        const SQL = `SELECT pt.puzzleID, pt.puzzleType, pt.puzzleName, pt.likes, pt.userID as authorID, U.username as author
            FROM Puzzles pt, PuzzlesSolved upc
            JOIN Users U on pt.userID = U.userID
            WHERE pt.puzzleID = upc.puzzleID AND upc.userID=?;`

        db.all(SQL, [userId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

function getLiked(userId) {
    return new Promise(function (resolve, reject) {
        const SQL = `SELECT pt.puzzleID, pt.puzzleType, pt.puzzleName, pt.likes, pt.userID as authorID, U.username as author
            FROM Puzzles pt, PuzzlesLiked ulc 
            JOIN Users U on pt.userID = U.userID
            WHERE pt.puzzleID = ulc.puzzleID AND ulc.userID=?;`;

        db.all(SQL, [userId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}


function getComments(userId) {
    return new Promise(function (resolve, reject) {
        const SQL = `SELECT pct.reviews, pct.commentID, pt.puzzleID, pt.puzzleType, pt.puzzleName, pt.likes, pt.userID as authorID, U.username as author
            FROM Puzzles pt, PuzzlesComments pct
            JOIN Users U on pt.userID = U.userID
            WHERE pt.puzzleID = pct.puzzleID AND pct.userID = ?;`

        db.all(SQL, [userId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

/**
 * Updates the recentPuzzlePlayedID column for the user with the specified ID
 * @param {*} userId
 * @param {*} puzzleId
 */
function updateRecent(userId, puzzleId) {
    return new Promise(function (resolve, reject) {
        const SQL = "UPDATE Users " +
            "SET recentlyPlayedPuzzle = ? " +
            "WHERE userID = ?;"

        db.run(SQL, [puzzleId, userId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

function getRecent(userId) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT ut.recentlyPlayedPuzzle " +
            "FROM Users ut " +
            "WHERE ut.userID = ?;"

        db.all(SQL, [userId], (err, data) => {
            if (err) return reject(err);

            const SQL2 = "SELECT puzzleID, puzzleType " +
            "FROM Puzzles " +
            "WHERE puzzleID = ?;"
            db.all(SQL2, [data[0].recentlyPlayedPuzzle], (err2, data2) =>{
                if (err2) return reject(err2);

                resolve(data2);
            })
        });
    });
}

/**
 * Retrieves external info for a given user id.
 * external info is related to OAuth2/Other servers and only exists for users from other servers.
 * @param userId
 * @returns {Promise<unknown>}
 */
function getExternal(userId) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT * FROM ExternalUsers WHERE userID=?"

        db.get(SQL, [userId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

async function getAllUsers () {
    const SQL = `SELECT Users.userID, Users.username, Users.email, Users.permission, ExternalUsers.externalID, ExternalUsers.groupID FROM Users
                                                                                                                                              LEFT OUTER JOIN ExternalUsers ON Users.userID = ExternalUsers.userID`
    return new Promise(function (resolve, reject) {
        db.all(SQL, (err, data) => {
            if (err) return reject(err);

            if (data) {
                // move groupID/external id to a separate object, if they exist. Just cleaner.
                // They will be null for internal users, so we need to delete the properties anyway.
                const mappedData = data.map(({userID, email, permission, username, groupID, externalID}) => {
                    return {
                        userID,
                        email,
                        permission,
                        username,
                        external: groupID ? {
                            externalID: externalID,
                            groupID: groupID
                        } : undefined
                    };
                });

                resolve(mappedData);

            }
        });
    });
}
// returns META DATA ONLY for all puzzles
async function getAllPuzzles (forId) {
    const SQL = `SELECT Puzzles.puzzleID, puzzleName, likes, Puzzles.points, difficultyLevel, avgUserDifficulty, Puzzles.puzzleType, Users.username as authorName
                     ${forId ? `, EXISTS(SELECT PS.userID FROM PuzzlesSolved PS WHERE PS.userID = ? AND PS.puzzleID = Puzzles.puzzleID) as userHasCompleted`:""}
                 FROM Puzzles
                          JOIN Users ON Puzzles.userID = Users.userID`;

    return new Promise(function (resolve, reject) {
        db.all(SQL, [forId], (err, data) => {
            if (err) return reject(err);

            if (data) {
                resolve(data);

            }
        });
    });
}


async function updateUser(user) {
    return new Promise(function (resolve, reject) {
        const {username, email, password, permission, userID} = user;

        const basicSQL = `UPDATE Users SET username = ?, email = ?, permission = ? WHERE userID = ?`;
        const passwordSQL = `UPDATE Users SET username = ?, email = ?, permission = ?, password=? WHERE userID = ?`

        const params = [username, email, permission];

        if (password) {
            params.push(password);
        }

        params.push(userID)

        db.run(password ? passwordSQL : basicSQL, params,(err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

function userHasLiked(puzzleId, userId) {
    return new Promise(function (resolve, reject) {
        const SQL = `SELECT isDislike FROM PuzzlesLiked WHERE puzzleID = ? AND userID = ?;`;


        db.get(SQL, [puzzleId, userId],(err, data) => {
            if (err) return reject(err);

            resolve(data);

        });
    });
}

function getLikes(puzzleId) {
    return new Promise(function (resolve, reject) {
        const SQL = `SELECT SUM(isDislike + 0) as dislikes, SUM(1 - isDislike) as likes
                     FROM PuzzlesLiked WHERE puzzleID=?;`;


        db.get(SQL, [puzzleId],(err, data) => {
            if (err) return reject(err);

                resolve({
                    likes: data.likes || 0,
                    dislikes: data.dislikes || 0
                })

        });
    });
}

async function updatePuzzle(puzzle) {
    return new Promise(function (resolve, reject) {
        const {puzzleID, difficultyLevel, avgUserDifficulty, puzzleType, puzzleName} = puzzle;

        const SQL = `UPDATE Puzzles SET puzzleType=?, puzzleName=?, avgUserDifficulty=?, difficultyLevel=? WHERE puzzleID=?`;


        db.run(SQL, [puzzleType, puzzleName, avgUserDifficulty, difficultyLevel, puzzleID],(err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

async function deleteUser (userId) {
    return new Promise(function (resolve, reject) {
        const SQL = `DELETE FROM Users WHERE userID=?;`

        db.run(SQL, [userId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}


async function deletePuzzle (puzzleId) {
    return new Promise(function (resolve, reject) {
        const SQL = `DELETE FROM Puzzles WHERE puzzleID=?;`

        db.run(SQL, [puzzleId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

async function getQuests (userId, offset = 0, number = 50) {
    return new Promise(function (resolve, reject) {
        const getQuestQuery = `SELECT questName, questID, U.username, U.userID FROM PuzzleQuest
                                                                                        JOIN Users U on U.userID = PuzzleQuest.userID
                               ORDER BY PuzzleQuest.questID LIMIT ? OFFSET ?;`

        db.all(getQuestQuery, [number, offset],  (err, data) => {
            if (err) return reject(err);
            const promises = [];

            for (const d of data) {
                promises.push(_getPuzzQuest(d.questID, userId, {questName: d.questName, authorName: d.username, authorID: d.userID}));
            }


            Promise.all(promises)
                .then(resolve)
                .catch(reject);
        });
    });
}

async function getQuestsByUser (userId, offset = 0, number = 50) {
    return new Promise(function (resolve, reject) {
        const getQuestQuery = `SELECT questName, questID, U.username, U.userID FROM PuzzleQuest
                               JOIN Users U on U.userID = PuzzleQuest.userID
                               WHERE PuzzleQuest.userID = ?
                               ORDER BY PuzzleQuest.questID LIMIT ? OFFSET ?;`

        db.all(getQuestQuery, [userId, number, offset],  (err, data) => {
            if (err) return reject(err);
            const promises = [];

            for (const d of data) {
                promises.push(_getPuzzQuest(d.questID, userId, {questName: d.questName, authorName: d.username, authorID: d.userID}));
            }


            Promise.all(promises)
                .then(resolve)
                .catch(reject);
        });
    });
}

async function getQuestCount (userId) {
    return new Promise(function (resolve, reject) {
        const getQuestQuery = `SELECT COUNT(*) as count
                               FROM PuzzleQuest${userId ? ` WHERE userID = ?;`: ";"}`

        db.get(getQuestQuery, [userId || undefined],(err, data) => {
            if (err) return reject(err);
            resolve(data ? data.count : 0);
        });
    });
}

function getQuest(questId, userId) {
    questId = parseInt(questId);
    return new Promise(function (resolve, reject) {
        const getQuestQuery = `SELECT questName, U.username, U.userID FROM PuzzleQuest
                                                                               JOIN Users U on U.userID = PuzzleQuest.userID
                               WHERE questID=?`

        db.get(getQuestQuery, [questId], (err, data) => {
            if (err) return reject(err);
            if (!data) return  resolve(null);

            _getPuzzQuest(questId, userId,{questName: data.questName, authorName: data.username, authorID: data.userID})
                .then(resolve)
                .catch(reject);
        });
    });
}

// Bit of a complicated one here. Gets a puzzle that is part of a quest.
// User id is used to provide a field which indicates if the user has solved it.
async function _getPuzzQuest (questId, userId, extraData = {}) {
    return new Promise(function (resolve, reject) {
        const getPuzzSQL = `SELECT questID, P.puzzleID, P.puzzleName, P.avgUserDifficulty, P.difficultyLevel as difficulty,
                                   P.hasBeenCompleted, P.puzzleType, U.username as authorname,
                                   EXISTS(SELECT PS.userID FROM PuzzlesSolved PS WHERE PS.userID = ? AND PS.puzzleID = P.puzzleID) as userHasCompleted
                            FROM PuzzleQuestPart
                                     JOIN Puzzles P on P.puzzleID = PuzzleQuestPart.puzzleID
                                     JOIN Users U on P.userID = U.userID
                            WHERE PuzzleQuestPart.questID = ? ORDER BY PuzzleQuestPart.position;`

        db.all(getPuzzSQL, [userId, questId], (err, data) => {
            if (err) return reject(err);

            data = data.map(p => ({type: typeToString(p.puzzleType), ...p}))

            return resolve({
                questId,
                ...extraData,
                puzzles: data || []
            });
        });
    });
}


function getPuzzleComments (puzzleId) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT PuzzlesComments.*, Users.username FROM PuzzlesComments, Users WHERE puzzleID=? AND PuzzlesComments.userID = Users.userID"

        db.all(SQL, [puzzleId], (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

function getPuzzle (puzzleId) {
    return new Promise(function (resolve, reject) {
        const SQL = "SELECT Puzzles.* FROM Puzzles WHERE puzzleID = ?"

        db.get(SQL, [puzzleId], (err, data) => {
            if (err) return reject(err);

            if (data.puzzlesUnsolved) {
                data.puzzlesUnsolved = stringPuzzleToNumbers(data.puzzlesUnsolved);
            }

            resolve(data);
        });
    });
}

function createQuest (questName, userId) {
    return new Promise(function (resolve, reject) {
        const SQL = "INSERT INTO PuzzleQuest (questName, userID) VALUES (?, ?);";

        db.run(SQL, [questName, userId], function (err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
    });
}

function deleteQuest (questId) {
    return new Promise(function (resolve, reject) {
        const SQL = "DELETE FROM PuzzleQuest WHERE questID=?;";

        db.run(SQL, [questId], function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

function addPuzzlesToQuest (questId, puzzles) {
    const promises = [];

    for (let c = 0; c < puzzles.length; c++) {
        promises.push(_addPuzzleToQuest(questId, puzzles[c], c));
    }

    return Promise.all(promises);
}

function _addPuzzleToQuest (questId, puzzleId, position) {
    return new Promise(function (resolve, reject) {
        const SQL = "INSERT INTO PuzzleQuestPart (questID, puzzleID, position) VALUES (?, ?, ?);";
        db.run(SQL, [questId, puzzleId, position], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

module.exports = {
    db,
    getUserFromToken,
    storeOAuthToken,
    createOAuthUser,
    getUserFromFedToken,
    getByEmailOrUsername,
    getUserById,
    getComments,
    getCreations,
    getSolved,
    updateRecent,
    getRecent,
    getLiked,
    getExternal,
    getPuzzleComments,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllPuzzles,
    getPuzzle,
    deletePuzzle,
    getLikes,
    userHasLiked,
    updatePuzzle,

    getQuests,
    getQuestCount,
    createQuest,
    addPuzzlesToQuest,
    getQuest,
    deleteQuest,
    getQuestsByUser,
    getComment
}