import './css/creator.css';
import React from 'react';
import { DifficultySlider } from './components/DifficultySlider';
import {AlertContext} from "./components/Alert";
import ImportComponent from "./components/ImportComponent";
import 'bootstrap/dist/css/bootstrap.css';
import {Form, FormControl, Button} from 'react-bootstrap';

const validPuzzle = (puzzle) => {
    // Assumes square sudoku

    let gridSize = Math.round(Math.sqrt(puzzle.length));
    let cells = puzzle.flat();
    // Check that 9x9 sudokus have 17 hints
    if (gridSize === 3 && cells.filter(c => c !== 0) < 17) return false;
    // Check that sudoku isn't full
    if (cells.filter(c => c !== 0).length === 0) return false;

    // Check that sudoku isn't empty
    if (cells.filter(c => c === 0).length === 0) return false;


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
        if (contains.filter(x => x > 1).length !== 0) {
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
        if (contains.filter(x => x > 1).length !== 0) {
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
            if (contains.filter(x => x > 1).length !== 0) {
                return false;
            }
        }
    }
    // If false hasn't already been returned, solution must be valid.
    return true;
}

/**
 * Function for posting puzzle to be stored in the database
 * @param {*} difficultyLevel
 * @param {*} puzzleType
 * @param {*} puzzleName
 * @param {*} puzzlesUnsolved
 * @param {*} userID
 * @param {*} createPopup
 */
