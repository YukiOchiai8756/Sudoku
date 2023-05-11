/*
    Solver. Uses:
        https://www.npmjs.com/package/sudoku
        https://www.npmjs.com/package/workerpool

    This file exports the following functions:
            isSolvable,
            isStandard,
            getSolution,
            generatePuzzle
    JSDocs are included as you would expect. This file will use workers to complete solving - these are essentially other threads.
    This is because solving sudokus is rather computationally expensive.

 */

const workerpool = require('workerpool');
const pool = workerpool.pool(__dirname + "/worker.js");


/**
 * Higher order function to run a sudoku function using a worker.
 * Assumes all the array arguments are puzzles that need to be converted types.
 * @param func Function to execute
 * @param args OurPuzzle[] - Must be 9x9.
 */
async function run(func, ...args) {
    const convertedArgs = args.map(v => Array.isArray(v) ? ourPuzzleToLibrary(v) : v);

    const result = await pool.exec(func, convertedArgs);

    if (Array.isArray(result)) {
        return libraryToOurPuzzle(result);
    }

    return result;
}

/**
 * Return a boolean indicating whether a given puzzle board is solvable.
 * This function tries to solve the puzzle. If it can, it returns true. Otherwise - false.
 * @param puzzle Our puzzle format (8 Arrays of 8 numbers, with 0 for empty spaces)
 * @returns {Promise<boolean>}
 */
async function isSolvable(puzzle) {
    return !!(await getSolution(puzzle));

}

/**
 * Solves a given puzzle and returns its solution. Returns null if one does not exist.
 * @param puzzle in puzzle format (8 Arrays of 8 numbers, with 0 for empty spaces)
 * @returns {Promise<[]|Error>}
 */
function getSolution(puzzle) {
    if (!puzzle) throw new Error("getSolution with no puzzle");
    return run("solvepuzzle", puzzle);
}

/**
 * Generate a solvable puzzle.
 * @returns {Promise<[]|Error>}
 */
function generatePuzzle() {
    return run("makepuzzle", []);
}

/**
 * Analyse the difficulty of a given puzzle
 * @param puzzle in our puzzle format (8 Arrays of 8 numbers, with 0 for empty spaces)
 * @param samples Number of samples to take. Defaults to 3.
 * @returns {Promise<[]|Error>}
 */
function scorePuzzle(puzzle, samples = 3) {
    return run("ratepuzzle", puzzle, samples);
}


const STANDARD_SIZE = 9;

/**
 * Validates that a given puzzle is a standard 9x9 puzzle, and so can be solved.
 * @param puzzle
 * @returns {boolean}
 */
function isStandard(puzzle) {
    if (!Array.isArray(puzzle)) return false;
    if (puzzle.length !== STANDARD_SIZE) return false;

    for (const row of puzzle) {
        if (!Array.isArray(row)) return false;
        if (row.length !== STANDARD_SIZE) return false;

        for (const i of row) {
            if (typeof i !== "number" || i < 0 || i > STANDARD_SIZE) return false;
        }
    }

    return true;
}

/**
 * Converts one of our puzzle type (9 Arrays of 9, empty is 0) to library type (Flat array with nulls)
 * @param puzzle
 */
function ourPuzzleToLibrary(puzzle) {
    const output = [];
    for (const row of puzzle) {

        for (const v of row) {
            output.push(v === 0 ? null : v - 1);
        }
    }

    return output;
}

/**
 * Converts a library puzzle into one of ours.
 * @param puzzle
 * @returns {*[]}
 */
function libraryToOurPuzzle(puzzle) {
    const fullSize = STANDARD_SIZE * STANDARD_SIZE;
    if (puzzle.length !== fullSize) throw new Error("Not a valid library puzzle");

    const output = [];

    for (let i = 0; i < STANDARD_SIZE; i++) {
        output[i] = [];
    }

    for (let counter = 0; counter < fullSize; counter++) {
        const currentValue = puzzle[counter] == null ? 0 : puzzle[counter] + 1;
        const row = Math.floor(counter / STANDARD_SIZE);

        output[row].push(currentValue);
    }

    return output;
}

function closePool () {
    return pool.terminate(false);
}

module.exports = {
    isSolvable,
    isStandard,
    getSolution,
    generatePuzzle,
    closePool

}