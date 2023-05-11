const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { db, getPuzzleComments, getAllPuzzles, getPuzzle, deletePuzzle, updatePuzzle, getLiked, getLikes, getComment,
    userHasLiked
} = require("../util/db");
const { HttpError, wrapHandler } = require('../util/error');
const { isSolvable, isStandard, getSolution } = require("../util/solver");
const { PERMISSION, stringPuzzleToNumbers } = require("../util");

// Puzzle types
const BASIC_SUDOKU = 1;
const SUDOKU_SIZE_VARIANT = 2;
const LIGHTS_OUT = 3;


router.get("/", wrapHandler(async (req, res) => {
    const d = await getAllPuzzles(req.params.id);
    res.send(d);
}));

const updateAverageUserDifficulty = (puzzleID) => {

    let ls = [];

    let sql = "SELECT puzzleDifficultyRating FROM PuzzlesSolved WHERE puzzleID = ?";

    db.all(sql, [puzzleID], (err, rows) => {
        if (err) {
            console.log("FAILED TO GET USER DIFFICULTY RATINGS FOR THIS PUZZLE : (");
        } else {
            rows.forEach(element => {
                let x = element.puzzleDifficultyRating;
                if (x > 0 && x < 6) ls.push(parseInt(x));
            });
        }
        let avg = 0;
        if (ls.length > 0) {
            for (let i = 0; i < ls.length; i++) avg += ls[i];
            avg /= ls.length;
            avg = Math.round(avg);
            // Write avg to the database

            let sqlInsert = "UPDATE Puzzles SET avgUserDifficulty = ? WHERE puzzleID = ?;"
            db.run(sqlInsert, [avg, puzzleID], (err) => {
                if (err) {
                    throw new Error('COULD NOT UPDATE PUZZLES DIFFICULTY');
                }
            })

            let sqlUpdatePoints = "";
        }

    });
}

/**
 * Gets list of sudokus but provides author name
 */
router.get("/list", (req, res) => {

    let puzzleList = [];

    let difficulty = parseInt(req.query['difficulty']);
    let username = req.query['username'];
    let puzzleID = req.query['puzzleID'];


    // QUERY BUILDER

    let queryParams = [];

    if (username !== '' && username !== undefined) queryParams.push(["Users.username", username]);
    if (!isNaN(difficulty) && difficulty <= 0 && difficulty >= 6) queryParams.push(["Puzzles.difficultyLevel", difficulty]);
    if (puzzleID !== undefined) queryParams.push(["Puzzles.puzzleID", puzzleID]);

    let query = "";
    if (queryParams.length > 0) {
        query += "WHERE";
        for (let i = 0; i < queryParams.length; i++) {
            query += `\ ${queryParams[i][0]} = ?`;
            if (i < queryParams.length - 1) {
                query += ' AND ';
            }
        }
        query += ";";
    }

    let sql = `SELECT Puzzles.*, Users.userID, Users.username
               FROM Puzzles
                        INNER JOIN Users
                                   ON Users.userID = Puzzles.userID
                   ${query}`;


    db.all(sql, queryParams.map(x => x[1]), (err, rows) => {
        if (err) {
            throw new Error(err.message || err);
        }
        rows.forEach(element => {
            let puzzle = {};
            // TO DO: add userid field to database
            puzzle.sudokuid = element.puzzleID;
            puzzle.difficulty = element.difficultyLevel;
            puzzle.avgUserDifficulty = element.avgUserDifficulty;
            puzzle.authorid = element.userID;
            puzzle.authorname = element.username;
            puzzle.puzzle = element.puzzlesUnSolved;
            puzzle.puzzleName = element.puzzleName;
            puzzle.hasBeenCompleted = element.hasBeenCompleted;
            puzzle.puzzleType = element.puzzleType;
            puzzleList.push(puzzle)
        });
        res.status(200);
        res.send(puzzleList);

    });
});

const puzzleValid = (puzzle) => {

    let gridSize = Math.round(Math.sqrt(puzzle.length));
    let cells = puzzle.flat();
    // Check that 9x9 sudokus have 17 hints
    if(gridSize === 3 && cells.filter(c => c !== 0) < 17) return false;
    // Check that sudoku isn't full
    if(cells.filter(c => c !== 0).length === 0) return false;

    // Check that sudoku isn't empty
    if(cells.filter(c => c === 0).length === 0) return false;

    // Only accept puzzles size 2,3,4
    if(!(gridSize === 2 || gridSize === 3 || gridSize === 4)){
        return false;
    }

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
    return true;

}


