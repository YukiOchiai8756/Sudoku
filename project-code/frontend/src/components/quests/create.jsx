import {useNavigate} from "react-router-dom";
import Browser from "../../browser";
import Button from "react-bootstrap/Button";
import {Col, Container, Form, Row} from "react-bootstrap";
import InputGroup from "react-bootstrap/InputGroup";
import {useContext, useState} from "react";
import {request} from "../../util";
import {AlertContext} from "../Alert";

const MAX_PUZZLES_PER_QUEST = 8;

export const CreateQuest = () => {
    const [questName, setName] = useState("");
    const [puzzles, setPuzzles] = useState([]);
    const [error, setError] = useState(null);
    const nav = useNavigate();

    const makeAlert = useContext(AlertContext);

    function handlePuzzleClick({sudoku_id: id}) {
        for (let c = 0; c < puzzles.length; c++) {
            if (puzzles[c] === id) {
                // Already exists - remove it
                const newArr = [...puzzles];
                newArr.splice(c, 1);
                setPuzzles(newArr);
                return;
            }
        }
        // If we made it out of the loop, isn't already selected
        setPuzzles([id, ...puzzles]);
    }

    async function handleSave() {
        if (!questName || questName.length < 2) {
            return setError("Your quest must have a name with 2 or more characters");
        }
        if (puzzles.length === 0) {
            return setError("You cannot have a quest without puzzles! Why not select some?");
        }

        try {
            const resp = await request(`/api/quest`, {
                method: "POST",
                body: {
                    questName,
                    puzzles
                }
            });

            if (resp && resp.error) {
                setError(`${resp.error}: ${resp.error_description || ""}`);
            }
            if (!resp) {
                // Successfully inserted
                makeAlert("Quest created!", "Your quest can now be played. Click close to be sent back to the quest browser.", () => {
                    nav("/quests");
                });
            }

        } catch (e) {
            setError(e.message || e.error_description || e);
        }

    }

    return (<Browser title={
            <>
                <h1>Choose puzzles to add your quest.</h1>
                <p>You have added {puzzles.length} puzzles. You can
                    add {MAX_PUZZLES_PER_QUEST - puzzles.length} more.</p>
                {error ? <p className="text-danger">{error}</p> : ""}
                <Container className="pb-2">
                    <Row className="justify-content-center">
                        <Col md={1}>
                            <Button variant="secondary" onClick={() => nav("/quests")}>Cancel</Button>
                        </Col>
                        <Col md="3">
                            <InputGroup>
                                <Form.Control
                                    placeholder="Quest name"
                                    aria-label="quest name"
                                    aria-describedby="basic-addon1"
                                    value={questName}
                                    onChange={e => setName(e.target.value)}
                                />
                                <Button variant="success" onClick={handleSave}>Create</Button>
                            </InputGroup>
                        </Col>

                    </Row>
                </Container>
            </>

        }
                     disableRecentlyPlayed={true}
                     selectedPuzzles={puzzles}
                     handleClick={handlePuzzleClick}
        />
    );
};