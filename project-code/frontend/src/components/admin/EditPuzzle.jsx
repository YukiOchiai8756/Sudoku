import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import {Alert, Form} from "react-bootstrap";
import {request} from "../../util";
import {DifficultySlider} from "../DifficultySlider";
import {Link} from "react-router-dom";

export function EditPuzzle({target, handleClose}) {
    const [puzzle, setPuzzle] = useState(target);
    const {puzzleID, difficultyLevel, avgUserDifficulty, puzzleName} = puzzle;
    const [error, setError] = useState("");


    function handleUpdate(name, value) {
        setPuzzle({
            ...puzzle,
            [name]: value,
            // Update-taint: So we can ignore clicks to save if the user object hasn't actually changed.
            _updated: true
        });
    }

    async function handleSave() {
        delete puzzle._updated;

        const res = await request(`/api/sudoku/${puzzle.puzzleID}`, {
            method: "PATCH",
            body: puzzle
        });

        if (res.error) {
            setError(`${res.error}: ${res.error_description}`);
        } else {
            handleClose(null);
        }
    }

    async function handleDelete() {
        const res = await request(`/api/sudoku/${puzzle.puzzleID}`, {
            method: "DELETE"
        });

        if (res.error) {
            setError(`${res.error}: ${res.error_description}`);
        } else {
            handleClose(null);
        }
    }

    if (!target) return <></>;

    return (

        <Modal show={true} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Puzzle - {puzzleName} ({puzzleID})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error ?
                    <Alert variant="danger">
                        <Alert.Heading>Error saving changes</Alert.Heading>
                        {error}
                    </Alert>

                    : ""}
                <Form>
                    <Form.Group className="mb-3" controlId="editPuzzleName">
                        <Form.Label>Puzzle name</Form.Label>
                        <Form.Control type="text"
                                      placeholder="Enter Puzzle name"
                                      value={puzzleName}
                                      onChange={(e) => handleUpdate("puzzleName", e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="editPuzzleName">
                        <Form.Label>Puzzle difficulty (creator decided)</Form.Label>
                        <DifficultySlider handleUpdate={(v) => handleUpdate("difficultyLevel", v)}
                                          value={difficultyLevel}/>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="editPuzzleName">
                        <Form.Label>Puzzle difficulty (Average rating by solvers)</Form.Label>
                        <DifficultySlider handleUpdate={(v) => handleUpdate("avgUserDifficulty", v)}
                                          value={avgUserDifficulty}/>
                    </Form.Group>

                </Form>
                <hr/>
                <h4>Danger zone</h4>
                <p>Take care when using these buttons. </p>

                <Button variant="danger" onClick={handleDelete}>
                    Delete puzzle
                </Button>
                {"  "}
                <Link to={`/sudoku/?id=${puzzleID}`} className="button">
                    Manage comments
                </Link>

            </Modal.Body>
            <Modal.Footer>


                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="success" onClick={handleSave}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>

    );
}

export default EditPuzzle;