const insertPuzzle = (difficultyLevel, puzzleType, puzzleName, puzzlesUnsolved, puzzleSolved, userId, points) => {
    let sql = 'INSERT INTO Puzzles(difficultyLevel, puzzleType, puzzleName, likes, puzzlesUnSolved, puzzleSolved, points, avgUserDifficulty, userID) values(?,?,?,?,?,?,?,?, ?);';
    // Check that user is authorised to upload puzzles first

    puzzlesUnsolved = stringPuzzleToNumbers(puzzlesUnsolved);


    // Check that sudoku is valid
    if (puzzleType in [BASIC_SUDOKU, SUDOKU_SIZE_VARIANT] && !puzzleValid(puzzlesUnsolved)) {
        throw Error("Puzzle invalid");
    }
    // Lights out validation if puzzleType = LIGHTS_OUT

    let lastID;

    db.run(sql, [difficultyLevel, puzzleType, puzzleName, 0, JSON.stringify(puzzlesUnsolved), JSON.stringify(puzzleSolved), points, difficultyLevel, userId], function (err) {
        if (err) {
            throw err;
        }
    });


}

const addUserPoints = (puzzleID, userID) => {
    let sql = 'UPDATE Users\n' +
        'SET points = Users.points + Puzzles.points\n' +
        'FROM Puzzles\n' +
        'WHERE Puzzles.hasBeenCompleted = 1\n' +
        '  AND Users.recentlyPlayedPuzzle = Puzzles.puzzleID\n' +
        '  AND Users.userID = ?\n' +
        '  AND Puzzles.puzzleID = ?;'
    db.run(sql, [userID, puzzleID], function (err) {
        if (err) throw err;
    });
}

const boardIsFull = (rows) => {
    // Loop through each cell, checking if its value is 0.
    for (let row of rows) {
        for (let cell of row) {
            if (cell === 0) {
                return false;
            }
        }
    }
    return true;
}

const validSolution = (rows) => {
    if (boardIsFull(rows)) {
        // Check rows
        let gridSize = Math.sqrt(rows.length);
        for (let row of rows) {
            // Contains[x-1] = true if x is contained in the row.
            let contains = Array((gridSize * gridSize)).fill(false);
            for (let cell of row) {
                if (cell >= 1 && cell <= (gridSize * gridSize)) {
                    contains[cell - 1] = true;
                }
            }
            // If row does not contain one of the numbers 1-9, then return false.
            if (contains.includes(false)) {
                return false;
            }
        }

        // Check columns
        for (let row_num in rows) {
            // Contains[x-1] = true if x is contained by the column
            let contains = Array((gridSize * gridSize)).fill(false);
            for (let cell_num in rows[row_num]) {
                let cell = rows[cell_num][row_num];
                if (cell >= 1 && cell <= (gridSize * gridSize)) {
                    contains[cell - 1] = true;
                }
            }
            // If column does not contain one of the numbers 1-9, then return false.
            if (contains.includes(false)) {
                return false;
            }
        }

        // Sub-grids
        for (let x = 0; x < (gridSize * gridSize); x += gridSize) {
            for (let y = 0; y < (gridSize * gridSize); y += gridSize) {
                // Contains[x-1] = true if x is contained by the sub-grid
                let contains = Array((gridSize * gridSize)).fill(false);
                for (let i = x; i <= x + (gridSize - 1); i++) {
                    for (let j = y; j <= y + (gridSize - 1); j++) {
                        let cell = rows[j][i];
                        if (cell >= 1 && cell <= (gridSize * gridSize)) {
                            contains[cell - 1] = true;
                        }
                    }
                }
                // If sub-grid does not contain one of the numbers 1-9, then return false.
                if (contains.includes(false)) {
                    return false;
                }
            }
        }

        // If false hasn't already been returned, solution must be valid.
        return true;
    }
    return false;
}



router.get("/:id/comments", wrapHandler(async (req, res) => {

    let id = req.params['id'];
    // Get puzzle id row from db

    res.send(await getPuzzleComments(id));
}));

router.get("/:id/likes", auth, wrapHandler(async (req, res) => {

    let id = req.params['id'];
    // Get puzzle id row from db

    const likes = getLikes(id);
    const userLikes = userHasLiked(id, req.user.userID);

    // bit of promise magic to do both queries at once
    const obj = await likes;
    obj.userHasLiked = await userLikes;

    res.send(obj);
}));


