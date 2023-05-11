const express = require("express");
const {wrapHandler, HttpError} = require("../util/error");
const {getQuests, getQuestCount, getQuest, getPuzzle, createQuest, addPuzzlesToQuest, deleteQuest} = require("../util/db");
const auth = require("../middleware/auth");
const PERMISSION = require("../util");
const router = express.Router();
const pagination = require("../middleware/pagination");

router.use(auth);

// Get all quests
router.get("/", pagination, wrapHandler(async (req, res)=> {
    const quests = await getQuests(req.user.userID, req.pagination.offset, req.pagination.size);
    let questCountTotal = await getQuestCount();

    const pageCount = questCountTotal === 0 ? 0 : Math.max(Math.ceil(questCountTotal / req.pagination.size), 1);
    res.send({
        pageCount,
        data: quests
    });
}));

// get a specific quest
router.get("/:id", wrapHandler(async (req, res)=> {
    if (!req.params.id || isNaN(req.params.id)) {
        throw new HttpError(400, "BadID", "Invalid quest id");
    }

    const quest = await getQuest(req.params.id, req.user.userID);
    if (quest) {
        res.send(quest);
    } else {
        throw new HttpError(404, "NotFound", "Quest does not exist.");
    }
}));

// Create quest
router.post("/", wrapHandler(async (req, res)=> {
    const name = req.body.questName;
    const puzzles = req.body.puzzles;

    if (!name || typeof name !== "string" || name.length < 2) {
        throw new HttpError(400, "BadName", "Name must be a string of length 2 or more.");
    }

    if (!puzzles || !Array.isArray(puzzles) || puzzles.length <= 0 || puzzles.length > 8) {
        throw new HttpError(400, "BadPuzzles", "Puzzles must be an array of puzzle ids with between 1 and 8 puzzles.");
    }

    // Check all puzzles are valid
    for (const id of puzzles) {
        const puzz = await getPuzzle(id);

        if (!puzz) {
            throw new HttpError(400, "InvalidPuzzleID", `Puzzle ${id} does not exist.`);
        }
    }

    // Insert quest
    const questId = await createQuest(name, req.user.userID);
    await addPuzzlesToQuest(questId, puzzles);

    res.status(204).send();
}));

// edit quest
router.patch("/:id", wrapHandler(async ()=> {
    throw new HttpError(501, "NotImplemented");
}));

// Delete quest
router.delete("/:id", wrapHandler(async (req, res)=> {
    if (!req.params.id || isNaN(req.params.id)) {
        throw new HttpError(400, "BadID", "Invalid quest id");
    }

    const id = parseInt(req.params.id, 10);
    const quest = await getQuest(id);

    if (!quest) {
        throw new HttpError(400, "InvalidQuestID", `Quest does not exist.`);
    }

    if (req.user.userID !== quest.authorID) {
        if (req.user.permission !== PERMISSION.ADMIN) {
            throw new HttpError(403, "Forbidden", "You cannot delete a quest you don't own, unless you are an admin.");
        }
    }

    await deleteQuest(id);

    res.status(204).send();
}));


module.exports = router;