import "./css/SudokuApp.css";
import React, {useContext, useEffect, useState} from "react";
import {DifficultySlider} from "./components/DifficultySlider";
import {jsPDF} from "jspdf";
import html2canvas from "html2canvas";
import LikeApp from "./components/SudokuLike";
import Comments from "./components/Comments";
import Button from "react-bootstrap/Button";
import {Alert, AlertContext} from "./components/Alert";
import SolveQuestSection, {QuestSection} from "./components/quests/SolveQuestSection";
import {Form} from "react-bootstrap";
import {Link, useNavigate, useSearchParams} from "react-router-dom";
import {request} from "./util";

/**
 *
 * @returns if pencil has been selected (check-box).
 */
function pencil() {
    return document.getElementById("pencil-checkbox").checked;
}

/**
 * Returns colour that given cell should be filled so that every sub-grid only touches sub-grids of a different colour.
 * @param {*} x
 * @param {*} y
 * @returns colour (hex-code).
 */
function cellStyle(x, y, gridSize) {
    // Logic for defining "every-other" sub-grid
    if (
        (((x - (x % gridSize)) / gridSize) % 2 === 0 &&
            ((y - (y % gridSize)) / gridSize) % 2 === 0) ||
        (((x - (x % gridSize)) / gridSize) % 2 === 1 &&
            ((y - (y % gridSize)) / gridSize) % 2 === 1)
    ) {
        return "rgba(0,0,0,0.8)";
    } else {
        return "rgba(0,0,0,0.5)";
    }
}

/**
 * MiniCell component i.e. when a cell is split up into n mini cells for pencilling in numbers, a mini cell is one of the n cells.
 * @param {*} props
 * @returns MiniCell component
 */
function MiniCell(props) {
    // This is the value that will be displayed in the mini cell.
    let value = props.value[0];
    // If the value !== 0 then display it on the cell, if not display nothing.
    return (
        <button className="MiniCell" style={props.style} onClick={props.onClick}>
            {value === 0 ? "" : value}
        </button>
    );
}

/**
 * Component which represents one of the nxn cells of the grid.
 * @param {} props
 * @returns cell component.
 */
function Cell(props) {
    let x = props.value[0]; // x-position of the cell
    let y = props.value[1]; // y-position of the cell
    let cellID = "Cell" + x + y; // ID of the DOM element representing the cell
    let value = props.value[2]; // Value displayed in the cell.
    let fixed = props.value[3]; // Whether the cell is a hint cell or not.
    let gridSize = props.value[4]; // Size of subgrid
    let pencilled = props.value[5];
    let incorrect = props.value[6];

    // If cell is a hint, lower opacity background with bold text. Else, use cellStyle function.
    // 0 represents empty cell, else display the value.
    return (
        <input
            style={{
                "backgroundColor": !fixed
                    ? cellStyle(x, y, gridSize)
                    : "rgba(255, 255, 255, 0.75)",
                fontWeight: fixed ? "bold" : "",
                textAlign: "center",
                color: !fixed
                    ? !pencilled
                        ? !incorrect
                            ? "white"
                            : "red"
                        : "#f7abe9"
                    : "black",
                "fontSize": !pencilled ? "25px" : "12px",
            }}
            className="Cell"
            id={cellID}
            onClick={props.onClick}
            maxLength={pencilled ? 30 : (gridSize > 3 ? 2 : 1)}
            // Reject any non numeric characters
            onKeyPress={(event) => {
                const allow = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
                if (!allow.includes(event.key)) {
                    event.preventDefault();
                }
            }}
            // Don't display if value is 0
            value={value === 0 ? "" : value}
            onChange={props.onChange}
            disabled={fixed}
        />
    );
}

class ExportButton extends React.Component {
    constructor(props) {
        super(props);
        this.exportBoardData = this.exportBoardData.bind(this);
    }