// BEGIN AUTHENTICATED ROUTES
router.use(auth);

/**
 * Makes record when user solves sudoku: also checks if sudoku has been solved on the backend.
 */
router.post("/:id/solved", (req, res, next) => {
    let id = req.params.id;
    let difficulty_rating = parseInt(req.body.userDifficultyRating);
    if (parseInt(difficulty_rating) < 0 || parseInt(difficulty_rating) > 3) difficulty_rating = 0;

    let sql = "SELECT * From Puzzles WHERE PuzzleID = ?";

    // Get the sudoku of this id from the database

    db.get(sql, id, (err, row) => {
        if (err) {
            next(new HttpError(400, "InvalidSolution", "Sudoku solution not valid"))
        } else {
            try {

                let dbRows = row['puzzlesUnsolved'];
                let subRows = req.body.data;

                // Check the solution
                if(req.body.puzzleType in [BASIC_SUDOKU, SUDOKU_SIZE_VARIANT]){
                    if (!validSolution(subRows)) {
                        return next(new HttpError(400, "InvalidSolution", "Sudoku solution not valid"))
                    }
                }

                if(req.body.puzzleType === LIGHTS_OUT){
                    let valid = false
                    puzzle.map(a =>(a.map(b => (b ? valid = true : ''))))
                    if(!valid)
                        return next(new HttpError(400, "InvalidSolution", "Lights out solution not valid"))
                }

                // Check that it matches the provided solution

                for (let i in dbRows) {
                    for (let j in i) {
                        if (subRows[i][j] !== 0 && subRows[i][j] !== dbRows[i][j]) {
                            return next(new HttpError(400, "NotMatch", "Sudoku solution does not match existing solution"))
                        }
                    }
                }


                // Delete last win

                let sqlDelete = "DELETE FROM PuzzlesSolved WHERE userID = ? AND puzzleID = ?";

                const userId = req.user.userID;

                db.run(sqlDelete, [userId, id], function (err) {
                    if (err) {
                        return next(err);
                    }
                });

                let sqlInsert = "INSERT INTO PuzzlesSolved(userID, puzzleID, puzzleDifficultyRating) values(?,?,?);";
                // Insert win
                db.run(sqlInsert, [userId, id, difficulty_rating], function (err) {
                    if (err) return next(err);

                    // Update average in Puzzles
                    updateAverageUserDifficulty(id);
                });


                db.run(`UPDATE Puzzles SET hasBeenCompleted = 1 WHERE puzzleID = ?`, [id], function (err, rows) {
                    console.log("REGISTERED THAT PUZZLE HAS BEEN COMPLETED")
                });

                //add points
                let sqlUpdatePoints = 'UPDATE Users\n' +
                    'SET points = Users.points + Puzzles.points\n' +
                    'FROM Puzzles\n' +
                    'WHERE Puzzles.hasBeenCompleted = 1\n' +
                    '  AND Users.recentlyPlayedPuzzle = Puzzles.puzzleID\n' +
                    '  AND Users.userID = ?\n' +
                    '  AND Puzzles.puzzleID = ?;'
                db.run(sqlUpdatePoints, [userId, id], function (err) {
                    if (err) {
                        return next(err);
                    }
                    addUserPoints(userId, id);
                });



                // If so all good, else, user did not solve the puzzle
                res.status(200);
                res.send({ "message": "Congrats! You solved the puzzle" });


            } catch (err) {
                next(new HttpError(400, "InvalidSolution", "Sudoku solution not valid"));
                console.log(err);
            }
        }
    });


})


/**
 * will store user progress
 */
