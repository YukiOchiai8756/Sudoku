import React, {Component} from 'react';
import {AlertContext} from "./Alert";

class ImportComponent extends Component {
    static contextType = AlertContext;
    static alertFunction = this.context;

    constructor(props) {
        super(props);
        this.state = {
            importedData: null,
        };
        this.fileInputRef = React.createRef();
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.handleBrowseClick = this.handleBrowseClick.bind(this);
    }

    handleFileUpload(event) {
        const createPopup = this.context;
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        // Check that the file is a JSON file
        if (file.type !== 'application/json') {
            console.error('Invalid file type. Please upload a JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const dimensions = this.checkArrayDimensions(data);

                // Check that the JSON data is valid
                if (dimensions === -1) {
                    console.error('Invalid array dimensions. Please upload a valid sudoku puzzle.');
                    return;
                }

                // Construct the puzzle object
                const puzzle = {
                    puzzleType: dimensions,
                    puzzlesUnsolved: data,
                };


                // Send the puzzle to the backend
                fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/importer/importPuzzle`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(puzzle),
                    credentials: "include"
                })
                    .then(response => response.json())
                    .then(data => {
                        //Handle the response from the backend
                        if (!data.error) {
                            createPopup("Success", "Your sudoku was successfully uploaded. You can create another, similar puzzle or head to the browse page to see it.")
                            this.setState({importedData: data});
                        } else {
                            if (data.error === "UnsolvablePuzzle") {
                                createPopup("That puzzle cannot be solved!", "We use a puzzle solver to verify that only valid sudoku puzzles can be submitted to our platform. The puzzle you have submitted is not a valid sudoku puzzle: Please check it and try again.")
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error handling response:', error);
                    });

            } catch (error) {
                console.error('Error parsing JSON file:', error);
            }
        };

        reader.onerror = (event) => {
            console.error('Error reading file:', event.target.error);
        };
    }

    handleBrowseClick() {
        this.fileInputRef.current.click();
    }

    checkArrayDimensions(array) {
        const rows = array.length;
        const cols = array[0].length;

        if (array.some(row => row.includes(true) || row.includes(false))) {
            return 3;
        }

        if (rows === 9 && cols === 9) {
            return 1;
        } else if (rows === 1 || rows === 2 || rows === 4 || rows === 5 || rows === 6) {
            return 2;
        } else {
            return -1; // return -1 if array dimensions do not match any expected dimensions
        }
    }

    render() {
        return (
            <>

                <span className="dropdown-item" onClick={() => this.fileInputRef.current.click()}
                      style={{cursor: "pointer"}}>Import puzzle</span>


                <div className='importer-holder'>
                    <input
                        type="file"
                        accept=".json"
                        id="fileInput"
                        ref={this.fileInputRef}

                        onChange={(event) => this.handleFileUpload(event, this.context).bind(this)}
                        className="importer"
                    />
                </div>
            </>


        );
    }
}


export default ImportComponent;

