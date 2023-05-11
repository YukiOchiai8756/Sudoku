import {Component, useEffect, useState} from 'react';
import './css/browser.css';
import {Button, Card, Col, Container, Row} from 'react-bootstrap'
import {UserContext} from "./components/UserContext";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import React from "react-dom";
import {difficultyName} from "./components/DifficultySlider";
import {Link} from "react-router-dom";


class Browser extends Component {

    constructor(props) {
        super(props);
        this.state = {
            name: [],
            puzzleDifficulty: -1,
            hasBeenCompleted: NaN,
            minDifficulty: 0,
            maxDifficulty: 3,
            sortDirection: 'asc',
            searchTermAuthor: '',
            searchTermPuzzle: '',
            showGrid: 'no',
            recent: '',
            type: '',
            foreign: "0"
        };
    }

	// Update the most recently played card every time the page renders
    componentDidMount() {
        this.names();
        this.fetchRecent();
    }

    fetchGroup = (i) => {
        return fetch(`${process.env.REACT_APP_BACKEND_HOST}/fedapi/sudoku?difficulty=[1,2,3]&ratings=[1,2,3]&group=${i.toString()}`, {credentials: "include"})
            .then(r => {
                if (r.status >= 200 && r.status < 400) {
                    return r.json();
                } else {
                    throw new Error("FAILED TO GET DATA");
                }
            })
            .then(x => {

                // Prevent duplicates from being added
                if (!this.state.name.find(x => x['group'] == i)) {
                    this.setState({name: this.state.name.concat(x.flat())});
                }

            })
            .catch(e => {
                console.log("FAILED TO GET DATA FOR GROUP " + i.toString());
            })
    }