router.post("/:id/progress", auth, (req, res, next) => {
    let id = req.params.id;
    let difficulty_rating = parseInt(req.body.userDifficultyRating);
    console.log(difficulty_rating);
    if (parseInt(difficulty_rating) < 0 || parseInt(difficulty_rating) > 3) difficulty_rating = 0;
    console.log(difficulty_rating);

    let sql = "SELECT * From Puzzles WHERE PuzzleID = ?";

    // Get the sudoku of this id from the database

    db.get(sql, id, (err, row) => {
        if (err) {
            res.status(400);
            res.send({ "message": "Sudoku progress not valid" });
        } else {
            try {


                let dbRows = JSON.parse(row['puzzlesUnSolved']);
                let puzzleType = parseInt(row['puzzleType'])
                let subRows = req.body.data;
                // Check the solution
                if (puzzleType === LIGHTS_OUT || !validSolution(subRows)) {
                    // Store in Puzzle Progress !!!!! (if valid progress)
                    // Check that all 0s in db puzzle are present in progresss
                    if(puzzleType in [BASIC_SUDOKU, SUDOKU_SIZE_VARIANT]){
                    for (let i = 0; i < dbRows.length; i++) {
                        for (let j = 0; j < dbRows[i].length; j++) {
                            if (subRows[i][j] === 0 && dbRows[i][j] !== 0) {
                                return next(new HttpError(400, "BadPuzzle"));
                            }
                        }
                    }
                }
                    // Write to db
                    // Delete last progress

                    let sqlDelete = "DELETE FROM PuzzlesProgress WHERE userID = ? AND puzzleID = ?";


                    let userID = req.user.userID;

                    db.run(sqlDelete, [userID, id], function (err, rows) {
                        console.log("DONE DELETED LAST PROGRESS");
                        if (err) {
                            console.log("NO PROGRESS TO DELETE : )");
                        }

                        let sqlInsert = "INSERT INTO PuzzlesProgress(userID, puzzleID, puzzleProgress) values(?,?,?);";
                        // Insert progress
                        db.run(sqlInsert, [userID, id, JSON.stringify(subRows)], function (err, rows) {
                            console.log("DONE INSERTED NEW PROGRESS");
        
                        });
                    });
                }

                // If so all good, else, user did not store the puzzle
                res.status(200);
                res.send({ "message": "STORED PROGRESS" });


            } catch (err) {
                res.status(400);
                res.send({ "message": "Sudoku progress not valid" });
                console.log(err);
            }
        }
    });


})




/**
 * Returns a Puzzle:
 * name
 * ...
 * rows: Row[]
 */
router.get("/:id", wrapHandler(async (req, res, next) => {
    let id = req.params['id'];
    // Get puzzle id row from db

    let sql = `SELECT Puzzles.*, PP.puzzleProgress FROM Puzzles
                    LEFT JOIN PuzzlesProgress PP on Puzzles.puzzleID = PP.puzzleID AND PP.userID=?
               WHERE Puzzles.PuzzleID =?`;


    // GET PUZZLE PROGRESS
    const likes = await getLikes(id);

    db.get(sql, [req.user.userID, id], (err, data) => {
        if (err) {
            next(err);
        } else {

            if (!data) return next(new HttpError(404, "PuzzleNotFound", "Could not find sudoku"));
            const puzzle = likes || {};
            puzzle['data'] = JSON.parse(data['puzzlesUnSolved']);
            puzzle['name'] = data['puzzleName'];
            puzzle["progress"] = data.puzzleProgress ? JSON.parse(data.puzzleProgress) : undefined;
            res.status(200);
            res.send(puzzle);
        }
    });
}));

// Inserts sudoku into the database
router.post("/create", wrapHandler(async (req, res) => {
    // Will need some puzzle validation

    let solution = "";
    // Check that puzzle has a name
    try{
        if(req.body.puzzleName.trim() === "") throw new Error();
    }
    catch{
        throw new HttpError(400, "BadPuzzle", "A puzzle must have a name.");
    }

    if (req.body.puzzleType === BASIC_SUDOKU) {
        if (!isStandard(req.body.puzzlesUnsolved)) throw new HttpError(400, "BadPuzzle", "A basic puzzle must be 9x9.");
        if (!await isSolvable(req.body.puzzlesUnsolved)) throw new HttpError(400, "UnsolvablePuzzle", "That puzzle cannot be solved.");
        solution = await getSolution(req.body.puzzlesUnsolved);
    }

    //Check lights out has lights on
    if (req.body.puzzleType === LIGHTS_OUT) {
        let puzzle = {};
        puzzle = req.body.puzzlesUnsolved

        let valid = false
        puzzle.map(a =>(a.map(b => (b ? valid = true : ''))))
        if(!valid)
            throw new HttpError(400, "Empty Lightsout", "A lights out puzzle must have some lights on")
    }

    try {
        insertPuzzle(req.body.difficultyLevel, req.body.puzzleType, req.body.puzzleName, req.body.puzzlesUnsolved, solution, req.user.userID, req.body.points);
        res.send({ "message": "Puzzle inserted" });
    } catch (err) {
        res.status(501);
        res.send({ "message": err.message });
    }

    // If all ok send response
}));

