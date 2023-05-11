const workerpool = require('workerpool');
const {makepuzzle, ratepuzzle, solvepuzzle} = require("sudoku");

workerpool.worker({
    makepuzzle,
    ratepuzzle,
    solvepuzzle
});