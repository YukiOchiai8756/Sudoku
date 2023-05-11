import React from 'react-dom';
import {Card, Col, Container, Row} from "react-bootstrap";
import {useEffect, useState} from "react";
import {request} from "../../util";
import {Link, useNavigate} from "react-router-dom";

/**
 * Display component - Displays a list of puzzles.
 * @returns {JSX.Element}
 * @constructor
 */
export const PuzzleList = ({path}) => {
    const [puzzles, setPuzzles] = useState(null);
    const navigate = useNavigate();
    useEffect(function () {
        request(`/api/user/${path}`)
            .then((r) => {
                if (r && Array.isArray(r)) {
                    setPuzzles(r);
                }
            })
            .catch(err => console.error(err));
    }, [path]);

    if (puzzles === null) {
        return <p>Loading...</p>;
    }

    if (puzzles.length === 0) {
        return <p className="text-center text-muted">Nothing to show</p>
    }

    return (
        <Container>
            <Row>
                {puzzles.map(p => (
                    <PuzzleCard puzzle={p} key={p.commentID || p.puzzleID + path + p.questId} navigate={navigate}/>))}
            </Row>
        </Container>
    )
};

const PuzzleCard = ({
                        puzzle: {puzzleName, likes, author, authorID, puzzleID, dislikes, reviews, puzzleType},
                        navigate
                    }) => (
    <Col md={3}>
        <Card
            onClick={() => (puzzleType < 3 ? navigate(`/sudoku?id=${puzzleID}`) : navigate(`/lightsout?id=${puzzleID}`))}
            style={{cursor: "pointer"}} className="mb-3">
            <Card.Body>
                <Card.Title style={{color: "#2F4F4F"}}>{puzzleName}</Card.Title>
                <Card.Subtitle style={{color: "#4D4D4D"}}><Link to={`/profile/${authorID}`}
                                                                onClick={e => e.stopPropagation()}
                >By {author || "Unknown"}</Link></Card.Subtitle>
                <Card.Text>
                    <span className="" style={{color: "#2F4F4F"}}>{reviews}</span>
                </Card.Text>
            </Card.Body>
            <Card.Footer style={{backgroundColor: "transparent", color: "#2F4F4F"}}>
                <span className="">{likes} Likes, {dislikes} dislikes</span>
            </Card.Footer>
        </Card>
    </Col>
);


export default PuzzleList;