//displays the comments


// Inserts comments into database
router.post("/:id/insertComments", (req, res, next) => {
    const sql = 'INSERT INTO PuzzlesComments(puzzleID,userID,reviews,parentID,createdAt) values(?,?,?,?,?);';

    const at = new Date();

    if (!req.body.reviews || req.body.reviews.trim() === "") throw new HttpError(400, "InvalidComment");

    // Check that user is authorised to upload puzzles first
    db.run(sql, req.params.id, req.user.userID, req.body.reviews, req.body.parentID || null, at.toISOString(), (err) => {
        if (err) {
            return next(err);
        }

        const getComment = `SELECT * FROM PuzzlesComments WHERE reviews=? AND userID=? AND puzzleID=?;`
        db.get(getComment, [req.body.reviews, req.user.userID, req.params.id], (err, comment) => {
            if (err) {
                return next(err);
            }
            res.send(comment);

        });
    });



});

router.delete("/:id/comment/:commentId", wrapHandler(async (req, res, next) => {
    const commentId = req.params.commentId;

    if (isNaN(commentId)) throw new HttpError(400, "InvalidCommentID");

    const comment = await getComment(commentId);

    if (!comment) {
        throw new HttpError(404, "NotFound", "Invalid comment id");
    }

    if (comment.userID !== req.user.userID && req.user.permission === PERMISSION.User) {
        throw new HttpError(403, "Forbidden", "You can only delete your own comments unless you are a moderator or administrator.")
    }

    let sql = 'DELETE FROM PuzzlesComments WHERE commentID = ?';

    db.run(sql, commentId, (err) => {
        if (err) {
            return next(err);
        }

        res.send({ "message": "Comments deleted from the puzzle" })
    });
}));

router.patch("/:id/comment/:commentId", wrapHandler(async (req, res, next) => {
    const commentId = req.params.commentId;

    if (isNaN(commentId)) throw new HttpError(400, "InvalidCommentID");

    const comment = await getComment(commentId);

    if (!comment) {
        throw new HttpError(404, "NotFound", "Invalid comment id");
    }

    if (comment.userID !== req.user.userID && req.user.permission === PERMISSION.User) {
        throw new HttpError(403, "Forbidden", "You can only delete your own comments unless you are a moderator or administrator.")
    }

    let sql = 'UPDATE PuzzlesComments SET reviews = ? WHERE commentID=?';
    db.run(sql, req.body.reviews, commentId, (err) => {
        if (err) {
            return next(err);
        }
    })


    // If all ok send response
    res.send(await getComment(commentId));
}));

/**
 * Supports liking and disliking puzzles, and overwriting a previous like/dislike, if there is one.
 * @param puzzleId Puzzle to like
 * @param userId User id of user performing like
 * @param isDislike boolean indicating if this is a dislike, rather than a like. Defaults to false (like)
 * @returns {Promise<void>}
 */
async function likePuzzle(puzzleId, userId, isDislike = false) {

    const createdAt = (new Date()).toDateString();

    const existsSql = `SELECT puzzleID, isDislike FROM PuzzlesLiked WHERE puzzleID = ? AND userID = ?;`;
    db.get(existsSql, [puzzleId, userId], (err, res) => {
        if (err) {
            throw err;
        }
        if (res) {
            if (res.isDislike !== isDislike) {
                // Update
                const sql = "UPDATE PuzzlesLiked SET createdAt=?, isDislike=? WHERE userID=?;";
                db.run(sql, [createdAt, isDislike, userId], (err) => {
                    if (err) {
                        throw err;
                    }
                });
            }
        } else {
            // Insert
            const sql = "INSERT INTO PuzzlesLiked(puzzleID,userID,createdAt, isDislike) values(?,?,?,?)";
            db.run(sql, [puzzleId, userId, createdAt, isDislike], (err) => {
                if (err) {
                    throw err;
                }
            });
        }
    });
}

/**
 * Unlike puzzle - removes any like for that puzzle, from a given user. Does not matter if like or dislike.
 * @param puzzleId
 * @param userId
 * @returns {Promise<void>}
 */
async function unlikePuzzle(puzzleId, userId) {

    const sql = "DELETE FROM PuzzlesLiked WHERE puzzleID = ? AND userID = ?;";
    db.run(sql, [puzzleId, userId], (err) => {
        if (err) {
            throw err;
        }
        return true;
    });
}