    exportBoardData() {
        const {rows} = this.props;

        // Convert board data to 2D array
        const boardData = rows.map((row) => row.map((cell) => cell.value || 0));

        // Create a JSON file
        const dataStr = JSON.stringify(boardData);
        const dataUri =
            "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const downloadLink = document.createElement("a");
        downloadLink.href = dataUri;
        downloadLink.download = "board-data.json";

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    render() {
        return <Button onClick={this.exportBoardData}>EXPORT TO JSON</Button>;
    }
}

/**
 * Component which represents the whole Sudoku board.
 */
class Board extends React.Component {
    static contextType = AlertContext;

    // Board constructor
    constructor(props) {
        super(props);

        let rows = []; // Rows of this board.

        // INITIAL 9 * 9 grid
        // For each cell in each row, set it to value 0, not a hint, and no pencil.
        for (let i = 0; i < 9; i++) {
            rows.push([]);
            for (let j = 0; j < 9; j++) {
                rows[i].push({
                    x: j,
                    y: i,
                    value: 0,
                    fixed: false,
                    pencilled_bool: false,
                });
            }
        }

        this.name = "";

        // Sets inital states.
        // selected is current selected cell's [x,y].
        // prevSelected is previously selected cell's [x,y].
        this.state = {
            rows: [],
            selected: [null, null],
            prevSelected: [null, null],
        };

        // Fill sudoku board with hints from ID in URL.
    }

    componentDidMount() {
        this.displayBackendBoard();
    }
    componentDidUpdate(prevProps, prevState, sn) {
        if (prevProps.puzzleId !== this.props.puzzleId) {
            this.displayBackendBoard();
        }

    }

