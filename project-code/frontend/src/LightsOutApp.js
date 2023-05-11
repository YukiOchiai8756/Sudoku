import React, { Component, useState } from 'react';
import './css/LightsOut.css';
import LikeApp from "./components/SudokuLike";
import Comments from "./components/Comments";
import './css/SudokuApp.css';
import { Form } from 'react-bootstrap';
import { DifficultySlider } from './components/DifficultySlider';
import Button from "react-bootstrap/Button";
import { AlertContext } from "./components/Alert";
import SolveQuestSection from "./components/quests/SolveQuestSection";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {SolverApp} from "./SudokuApp";


function Square(props) {
  let light = props.value[2]
  return(
    <button style={{
      backgroundColor: light ? 'rgba(150,150,0,0.8)' : 'rgba(50,50,50,0.8)',
    }} className='square' onClick={props.onClick}></button>
  )
}


class ExportButton extends React.Component {
  constructor(props) {
    super(props);
    this.exportBoardData = this.exportBoardData.bind(this);
  }

  exportBoardData() {
      const { squares } = this.props;
    
      // Convert board data to 2D array
      const boardData = squares.map(row => row.map(cell => cell.light));
    
      // Create a JSON file
      const dataStr = JSON.stringify(boardData);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUri;
      downloadLink.download = 'board-data.json';
    
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
    


  render() {
    return (
      <Button onClick={this.exportBoardData}>EXPORT TO JSON</Button>
    );
  }
}



class LightsOut extends Component {
  static contextType = AlertContext;
  constructor(props) {
    super(props);
    let squares = [];
    let gridSize = 5;
    for (let i = 0; i < gridSize; i++) {
      squares.push([]);
      for (let j = 0; j < gridSize; j++) {
        squares[i].push({x: j, y: i, light: true});
      }
    }
    this.state = {
      squares: squares,
      gridSize: gridSize,
    }
    this.getBoard()
  }

  
  getBoard() {

    let puzzle_id = new URLSearchParams(window.location.search).get('id');
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}`, { credentials: "include" })
            .then(response => {
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
            .then(response => {

                console.log(response)
                // Assumes that all rows are of same length
                let gridSize = response.data.length;
                let squares = this.state.squares;
                squares = [];

                // Response.data = 2D array of the fetched board.
                // Store fetched board in rows array
                for (let i = 0; i < (gridSize); i++) {
                    squares.push([]);
                    for (let j = 0; j < (gridSize); j++) {
                      squares[i].push({x: j, y: i, light: response.data[i][j]});  

                    }
                }

                if (response.progress) {
                  squares.map((r, i) => r.map((c, j) => c.light = response.progress[i][j]));
                }
                console.log(squares)

                // Update rows in state.
                this.setState({
                    squares: squares,
                    gridSize: gridSize
                })

                document.getElementById('name-label').innerHTML = response.name;
                return response.data;
            })
            .catch((error) => {
                alert(error.message);
            });
  }

  checkWin() {
    for(let i = 0; i < this.state.gridSize;i++){
      for(let j = 0;j < this.state.gridSize;j++){
        if(this.state.squares[i][j].light){
          return false;
        }
      }
    }
    return true;
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

  saveProgress(createPopup) {
    let puzzle = {};
    puzzle.data = this.state.squares.map(row => row.map(c => c.light));
    puzzle.userDifficultyRating = this.state.difficulty;
    console.log(puzzle)

    let puzzle_id = new URLSearchParams(window.location.search).get('id');
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/progress`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(puzzle),
        credentials: "include"
    })
        .then(response => response.json())
        .then(response => createPopup('Server Response', JSON.stringify(response.message)));
}

  submitPuzzle(createPopup) {
    let puzzle = {};
    puzzle.data = this.state.squares.map(row => row.map(c => c.value));
    puzzle.userDifficultyRating = this.state.difficulty;

    if(this.checkWin()){
      let puzzle_id = new URLSearchParams(window.location.search).get('id');
      fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/sudoku/${puzzle_id}/solved`, {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(puzzle),
          credentials: "include"
      })
          .then(response => {
              if(response.status === 200) {
                  this.props.setHasCompleted(true);
              }
              return response.json()})

    }
    else {
      createPopup('Something is wrong with your answer...', 'Remember you are trying to turn all the lights off')
    }
  }

  printDocument() {
    const input = document.getElementById('t');
    html2canvas(input)
        .then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            pdf.addImage(imgData, 'JPEG', 0, 0);
            pdf.save('lightsout.pdf');
        });
}

  renderRow(row) {
    return (
      <div className="Row">
          {
              row.map(a => {
                  return <Square value={Object.values(a)} onClick={() => this.handleButtonClick(a)}/>
              })
          }
      </div>
  )
  }

  render() {
    return (
      <div>
        <label id="name-label"></label>
        <div>
        <div id="t">
                    {this.state.squares.map(x => this.renderRow(x))}
        </div>

                <Form>
                    <DifficultySlider handleUpdate={(v) => this.setState({ ...this.state, difficulty: v })} value={this.state.difficulty} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={f => this.saveProgress(this.context)}>SAVE PROGRESS</Button>
                        <Button variant="primary" onClick={() => this.submitPuzzle(this.context)}>SUBMIT</Button>
                        <ExportButton squares={this.state.squares} />
                    </div>
                </Form>
                </div>


                <div className='mb5'>
                  <Button onClick={this.printDocument}>Download Puzzle</Button>
                </div>

     
      </div>
    );
  }
}



function App () {
    return <SolverApp Child={LightsOut}/>
}

export default App;