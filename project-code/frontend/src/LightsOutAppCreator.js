import React, { Component } from 'react';
import './css/LightsOut.css';
import './css/SudokuApp.css';
import { DifficultySlider } from './components/DifficultySlider';
import {AlertContext} from "./components/Alert";
import {Form, FormControl, Button} from 'react-bootstrap';

function Square(props) {
  let light = props.value[2]
  return(
    <button style={{
      backgroundColor: light ? 'rgba(150,150,0,0.8)' : 'rgba(50,50,50,0.8)',
    }} className='square' onClick={props.onClick}></button>
  )
}

const sendPuzzle = (difficultyLevel, puzzleType, puzzleName, puzzlesUnsolved, createPopup) => {
  console.log("sending")
  let puzzle = {};
  puzzle.difficultyLevel = parseInt(difficultyLevel);
  puzzle.puzzleType = puzzleType;
  puzzle.puzzleName = puzzleName;
  puzzle.puzzlesUnsolved = puzzlesUnsolved
  puzzle.puzzleSolved = "";
  
  switch(puzzle.difficultyLevel) {
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
  console.log(puzzle)

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
              return createPopup("Success", "Your lights out puzzle was successfully uploaded. You can create another puzzle or head to the browse page to see it.")
          } else {
            console.log(response.error)
            if (response.error === "Empty Lightsout") {
              return createPopup("That puzzle is already solved!", "A lights out puzzle must have some lights on.")
          }
              throw new Error(response.mes4sage || response.error_description || response.error);
          }
      })
      .catch(err => createPopup("Error: Something went wrong.", err.message));
};




class LightsOutCreator extends Component {

  static contextType = AlertContext;
  constructor(props) {

    super(props);
    let squares = [];
    let gridSize = 5;
    for (let i = 0; i < gridSize; i++) {
      squares.push([]);
      for (let j = 0; j < gridSize; j++) {
        squares[i].push({x: j, y: i, light: false});
       // squares.push(<Square onClick={() => this.handleButtonClick()}></Square>);
      }

    }
    
    this.state = {
      squares: squares,
      gridSize: gridSize,
    }
  }

  //Used getElementByID - checks for size limit
  handleGridSizeChange = (e) =>{
    let tempState = this.state;
    if (e>0)
      tempState.gridSize = document.getElementById("grid-size-input").value;
    if (tempState.gridSize < 3 || tempState.gridSize > 12){
      tempState.gridSize = 5
    }
    let newSquares=[];
    for (let i = 0; i < tempState.gridSize; i++) {
      newSquares.push([]);
      for (let j = 0; j < tempState.gridSize; j++) {
        newSquares[i].push({x: j, y: i, light: false});
      }
    }
    tempState.squares = newSquares;
    console.log(newSquares)
    this.setState(tempState)
    this.render()
  } 



  handleButtonClick = (e) => {
    let tempState = this.state;
    tempState.squares[e.y][e.x].light=!tempState.squares[e.y][e.x].light;
    try {
      tempState.squares[e.y+1][e.x].light=!tempState.squares[e.y+1][e.x].light
    } catch (error) {
    }
    try {
      tempState.squares[e.y-1][e.x].light=!tempState.squares[e.y-1][e.x].light
    } catch (error) {
    }
    try {
      tempState.squares[e.y][e.x+1].light=!tempState.squares[e.y][e.x+1].light
    } catch (error) {
    }
    try {
      tempState.squares[e.y][e.x-1].light=!tempState.squares[e.y][e.x-1].light
    } catch (error) {
    }
    this.setState(tempState)
  }

  savePuzzle() {
    let puzzleName = document.getElementById("name-box").value;
    let puzzleDifficulty = document.getElementById("difficulty-slider").value;
    const alertFunction = this.context;
    if (puzzleName === '') {
    }
    sendPuzzle(puzzleDifficulty, 3, puzzleName, this.state.squares.map(row => row.map(x => x.light)), alertFunction);
  }

  renderRow(row) {
    return (
      <div>
          {
              row.map(a => {
                  return <Square key={a + Math.random} value={Object.values(a)} onClick={() => this.handleButtonClick(a)}/>
              })
          }
      </div>
  )
  }

  render() {
    return (
      <div className='sudoku-creator-app'>
      <div className="creator">
        <div id="BoardContaner">
        {this.state.squares.map(x => this.renderRow(x))}
        </div>
      <div style ={{"display":"flex"}}>
        <Form>
        <Form.Group className="mb-3">
            
              <Form.Label style={{color:'white'}}>Sub-grid Size</Form.Label>
              <FormControl id="grid-size-input" type="number" min="3" max="12" defaultValue="5" onInput={() => {
                this.handleGridSizeChange(1)
              }}>

              </FormControl>
          </Form.Group>
            
            <Form.Group className="mb-3">
              <FormControl id="name-box" type="text" placeholder="Enter the name for your puzzle"></FormControl>
            </Form.Group>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <DifficultySlider handleUpdate={(v)=> this.setState({...this.state, difficulty: v})} value={this.state.difficulty}/>
                            <Button id="save-button" type="button" onClick={() => this.savePuzzle()}>SAVE</Button>
                        </div>
          </Form>
          </div>
      </div>
              </div>
    );
  }

}

export default LightsOutCreator;