    /**
     * Displays board from backend on Sudoku board.
     * Gets board ID from URL.
     */
    displayBackendBoard() {

        // Get puzzle ID from URL.
        let puzzle_id = this.props.puzzleId;
        //URL must be of format sudoku?id=

        if (!puzzle_id) {
            throw {
                error: "There's no wave here",
                error_description: (
                    <>
                        You have opened the sudoku page without supplying a puzzle id.{" "}
                        <a href="/browser">Back to the browser</a>
                    </>
                ),
            };
        }

        // Puzzle_id of -1 means FOREIGN SUDOKU AND THAT DATA IS IN THE URL
        if (puzzle_id === "-1") {
            let puzzle = JSON.parse(
                new URLSearchParams(window.location.search).get("puzzle")
            );

            setTimeout(() => {
                let gridSize = Math.sqrt(puzzle.puzzle.length);

                let rows = this.state.rows;

                rows = [];

                // puzzle.puzzle = 2D array of the fetched board.
                // Store fetched board in rows array
                for (let i = 0; i < gridSize * gridSize; i++) {
                    rows.push([]);
                    for (let j = 0; j < gridSize * gridSize; j++) {
                        rows[i].push({
                            x: j,
                            y: i,
                            value: puzzle.puzzle[i][j],
                            fixed: puzzle.puzzle[i][j] !== "",
                            gridSize: gridSize,
                            pencilled_bool: false,
                        });
                    }
                }

                // Update rows in state.
                this.setState({
                    revealed: false,
                    rows: rows,
                    selected: [null, null],
                    prevSelected: [null, null],
                    gridSize: gridSize,
                });

                document.getElementById("name-label").innerHTML = puzzle.title;
            }, 1000);
            // Assumes that all rows are of same length
        } else {
            // Fetch puzzle from the backend.
            fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}`, {
                credentials: "include",
            })
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    }
                    if (response.status === 401) {
                        throw new Error("Please login before accessing sudoku");
                    }
                    if (response.status === 404) {
                        throw new Error(`Could not find sudoku with id ${puzzle_id}`);
                    }
                    throw new Error("Unknown error");
                })
                .then((response) => {
                    // Assumes that all rows are of same length
                    let gridSize = Math.sqrt(response.data.length);

                    let rows = []
                    // Response.data = 2D array of the fetched board.
                    // Store fetched board in rows array
                    for (let i = 0; i < gridSize * gridSize; i++) {
                        rows.push([]);
                        for (let j = 0; j < gridSize * gridSize; j++) {
                            rows[i].push({
                                x: j,
                                y: i,
                                value: response.data[i][j],
                                fixed: response.data[i][j] !== 0,
                                gridSize: gridSize,
                                pencilled_bool: false,
                                incorrect: false,
                            });
                        }
                    }

                    // Load progress
                    if (response.progress) {
                        rows.map((r, i) =>
                            r.map((c, j) => (c.value = response.progress[i][j]))
                        );
                    }

                    // Update rows in state.
                    this.setState({
                        revealed: false,
                        rows,
                        selected: [null, null],
                        prevSelected: [null, null],
                        gridSize: gridSize,
                    });

                    document.getElementById("name-label").innerHTML = response.name;

                    return response.data;
                })
                .catch((error) => {
                    alert(error.message);
                });
        }
    }

    /**
     *
     * @returns whether the board is full or not i.e. the value of every tile is not equal to 0.
     */
    boardIsFull() {
        // Loop through each cell, checking if its value is 0.
        for (let row of this.state.rows) {
            for (let cell of row) {
                if (cell.value === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     *
     * @returns true if puzzle has been solved i.e. board is full and each row, column, and sub-grid consists of only unique numbers between 1 and 9.
     */
    checkSolved() {
        let gridSize = this.state.gridSize;
        // Check that board is full
        if (this.boardIsFull()) {
            // Check rows
            for (let row of this.state.rows) {
                // Contains[x-1] = true if x is contained in the row.
                let contains = Array(gridSize * gridSize).fill(false);
                for (let cell of row) {
                    if (cell.value >= 1 && cell.value <= gridSize * gridSize) {
                        contains[cell.value - 1] = true;
                    }
                }
                // If row does not contain one of the numbers 1-9, then return false.
                if (contains.includes(false)) {
                    return false;
                }
            }

            // Check columns
            for (let row_num in this.state.rows) {
                // Contains[x-1] = true if x is contained by the column
                let contains = Array(gridSize * gridSize).fill(false);
                for (let cell_num in this.state.rows[row_num]) {
                    let cell = this.state.rows[cell_num][row_num];
                    if (cell.value >= 1 && cell.value <= gridSize * gridSize) {
                        contains[cell.value - 1] = true;
                    }
                }
                // If column does not contain one of the numbers 1-9, then return false.
                if (contains.includes(false)) {
                    return false;
                }
            }

            // Sub-grids
            for (let x = 0; x < gridSize * gridSize; x += gridSize) {
                for (let y = 0; y < gridSize * gridSize; y += gridSize) {
                    // Contains[x-1] = true if x is contained by the sub-grid
                    let contains = Array(gridSize * gridSize).fill(false);
                    for (let i = x; i <= x + (gridSize - 1); i++) {
                        for (let j = y; j <= y + (gridSize - 1); j++) {
                            let cell = this.state.rows[j][i];
                            if (cell.value >= 1 && cell.value <= gridSize * gridSize) {
                                contains[cell.value - 1] = true;
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

    /**
     * What to do if the value in a cell is changed
     * Update the state storing the current layout of the board
     * @param {*} cell 
     */
    handleChange(cell) {
        const id = "Cell" + cell.x + cell.y;
        let tempState = this.state;

        if (tempState.rows[cell.y][cell.x].pencilled_bool) {
            tempState.rows[cell.y][cell.x].value = document.getElementById(id).value;
            this.setState(tempState);
            return;
        }

        tempState.rows[cell.y][cell.x].value = document.getElementById(id).value;
        tempState.rows[cell.y][cell.x].pencilled_bool = false;

        if (tempState.revealed) {
            this.revealClues(false);
            tempState.rows[cell.y][cell.x].pencilled_bool = false;
            tempState.rows[cell.y][cell.x].value = document.getElementById(id).value;
        }

        this.setState(tempState);
    }

    /**
     * What to do if cell is clicked
     * @param {*} cell
     */
    handleClick(cell) {
        let tempState = this.state;

        if (!cell.fixed) {
            if (pencil()) {
                // If pencil is selected, register that this cell has been pencilled.
                tempState.rows[cell.y][cell.x].pencilled_bool = true;
            } else {

                tempState.rows[cell.y][cell.x].pencilled_bool = false;
                tempState.rows[cell.y][cell.x].value = 0;
            }
        }
        this.setState(tempState);
    }

    /**
     * Reveals all pencils and flags incorrect cells
     * @param {*} p true or false depending on if revealClues is being toggled or called from input
     */
    revealClues(p) {
        let tempState = this.state;
        //If being toggled off then removes all pencilling
        if (tempState.revealed && p) {
            for (let i = 0; i < tempState.gridSize * tempState.gridSize; i++) {
                for (let j = 0; j < tempState.gridSize * tempState.gridSize; j++) {
                    //Un-pencils all cells and clears them
                    if (tempState.rows[i][j].pencilled_bool) {
                        tempState.rows[i][j].pencilled_bool = false;
                        tempState.rows[i][j].value = 0;
                    }
                    //Sets all flagged incorrect values to unflagged
                    if (tempState.rows[i][j].incorrect) {
                        tempState.rows[i][j].incorrect = false;
                    }
                }
            }
            tempState.revealed = false;
        } else {
            tempState.revealed = true;
            //Clears any pencilled cells
            for (let i = 0; i < tempState.gridSize * tempState.gridSize; i++) {
                for (let j = 0; j < tempState.gridSize * tempState.gridSize; j++) {
                    if (tempState.rows[i][j].pencilled_bool) {
                        tempState.rows[i][j].value = "";
                        tempState.rows[i][j].pencilled_bool = false;
                    }
                }
            }
            for (let i = 0; i < tempState.gridSize * tempState.gridSize; i++) {
                for (let j = 0; j < tempState.gridSize * tempState.gridSize; j++) {
                    if (!parseInt(tempState.rows[i][j].value) > 0) {
                        //Creates array of values that a cell can be
                        let values = [];
                        for (let k = 0; k < tempState.gridSize * tempState.gridSize; k++) {
                            values.push(k + 1);
                        }
                        //Check all columns and rows for the values and if found removed from array
                        for (let k = 0; k < tempState.gridSize * tempState.gridSize; k++) {
                            if (!tempState.rows[i][k].pencilled_bool) {
                                values = values.filter(
                                    (value) => value !== parseInt(tempState.rows[i][k].value)
                                );
                            }
                            if (!tempState.rows[k][j].pencilled_bool) {
                                values = values.filter(
                                    (value) => value !== parseInt(tempState.rows[k][j].value)
                                );
                            }
                        }

                        //Initialise variables for checking subgrid
                        const offsetX = j - (j % tempState.gridSize);
                        const offsetY = i - (i % tempState.gridSize);

                        //Checks subgrid now for values to remove
                        for (let i2 = 0; i2 < tempState.gridSize; i2++) {
                            for (let j2 = 0; j2 < tempState.gridSize; j2++) {
                                values = values.filter(
                                    (value) =>
                                        value !==
                                        parseInt(tempState.rows[i2 + offsetY][j2 + offsetX].value)
                                );
                                values = values.filter(
                                    (value) =>
                                        value !==
                                        parseInt(tempState.rows[i2 + offsetY][j2 + offsetX].value)
                                );
                            }
                        }

                        //Sets the pencilled values all now
                        tempState.rows[i][j].pencilled_bool = true;
                        tempState.rows[i][j].value = "";
                        for (let l = 0; l < values.length; l++) {
                            tempState.rows[i][j].value =
                                tempState.rows[i][j].value + "" + values[l];
                        }
                    } else {
                        //If row has a value and isnt fixed then checks there are no conflictions
                        if (!tempState.rows[i][j].fixed) {
                            let val = parseInt(tempState.rows[i][j].value);
                            tempState.rows[i][j].incorrect = false;
                            //Checks all rows and columns for conflicts
                            for (
                                let k = 0;
                                k < tempState.gridSize * tempState.gridSize;
                                k++
                            ) {
                                if (
                                    (parseInt(tempState.rows[i][k].value) === val && k !== j) ||
                                    (parseInt(tempState.rows[k][j].value) === val && k !== i)
                                ) {
                                    tempState.rows[i][j].incorrect = true;
                                }
                            }
                            let offsetX = j - (j % tempState.gridSize);
                            let offsetY = i - (i % tempState.gridSize);
                            //Checks subgrid for conflicts
                            for (let i2 = 0; i2 < tempState.gridSize; i2++) {
                                for (let j2 = 0; j2 < tempState.gridSize; j2++) {
                                    if (
                                        parseInt(
                                            tempState.rows[i2 + offsetY][j2 + offsetX].value
                                        ) === val &&
                                        i2 + offsetY !== i &&
                                        j2 + offsetX !== j
                                    ) {
                                        tempState.rows[i][j].incorrect = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        this.setState(tempState);
    }

    /**
     * Sends user progress to the backend
     */
    saveProgress(createPopup) {
        // Reject save if foreign
        if (this.props.puzzleId === "-1") {
            createPopup(
                "Failed to save progress",
                "Cannot save progress for foreign puzzles"
            );
            return;
        }

        let puzzle = {};
        puzzle.data = this.state.rows.map((row) => row.map((c) => c.value));
        puzzle.userDifficultyRating = this.state.difficulty;

        let puzzle_id = this.props.puzzleId;
        fetch(
            `${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/progress`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(puzzle),
                credentials: "include",
            }
        )
            .then((response) => response.json())
            .then((response) =>
                createPopup("Server Response", JSON.stringify(response.message))
            );
    }

    /**
     * Perform frontend and backend checks when the submit button is pressed
     */
    submitPuzzle(createPopup) {
        let puzzle = {};
        puzzle.data = this.state.rows.map((row) => row.map((c) => c.value));
        puzzle.data = puzzle.data.map(row => row.map(i => typeof i === "string" ? parseInt(i, 10) : i));
        puzzle.userDifficultyRating = this.state.difficulty;
        if (this.checkSolved()) {
            let puzzle_id = this.props.puzzleId;
            // If foreign, only check frontend
            if (puzzle_id === "-1") {
                this.props.setHasCompleted(true);
                return;
            }

            fetch(
                `${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/solved`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(puzzle),
                    credentials: "include",
                }
            )
                .then((response) => {
                    return response.json();
                })
                .then((response) => {
                    if (response.error) {
                        createPopup("That's not quite right.", response.error_description || response.error);
                    } else {
                        this.props.setHasCompleted(true);

                    }
                });
        } else {
            createPopup(
                "Something is wrong with your answer...",
                "Check for mistakes and try again!"
            );
        }
    }

    /**
     * Function for rendering given row on screen.
     * @param {*} row
     * @returns
     */
    renderRow(row) {
        return (
            <div
                className="Row"
                style={{height: "calc(100% / " + this.state.gridSize ** 2 + ")"}}
            >
                {
                    // a = current cell.
                    row.map((a) => {
                        return (
                            <Cell
                                value={Object.values(a)}
                                onClick={() => this.handleClick(a)}
                                onChange={() => this.handleChange(a)}
                            />
                        );
                    })
                }
            </div>
        );
    }

    // Render whole board.
    render() {
        return (
            <div>
                <div id="BoardContainer">
                    {this.state.rows.map((x) => this.renderRow(x))}
                </div>
                <Form>
                    <Form.Check
                        type="switch"
                        id="pencil-checkbox"
                        label="Toggle this button to use the 'pencil' tool"
                    />
                    <DifficultySlider
                        handleUpdate={(v) =>
                            this.setState({...this.state, difficulty: v})
                        }
                        value={this.state.difficulty}
                    />
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <Button onClick={(f) => this.saveProgress(this.context)}>
                            SAVE PROGRESS
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => this.submitPuzzle(this.context)}
                        >
                            SUBMIT
                        </Button>
                        <Button onClick={() => this.revealClues(true)}>
                            Reveal Pencil
                        </Button>
                        <ExportButton rows={this.state.rows}/>
                    </div>
                </Form>
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
    }

    printDocument() {
        const input = document.getElementById("BoardContainer");
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF();
            pdf.addImage(imgData, "JPEG", 0, 0);
            pdf.save("sudoku.pdf");
        });
    }

    render() {
        const {Board} = this.props;
        return (
            <div>
                <div>
                    <Board setHasCompleted={() => this.props.setHasCompleted(true)} puzzleId={this.props.puzzleId} setPuzzleId={this.props.setPuzzleId}/>
                </div>

                <div className="mb5">
                    <Button onClick={this.printDocument}>Download Sudoku</Button>
                </div>
            </div>
        );
    }
}

/**
 *
 * @returns structure of app.
 */
export function SolverApp({Child}) {
    const [searchParams] = useSearchParams();
    const puzzle_id = searchParams.get("id");
    const quest_id = searchParams.get("quest");
    const sendAlert = useContext(AlertContext);

    const [completed, setHasCompleted] = useState(false);
    const [quest, setQuestInfo] = useState(null);
    const navigate = useNavigate();

    const questIsDone = quest && quest.puzzles.every(p => p.userHasCompleted || (p.puzzleID === parseInt(puzzle_id, 10) && completed));

    useEffect(function () {
        (async function () {
            if (quest_id) {
                const resp = await request(`/api/quest/${quest_id}`);
                if (resp.error) {
                    throw resp;
                } else {
                    setQuestInfo(resp);
                }
            }
        })().catch(e => sendAlert("Error", e.error || e.message, ()=>{}));

    }, [quest_id]);

    function handleModalClose () {
        if (quest) {
            if (questIsDone) {
                navigate("/quests");
            } else {
                const nextPuzzle = quest.puzzles.find(p => !p.userHasCompleted);
                setHasCompleted(false);

                if (nextPuzzle.puzzleType === 3) {
                    navigate(`/lightsout?id=${nextPuzzle.puzzleID}&quest=${nextPuzzle.questID}`);
                } else {
                    navigate(`/sudoku?id=${nextPuzzle.puzzleID}&quest=${nextPuzzle.questID}`);
                }

            }
        } else {
            navigate("/browser");
        }
    }

    return (
        <div className="App">
            {completed ? <Alert
                title="Puzzle completed!"
                content={<div>
                    Congratulations - you have solved the puzzle.
                    <p>{quest ? questIsDone ? "Congratulations! You have completed your quest. Hit close to go back to the quests page." : `Hit close to go to the next puzzle in your quest.` : "Hit close to go back to the browser."}</p>
            </div>}
                isVisible={completed}
                handleClose={handleModalClose}

            /> : ""}
            <QuestSection questInfo={quest} completed={completed} puzzleId={puzzle_id}/>
            <div className="page">
                <label id="name-label"></label>
                <Child Board={Board}
                       setHasCompleted={setHasCompleted}
                       puzzleId={puzzle_id}
                       completed={completed}
                />

                {puzzle_id !== '-1' ?
                    <>
                        <LikeApp puzzleId={puzzle_id} />
                        <Comments puzzleId={puzzle_id}/>
                    </> : null
                }
            </div>
        </div>
    );

}

function App () {
    return <SolverApp Child={Game}/>
}

export default App;
