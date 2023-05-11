// section within the browse page for quest-related info
import React from "react";
import {ProgressBar} from "react-bootstrap";

export const QuestSection = ({questInfo, completed, puzzleId}) => {
    if (questInfo) {
        const {questName, authorName} = questInfo;

        const numberDone = questInfo.puzzles.filter(p => p.userHasCompleted || (p.puzzleID === parseInt(puzzleId, 10) && completed)).length;
        const totalNum = questInfo.puzzles.length;
        const now = Math.floor((numberDone / totalNum) * 100);

        return <div className="mt-2">
            <p>You are solving this puzzle as part of quest <code>{questName}</code> by <code>{authorName}</code>.</p>
            <ProgressBar label={`${now}% of quest done`} now={now} className="rounded-0"/>
        </div>
    } else return ""
};


export default QuestSection;