router.post("/:id/like", wrapHandler(async (req, res) => {
    const puzzle = await getPuzzle(req.params.id);
    if (!puzzle) throw new HttpError(404, "PuzzleNotFound", "Invalid puzzle id - not found");

    await likePuzzle(req.params.id, req.user.userID, false);


    // If all ok send response
    res.send({ "message": "Puzzle liked" })
}));

router.post("/:id/unlike", wrapHandler(async (req, res) => {
    const puzzle = await getPuzzle(req.params.id);
    if (!puzzle) throw new HttpError(404, "PuzzleNotFound", "Invalid puzzle id - not found");

    await unlikePuzzle(req.params.id, req.user.userID);


    // If all ok send response
    res.send({ "message": "Puzzle no longer liked" })
}));


router.post("/:id/dislike", wrapHandler(async (req, res) => {
    const puzzle = await getPuzzle(req.params.id);
    if (!puzzle) throw new HttpError(404, "PuzzleNotFound", "Invalid puzzle id - not found");

    await likePuzzle(req.params.id, req.user.userID, true);


    // If all ok send response
    res.send({ "message": "Puzzle disliked" })
}));

// BEGIN PUZZLE MANAGEMENT
router.use("/:id", (req, _res, next) => {
    if (req.user.permission === PERMISSION.Admin) {
        return next();
    }
    next(new HttpError(403, "Forbidden", "Only an admin can update puzzles"));
})
router.patch("/:id", wrapHandler(async (req, res) => {
    // Edit puzzle
    const { difficultyLevel, avgUserDifficulty, puzzleType, puzzleName } = req.body;
    const currentPuzzle = await getPuzzle(req.params.id);

    if (!currentPuzzle) throw new HttpError(404, "NotFound", "Puzzle does not exist");
    const newValues = {
        difficultyLevel: currentPuzzle.difficultyLevel,
        avgUserDifficulty: currentPuzzle.avgUserDifficulty,
        puzzleID: currentPuzzle.puzzleID,
        puzzleType: currentPuzzle.puzzleType,
        puzzleName: currentPuzzle.puzzleName
    }


    let updated = false;
    if (difficultyLevel !== undefined && difficultyLevel !== newValues.difficultyLevel) {
        if (difficultyLevel >= 0 && difficultyLevel <= 3 && Number.isInteger(difficultyLevel)) {
            updated = true;
            newValues.difficultyLevel = difficultyLevel;
        } else throw new HttpError(400, "BadInput", "Difficulty level must be an integer between 0 and 3.")
    }

    if (avgUserDifficulty !== undefined && avgUserDifficulty !== newValues.avgUserDifficulty) {
        if (avgUserDifficulty >= 0 && avgUserDifficulty <= 5 && Number.isInteger(avgUserDifficulty)) {
            updated = true;
            newValues.avgUserDifficulty = avgUserDifficulty;
        } else throw new HttpError(400, "BadInput", "avgUserDifficulty level must be an integer between 0 and 3.")
    }

    if (puzzleName && puzzleName !== newValues.puzzleName) {
        if (puzzleName.length > 0 && puzzleName.length < 50) {
            updated = true;
            newValues.puzzleName = puzzleName;
        } else throw new HttpError(400, "BadInput", "puzzleName must not be empty and be less than 50 characters.")
    }

    if (puzzleType && puzzleType !== newValues.puzzleType) {
        if (puzzleType >= 0 && puzzleType <= 3 && Number.isInteger(puzzleType)) {
            updated = true;
            newValues.puzzleType = puzzleType;
        } else throw new HttpError(400, "BadInput", "puzzleType level must be an integer between 0 and 3.")
    }

    if (updated) {
        await updatePuzzle(newValues);
    }

    res.send(newValues);
}));

router.delete("/:id", wrapHandler(async (req, res) => {
    const puzz = await getPuzzle(req.params.id);

    if (!puzz) {
        throw new HttpError(404, "NotFound", "Puzzle does not exist.");
    }

    if (puzz.userID !== req.user.userID && req.user.permission !== PERMISSION.Admin) {
        throw new HttpError(403, "Forbidden", "Only admins or puzzle creators can delete puzzles.");
    }
    // Delete puzzle
    await deletePuzzle(req.params.id);

    res.send({ message: "Puzzle deleted" });
}));



module.exports = router;
