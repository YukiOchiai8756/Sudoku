const express = require("express");
const auth = require("../middleware/auth");
const {db} = require("../util/db");
const router = express.Router();
const {isSolvable, isStandard, getSolution} = require("../util/solver");
const {HttpError, wrapHandler} = require('../util/error');
const {stringPuzzleToNumbers} = require("../util");

const BASIC_SUDOKU = 1;
const SUDOKU_SIZE_VARIANT = 2;


async function getPuzzleCount() {
    const sqlCount = "SELECT COUNT(*) FROM Puzzles";
    const count = await new Promise((resolve, reject) => {
        db.get(sqlCount, [], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row["COUNT(*)"]);
            }
        });
    });
    return count;
}



const puzzleValid = (puzzle) => {

    // 17 hints thing only relevant for 9x9 so REMOVED

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
    return true;

}

const insertImportedPuzzle = (difficultyLevel, puzzleType, puzzleName, puzzlesUnsolved, puzzleSolved, userId,points) => {
    let sql = 'INSERT INTO Puzzles(difficultyLevel, puzzleType, puzzleName, likes, puzzlesUnSolved, puzzleSolved, points, avgUserDifficulty, userID) values(?,?,?,?,?,?,?,?, ?);';
    // Check that user is authorised to upload puzzles first


    // Check that sudoku is valid
    if (puzzleType in [BASIC_SUDOKU, SUDOKU_SIZE_VARIANT] && !puzzleValid(puzzlesUnsolved)) {
        throw Error("Puzzle invalid");
    }
    // Lights out validation if puzzleType = LIGHTS_OUT

    let lastID;

    db.run(sql, [difficultyLevel, puzzleType, puzzleName, 0, JSON.stringify(puzzlesUnsolved), JSON.stringify(puzzleSolved),points, difficultyLevel, userId], function (err) {
        if (err) {
            throw err;
        }
    });


}

router.post("/importPuzzle", auth, wrapHandler(async (req, res) => {
    // Will need some puzzle validation
    const count = await getPuzzleCount();
    const puzzleName = "Puzzle " + (count + 1);

    if (req.body.puzzleType === BASIC_SUDOKU) {
        req.body.puzzlesUnsolved = stringPuzzleToNumbers(req.body.puzzlesUnsolved);
        if (!isStandard(req.body.puzzlesUnsolved)) throw new HttpError(400, "BadPuzzle", "A basic puzzle must be 9x9.");
        if (!await isSolvable(req.body.puzzlesUnsolved)) throw new HttpError(400, "UnsolvablePuzzle", "That puzzle cannot be solved.");

        req.body.puzzleSolved = await getSolution(req.body.puzzlesUnsolved);
    }

    try {
        insertImportedPuzzle(0,req.body.puzzleType,puzzleName, req.body.puzzlesUnsolved,req.body.puzzleSolved || "null", req.user.userID,0);
        res.send({"message": "Puzzle inserted"});
    } catch (err) {
        res.status(501);
        res.send({"message": err.message});
    }

    // If all ok send response
}));

module.exports = router;