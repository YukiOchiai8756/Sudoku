import {Table} from "react-bootstrap";
import {difficultyName} from "../DifficultySlider";


export function PuzzleList({items, select}) {
    return (
        <Table hover>
            <thead>
            <tr>
                <th>id</th>
                <th>Name</th>
                <th>Created by</th>
                <th>Type</th>
                <th>Difficulty</th>
                <th>Difficulty (avg. user)</th>
                <th>Likes</th>
                <th>Points</th>
            </tr>
            </thead>
            <tbody>
            {
                items.map(u => (<PuzzleTableRow puzzle={u} key={u.puzzleID} handleClick={select}/>))
            }
            </tbody>
        </Table>
    );
}

function PuzzleTableRow({puzzle, handleClick}) {
    const {puzzleID, difficultyLevel, avgUserDifficulty, puzzleType, puzzleName, likes, points, authorName} = puzzle;
    return (<tr onClick={() => handleClick(puzzle)} style={{cursor: "pointer"}}>
        <td>{puzzleID}</td>
        <td>{puzzleName}</td>
        <td>{authorName}</td>
        <td>{puzzleType}</td>
        <td>{difficultyName(difficultyLevel)}</td>
        <td>{difficultyName(avgUserDifficulty)}</td>
        <td>{likes}</td>
        <td>{points}</td>

    </tr>)
}

export default PuzzleList;