const sendPuzzle = (difficultyLevel, puzzleType, puzzleName, puzzlesUnsolved, createPopup) => {
    puzzlesUnsolved = puzzlesUnsolved.map(row => row.map(i => typeof i === "string" ? parseInt(i, 10) : i));

    let puzzle = {};
    puzzle.difficultyLevel = difficultyLevel;
    puzzle.puzzleType = puzzleType;
    puzzle.puzzleName = puzzleName;
    puzzle.puzzlesUnsolved = puzzlesUnsolved;
    puzzle.puzzleSolved = "";
    switch (difficultyLevel) {
        case 1:
            puzzle.points = 10;
            break;
        case 2:
            puzzle.points = 20;
            break;
        case 3:
            puzzle.points = 30;
            break;
        case 4:
            puzzle.points = 40;
            break;
        case 5:
            puzzle.points = 50;
            break;
        default:
            puzzle.points = 0;
            break;
    }
    console.log(puzzle.points)

    // Only fetch if frontend validation passes

    if (!validPuzzle(puzzle.puzzlesUnsolved)) {
        createPopup("That puzzle cannot be solved!", "We use a puzzle solver to verify that only valid sudoku puzzles can be submitted to our platform. The puzzle you have submitted is not a valid sudoku puzzle: Please check it and try again.");
        if (puzzle.puzzlesUnsolved.length === 9) createPopup('That puzzle cannot be solved!', "9x9 Sudokus MUST have at least 17 hints")
        return;
    }


    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/Sudoku/create`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(puzzle),
        credentials: "include"
    })
        .then(response => response.json())
        .then(response => {
            if (!response.error) {
                return createPopup("Success", "Your sudoku was successfully uploaded. You can create another, similar puzzle or head to the browse page to see it.")
            } else {
                if (response.error === "UnsolvablePuzzle") {
                    return createPopup("That puzzle cannot be solved!", "We use a puzzle solver to verify that only valid sudoku puzzles can be submitted to our platform. The puzzle you have submitted is not a valid sudoku puzzle: Please check it and try again.")
                }
                throw new Error(response.message || response.error_description || response.error);
            }
        })
        .catch(err => createPopup("Error: Something went wrong.", err.message));
};

/**
 * Returns colour that given cell should be filled so that every sub-grid only touches sub-grids of a different colour.
 * @param {*} x
 * @param {*} y
 * @returns colour (hex-code).
 */
function cellStyle(x, y, gridSize) {

    // Logic for defining "every-other" sub-grid
    if (((x - (x % gridSize)) / gridSize % 2 === 0 && (y - (y % gridSize)) / gridSize % 2 === 0) ||
        ((x - (x % gridSize)) / gridSize % 2 === 1 && (y - (y % gridSize)) / gridSize % 2 === 1)
    ) {
        return 'rgba(0,0,0,0.8)';
    } else {
        return 'rgba(0,0,0,0.5)';
    }
}

/**
 * Component which represents one of the 9x9 cells of the grid.
 * @param {} props
 * @returns cell component.
 */
function Cell(props) {
    // props = {x-position, y-position, value, fixed, pencilled_bool, pencilled_array}
    let x = props.value[0]; // x-position of the cell
    let y = props.value[1]; // y-position of the cell
    let cellID = "Cell" + x + y; // ID of the DOM element representing the cell
    let value = props.value[2]; // Value displayed in the cell.
    let fixed = props.value[3]; // Whether the cell is a hint cell or not.
    let gridSize = props.value[4]; // Size of subgrid

    // If cell is a hint, lower opacity background with bold text. Else, use cellStyle function.
    // 0 represents empty cell, else display the value.

    return (
        <input style={{
            'backgroundColor': !fixed ? cellStyle(x, y, gridSize) : 'rgba(255, 255, 255, 0.75)',
            'fontWeight': fixed ? 'bold' : '',
            'textAlign': 'center',
            'color': !fixed ? 'white' : 'black'
        }} className="Cell" id={cellID}
               defaultValue={value === 0 ? '' : value}
               maxLength={2}
               onKeyPress={(event) => {
                   const allow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
                   if (!allow.includes(event.key)) {
                       event.preventDefault()
                   }
               }}
               onChange={props.onChange}
        />
    );
}

/**
 * Component which represents the whole Sudoku board.
 */
class Board extends React.Component {

    static contextType = AlertContext;

    // Board constructor
    constructor(props) {
        super(props)

        // ASSUMES that grids are square AND gridSize = num grids in each direction
        // Mini grid size
        let gridSize = 3;


        let rows = []; // Rows of this board.

        // For each cell in each row, set it to value 0, not a hint, and no pencil.
        for (let i = 0; i < (gridSize * gridSize); i++) {
            rows.push([]);
            for (let j = 0; j < (gridSize * gridSize); j++) {
                rows[i].push({x: j, y: i, value: 0, fixed: false, gridSize: gridSize});
            }
        }


        // Sets inital states.
        // selected is current selected cell's [x,y].rows
        // prevSelected is previously selected cell's [x,y].
        this.state = {
            rows: rows,
            selected: [null, null],
            prevSelected: [null, null],
            gridSize: gridSize,
            difficulty: 0
        }

    };

    /**
     * What to do if cell is clicked
     * @param {*} cell
     */

    handleChange(cell) {
        let tempState = this.state;
        const id = 'Cell' + cell.x + cell.y
        let val = document.getElementById(id).value;
        if (val !== '') {
            // To do if eraser is not selected.
            //Gets value for cell to be filled with

            if (val <= (this.state.gridSize * this.state.gridSize) && val > 0) {
                //Checls that value is in bounds
                let legalMove = true;
                // If broken try putting - 1 after this.state.gridSize*this.state.gridSize
                for (let i = 0; i < ((this.state.gridSize * this.state.gridSize) - 1); i++) {
                    //Checks to see if the value being place is already in the same row or column
                    if ((tempState.rows[i][cell.x].value === val || tempState.rows[cell.y][i].value === val) && !(cell.x === i && cell.y === i)) {
                        console.log("Invalid Move(dup)");
                        legalMove = false;
                        //legalMove is set to false so no changes will be made since there is already a number with that value in either the row or column
                        // document.getElementById(id).value = ''
                    }
                }
                if (legalMove) {
                    //Makes sure passed the previous check before checking if the mini grid contains the same value
                    //Finds the x-coordinate of the current mini grid (either 0,3,6)
                    let offsetX = (cell.x - (cell.x % this.state.gridSize));
                    let offsetY = (cell.y - (cell.y % this.state.gridSize));

                    //Loops through the mini grid to check if any value is the same as entered value
                    for (let i = 0; i < this.state.gridSize; i++) {
                        for (let j = 0; j < this.state.gridSize; j++) {
                            if ((tempState.rows[i + offsetY][j + offsetX].value === val || tempState.rows[i + offsetY][j + offsetX].value === val)) {
                                console.log("Invalid (in same mini grid)");
                                //If the same value is found within the same mini grid legalMove set to false
                                legalMove = false;
                                // document.getElementById(id).value = ''
                            }
                        }
                    }
                }
                //If the move was legal then the value is updated and cell set to fixed to show its a hint
                if (legalMove) {
                    tempState.rows[cell.y][cell.x].value = val;
                    tempState.rows[cell.y][cell.x].fixed = true;
                }
            } else {
                // document.getElementById(id).value = ''
                tempState.rows[cell.y][cell.x].value = 0;
                tempState.rows[cell.y][cell.x].fixed = false;
            }
        }
        //If eraser is not false then the cells value is set to '0' which displays as blank and set to not fixed, which changes the styling
        else {
            tempState.rows[cell.y][cell.x].value = 0;
            tempState.rows[cell.y][cell.x].fixed = false;
            console.log("False")
        }

        this.setState(tempState)
    };

    savePuzzle() {

        // Mostly filler info
        let puzzleName = document.getElementById("name-box").value;
        let puzzleDifficulty = this.state.difficulty;
        let puzzleType = 0;
        // Figures out puzzle type, 0 is unknown
        if (this.state.rows.length === 9 && this.state.rows.filter(x => x.length === 9).length === 9) {
            puzzleType = 1;
        } else puzzleType = 2;
        // NEED TO CHECK FOR LIGHTS OUT
        const alertFunction = this.context;
        sendPuzzle(puzzleDifficulty, puzzleType, puzzleName, this.state.rows.map(row => row.map(x => x.value)), alertFunction);
    };

    renderRow(row, index) {
        return (
            <div className="Row" key={index}>
                {
                    row.map((a, i) => {
                        return <Cell value={Object.values(a)} onChange={() => this.handleChange(a)}
                                     key={`${index}-${i}`}/>
                    })
                }
            </div>
        )
    };


    render() {
        return (
            <div className="creator">
                <div id='BoardContainer'>
                    {
                        this.state.rows.map((x, ind) => this.renderRow(x, ind))
                    }
                </div>
                <div style={{"display": "flex"}}>
                    <Form>
                        <Form.Group className="mb-3">
                            <h5 style={{color:"white"}}>*Any invalid inputs (non-white cells) will be ignored on save</h5>
                            <Form.Label style={{color:'white'}}>Sub-grid Size</Form.Label>
                            <FormControl id="grid-size-input" type="number" min="2" max="4" defaultValue="3" onInput={() => {
                                let input = parseInt(document.getElementById("grid-size-input").value);
                                if(input > 4 || input < 2){
                                    document.getElementById("grid-size-input").value = 3
                                }
                                let tempState = this.state;
                                tempState.gridSize = document.getElementById("grid-size-input").value;
                                tempState.rows = [];
                                tempState.selected = [];
                                tempState.prevSelected = [];

                                             for (let i = 0; i < tempState.gridSize * tempState.gridSize; i++) {
                                                 tempState.rows.push([]);
                                                 for (let j = 0; j < tempState.gridSize * tempState.gridSize; j++) {
                                                     tempState.rows[i].push({
                                                         x: j,
                                                         y: i,
                                                         value: 0,
                                                         fixed: false,
                                                         gridSize: tempState.gridSize
                                                     });
                                                 }
                                             }

                                             this.setState(tempState);
                                             this.render();
                                         }}>
                            </FormControl>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <FormControl id="name-box" type="text"
                                         placeholder="Enter the name for your puzzle"></FormControl>
                        </Form.Group>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <DifficultySlider handleUpdate={(v) => this.setState({...this.state, difficulty: v})}
                                              value={this.state.difficulty}/>
                            <Button id="save-button" type="button" onClick={() => this.savePuzzle()}>SAVE</Button>
                        </div>
                    </Form>
                </div>
            </div>
        );
    }
}

function Creator() {
    return (
        <Board/>
    );
}


/**
 *
 * @returns structure of app.
 */

function App() {
    return (
        <div className="sudoku-creator-app">
            <Creator/>

        </div>

    );
}

export default App;
