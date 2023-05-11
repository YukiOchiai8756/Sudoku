import {Link, useNavigate} from "react-router-dom";
import {Badge, Button, Col, Row} from "react-bootstrap";
import {PuzzleCard} from "../../browser";
import {PagedList} from "../Pagination";
import {useContext} from "react";
import {UserContext} from "../UserContext";
import {request} from "../../util";
import {AlertContext} from "../Alert";

export const QuestsInner = ({creator}) => {
    const createAlert = useContext(AlertContext);
    const navigate = useNavigate();

    function handleClick(quest, second) {
        if (second === true) {
            return deleteQuest(quest.questId);
        }


        // Open the quest
        if (second) {
            if (second.puzzleType === 3) {
                navigate(`/lightsout?id=${second.puzzleID}&quest=${second.questID}`);
            } else {
                navigate(`/sudoku?id=${second.puzzleID}&quest=${second.questID}`);
            }

        }
    }

    async function deleteQuest(questId) {
        const resp = await request(`/api/quest/${questId}`, {
            method: "DELETE"
        });
        if (resp && resp.error) {
            return createAlert(resp.error.message || resp.error, resp.error_description || resp.error);
        }

        // lazy - should trigger a paged list re-do somehow, but I can't really be bothered
        window.location.reload();
    }

    return (
        <PagedList Element={QuestRow} url={creator ? `/api/user/${creator}/quests` : `/api/quest`} keyName="questId"
                   pageSize={3}
                   handleItemClick={handleClick}
        />
    );
};
export const Quests = ({creatorId}) =>
    <div className='Browser'>
        <h1>Choose your surf quest!</h1>
        <p>A surf quest is a collection of puzzles, complete all of them to finish the quest! <Link to="/quests/create">Create
            quest</Link></p>
        <QuestsInner creator={creatorId}/>
    </div>;

export const QuestRow = ({value, handleClick}) => {
    const user = useContext(UserContext);
    if (value.puzzles.length === 0) return "";

    function click(e, p) {
        if (e.target && e.target.textContent === "Delete") return;
        handleClick(p);
    }

    let completeCount = 0;
    for (const p of value.puzzles) {
        if (p.userHasCompleted) completeCount++;
    }
    const isComplete = completeCount === value.puzzles.length;

    value.puzzles = value.puzzles.map(p => ({
        author_name: p.authorname,
        author_id: p.authorID,
        rating: p.avgUserDifficulty,
        sudoku_id: p.puzzleID,
        title: p.puzzleName,
        type: p.puzzleType,
        group: 19,
        ...p,
    }));


    return <div className="quest" onClick={click}>
        <div>
            <h2 className="d-inline-block quest-heading">{value.questName}</h2>
            {"   "}
            <Link className="d-inline-block text-black" to={`/profile/${value.authorID}`}>By {value.authorName}</Link>
            {"   "}
            {isComplete ?
                <Badge className="my-auto" bg="success">Complete</Badge>
                : <Badge className="my-auto">{completeCount} of {value.puzzles.length}</Badge>
            }

            {"   "}
            {user && user.id === value.authorID && <Button variant="danger" size="sm" onClick={(e) => {
                handleClick(true);
                e.preventDefault()
            }}>Delete</Button>
            }

        </div>

        <Row>
            {
                value.puzzles.map(p => (<Col md="3" key={`${value.questId}-${p.puzzleID}`}>
                    <PuzzleCard puzzle={p}
                                hasBeenCompleted={p.hasBeenCompleted}
                                completed={p.userHasCompleted}
                                handleClick={(e) => click(e, p)}
                    />
                </Col>))
            }
            {value.puzzles.length === 0 ? <p className="">No puzzles in this quest.</p> : ""}
        </Row>
    </div>
}

export default Quests;