    names = async () => {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/fedapi/sudoku?difficulty=[0,1,2,3]&ratings=[0,1,2,3,4,5]&all=5`, {credentials: "include"});
        let data = await response.json();
        // Repeat for other servers - append all of their puzzles to data
        this.setState({name: data});

        let promises = [];


        for (let i = 10; i < 19 && i !== 19; i++) {
            promises.push(this.fetchGroup(i));
        }


    }
	// Function to fetch the most recently played puzzle id from the backend
    fetchRecent = async () => {
        if (this.props.disableRecentlyPlayed) return;
        const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/user/${this.context.id}/getRecent`, {credentials: "include"});
        const data = await response.json();
        this.setState({recent: data});
    }


    async handleClick(data, userId) {
        try {
            let res_ok = false;
            // Update recent only for group 19 puzzles
            if (data.group == 19) {
                {
                    const res = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/user/${userId}/upd-recent`, {
                        method: "post",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: "include",
                        body: JSON.stringify({"gameID": data.sudoku_id, "userID": userId})
                    });
                    if (res.ok) res_ok = true;
                }
            } else {
                res_ok = true;
            }
            if (res_ok) {
                if (!this.props.disableRecentlyPlayed) {
                    this.setState({recent: data});
                }

                // Redirect to the other group's website if sudoku is foreign
                if (data.group != 19) {
                    // All foreign puzzles are 9x9 sudokus so this is fine
                    window.location.href = `${window.location.origin}/sudoku?id=-1&puzzle=${JSON.stringify(data)}`
                } else {
                    if (data.type !== "sudoku" && data.type !== "sudoku variant") {
                        window.location.href = `${window.location.origin}/lightsout?id=${data.sudoku_id}`
                    } else {
                        window.location.href = `${window.location.origin}/sudoku?id=${data.sudoku_id}`
                    }

                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    handleSearchAuthorChange = (e) => {
        const value = e.target.value;
        this.setState({searchTermAuthor: value})
    }

    handleSearchPuzzleChange = (e) => {
        const value = e.target.value;
        this.setState({searchTermPuzzle: value})
    }

    handleSelectChange = (e) => {
        const value = e.target.value;
        this.setState({puzzleDifficulty: parseInt(value)});
    }

    handleCompletedChange = (e) => {
        const value = e.target.value;
        this.setState({hasBeenCompleted: parseInt(value)})
    }

    handleTypeChange = (e) => {
        const value = e.target.value;
        this.setState({type: value})
    }

    handleForeignChange = (e) => {
        const value = e.target.value;
        this.setState({foreign: value})
    }

    handleMinDifficultyChange = (e) => {
        const value = e.target.value;
        this.setState({minDifficulty: parseInt(value)})
    }

    handleMaxDifficultyChange = (e) => {
        const value = e.target.value;
        this.setState({maxDifficulty: parseInt(value)})
    }

    handleGridChange = (e) => {
        if (e === 'yes') {
            this.setState({showGrid: 'no'});
        } else {
            this.setState({showGrid: 'yes'});
        }
    }

    handleSortChange = (e) => {
        const value = e.target.value;
        if (value === "asc") {
            this.setState({sortDirection: "asc"});
        } else {
            this.setState({sortDirection: "desc"});
        }
    }

    render() {
        const {
            name,
            puzzleDifficulty,
            hasBeenCompleted,
            minDifficulty,
            maxDifficulty,
            sortDirection,
            searchTermAuthor,
            searchTermPuzzle,
            showGrid,
            recent,
            type,
            foreign
        } = this.state;
        const filteredNames = name.filter(data =>
            (data.difficulty === puzzleDifficulty || puzzleDifficulty < 0) &&
            (data.hasBeenCompleted === hasBeenCompleted || isNaN(hasBeenCompleted)) &&
            (type === "" || data.type === type) &&
            (foreign == 0 && data.group == 19 || foreign == 1 && data.group != 19 || foreign == 2) &&
            (data.difficulty >= minDifficulty) &&
            (data.difficulty <= maxDifficulty) &&
            data.author_name.toLowerCase().includes(searchTermAuthor.toLowerCase()) &&
            data.title.toLowerCase().includes(searchTermPuzzle.toLowerCase()));
        const sortedNames = filteredNames.sort((a, b) => {
            if (sortDirection === "asc") {
                return a.difficulty - b.difficulty;
            } else {
                return b.difficulty - a.difficulty;
            }
        });


        return (
            <div className='Browser'>
                {this.props.title ? this.props.title : <h1>Select Puzzle to solve </h1>}
                <Container>
                    <Form.Select onChange={this.handleSelectChange}>
                        <option value="-1">All Difficulties</option>
                        <option value='0'>No Difficulty</option>
                        <option value='1'>Difficulty 1</option>
                        <option value='2'>Difficulty 2</option>
                        <option value='3'>Difficulty 3</option>
                    </Form.Select>

                    <Form.Select onChange={this.handleMinDifficultyChange}>
                        <option value='0'>MINIMUM No Difficulty</option>
                        <option value='1'>MINIMUM Difficulty 1</option>
                        <option value='2'>MINIMUM Difficulty 2</option>
                        <option value='3'>MINIMUM Difficulty 3</option>
                    </Form.Select>

                    <Form.Select onChange={this.handleMaxDifficultyChange}>
                        <option value='3'>MAXIMUM Difficulty 3</option>
                        <option value='2'>MAXIMUM Difficulty 2</option>
                        <option value='1'>MAXIMUM Difficulty 1</option>
                        <option value='0'>MAXIMUM No Difficulty</option>
                    </Form.Select>

                    <Form.Select onChange={this.handleCompletedChange}>
                        <option value=''>COMPLETABLE AND MAYBE COMPLETABLE</option>
                        <option value='1'>COMPLETABLE</option>
                        <option value='0'>MAYBE COMPLETABLE</option>
                    </Form.Select>

                    <Form.Select onChange={this.handleTypeChange}>
                        <option value="">ALL TYPES</option>
                        <option value='sudoku'>SUDOKU</option>
                        <option value='sudoku variant'>SUDOKU VARIANTS</option>
                        <option value='lights out'>LIGHTS OUT</option>
                    </Form.Select>

                    <Form.Select onChange={this.handleForeignChange}>
                        <option value='0'>LOCAL</option>
                        <option value='1'>FOREIGN</option>
                        <option value='2'>LOCAL AND FOREIGN</option>
                    </Form.Select>

                    <Form.Select onChange={this.handleSortChange}>
                        <option value="asc">Puzzle Difficulty (lowest to highest)</option>
                        <option value="desc">Puzzle Difficulty (highest to lowest)</option>
                    </Form.Select>
                    <InputGroup>
                        <InputGroup.Text id="basic-addon1">Search by user</InputGroup.Text>
                        <Form.Control
                            placeholder="Username"
                            onChange={this.handleSearchAuthorChange}
                        />
                    </InputGroup>
                    <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon1">Search by puzzle name</InputGroup.Text>
                        <Form.Control
                            placeholder="Puzzle Name"
                            onChange={this.handleSearchPuzzleChange}
                        />
                    </InputGroup>
                    <Button onClick={() => this.handleGridChange(showGrid)} variant="danger">Show Preview</Button>
                </Container>
                <Container className="pt-2">
                    {chunk(sortedNames, 4).map(row => (
                        <Row key={`row-${row[0] ? row[0].sudoku_id : "empty"}`}>
                            {row.map((data) => (<Col md="3" key={"col" + data.sudoku_id}>
                                <PuzzleCard puzzle={data} handleClick={() => this.props.handleClick ?
                                    this.props.handleClick(data) : this.handleClick(data, this.context.id)}
                                            key={data.sudoku_id}
                                            selected={this.props.selectedPuzzles && this.props.selectedPuzzles.includes(data.sudoku_id)}
                                            completed={data.userHasCompleted}
                                />
                                <Grid data={data} showGrid={showGrid}/>
                            </Col>))}
                        </Row>
                    ))}

                </Container>

                {!this.props.disableRecentlyPlayed &&
                    <Container className="d-flex justify-content-center align-items-center" style={{padding: 10}}>
                        <Card style={{
                            backgroundColor: "#F9D9B4",
                            color: "#212529",
                            borderColor: "#212529",
                            fontWeight: "800"
                        }}>
                            <Card.Body>
                                <Card.Title>Most Recently Played Puzzle</Card.Title>
                                <Card.Text>
                                    This is the puzzle that you most recently played, ID: {recent.puzzleID}
                                </Card.Text>
                                <Button style={{backgroundColor: "#bd742a", borderColor: "#bd742a", color: "#212529"}}
                                        onClick={() => (recent.puzzleType < 3 ? recent.puzzleID && window.open(`${window.location.origin}/sudoku?id=${recent.puzzleID}`) : recent.puzzleID && window.open(`${window.location.origin}/lightsout?id=${recent.puzzleID}`))}>Go
                                    back to this puzzle</Button>
                            </Card.Body>
                        </Card>
                    </Container>
                }


            </div>
        );
    }
}

Browser.contextType = UserContext;


function Grid({data, showGrid}) {

    const [puzzle, setName] = useState([]);

    useEffect(() => {
        names()
    }, [])

    const names = async () => {
        setName(data)
    }

    if (showGrid === 'yes') {
		if (data.type !== "sudoku" && data.type !== "sudoku variant") {
			let gridSize = puzzle.puzzle.length
            return (
				<div>
					{puzzle.puzzle.map((a) => (
						<div style={{ display: "flex" }}>
							{a.map((b) => (
								<div
									style={{
										width: 300/gridSize + "px",
										height: 300/gridSize + "px",
										border: "1px solid #fff",
										background: b ? 'rgba(150,150,0,0.8)' : 'rgba(50,50,50,0.8)',
										fontSize: '20px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
								</div>
							))}
						</div>
					))}
					<div style={{ color: '#b62f2f', marginTop: '20px', fontSize: '20px' }}>Catch a wave and solve the puzzle!</div>
				</div>
			)
		}
		else {
			let gridSize = Math.sqrt(puzzle.puzzle.length)
			console.log(gridSize)
			return (
				<div>
					{puzzle.puzzle.map((a,x) => (
						<div style={{ display: "flex" }}>
							{a.map((b,y) => (

								<div
									style={{
										width: 300/(gridSize*gridSize)+"px",
										height: 300/(gridSize*gridSize)+"px",
										border: "1px solid #fff",
										background:
										((x - (x % gridSize)) / gridSize % 2 === 0 && (y - (y % gridSize)) / gridSize % 2 === 0) ||
        								((x - (x % gridSize)) / gridSize % 2 === 1 && (y - (y % gridSize)) / gridSize % 2 === 1)
										? 'rgba(50,50,50,0.8)' : 'rgba(100,100,100,0.8)',
										color: '#fff',
										fontSize: 60/gridSize-2+'px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									{b > 0 ? b : ''} 
								</div>
							))}
						</div>
					))}
					<div style={{ color: '#b62f2f', marginTop: '20px', fontSize: '20px' }}>Catch a wave and solve the puzzle!</div>
				</div>
			);
		}
	} else {
		return (<div></div>);
	}
}

function chunk(arr, size) {
    const ret = [];
    for (let counter = 0; counter < arr.length; counter += size) {
        ret.push(arr.slice(counter, counter + size));
    }
    return ret;
}

export const PuzzleCard = ({
                               puzzle: {
                                   title,
                                   likes,
                                   author_name,
                                   author_id,
                                   sudoku_id,
                                   rating,
                                   difficulty,
                                   type,
                                   hasBeenCompleted,
                                   group
                               }, completed, handleClick, selected
                           }) => (
    <Card onClick={handleClick} style={{cursor: "pointer"}} className="mb-3"
          bg={selected ? "primary" : completed ? "success" : ""} text={selected || completed ? "light" : ""}>
        <Card.Body>
            <Card.Title>{title} {group !== 19 ? `(${group})` : `[${sudoku_id}]`}</Card.Title>
            <Card.Subtitle><Link to={`/profile/${author_id}`}
                                 onClick={e => e.stopPropagation()}>By {author_name || "Unknown"}</Link></Card.Subtitle>
            <Card.Text>
                <span>Puzzle Type: {type.toUpperCase()}</span><br/>
                <span>Author difficulty: {difficultyName(difficulty)}</span><br/>
                <span>Avg. user difficulty: {difficultyName(rating)}</span>
            </Card.Text>
        </Card.Body>
        <Card.Footer>
            {`Has been completed? ${hasBeenCompleted === 1 ? 'YES' : 'NO'}`}
        </Card.Footer>
    </Card>
);


export default Browser;
