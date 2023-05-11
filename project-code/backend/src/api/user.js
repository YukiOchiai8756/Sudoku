/*
    User related-endpoints including:
    Note: All :id can be either the user id, or @me. Obviously, a user can only delete other users if they are an
          Administrator.
    PATCH /:id/email :id or @me
    PATCH /:id/password id or @me
    POST /:id/sign-out-all-sessions :id or @me
    DELETE /:id

    GET /:id/creations
    GET /:id/solved
    GET /:id/likes
    GET /:id/comments
    GET /:id/


 */

const express = require("express");
const {HttpError, wrapHandler} = require("../util/error");
const router = express.Router();
const auth = require("../middleware/auth");
const {PERMISSION} = require("../util");
const {getComments, getSolved, getUserById, getCreations, updateRecent, getRecent, getLiked, getExternal,
    getByEmailOrUsername,
    updateUser, getAllUsers, deleteUser, getQuestsByUser, getQuests, getQuestCount, getLikes
} = require("../util/db");
const bcrypt = require("bcrypt");
const pagination = require("../middleware/pagination");


// When they're not an admin (which isn't a thing rn).
router.use(auth);

/**
 * Populate request.target.
 */
router.use("/:id/", wrapHandler(async (req, _res, next) => {
    const {id} = req.params;

    if (id === "@me") {
        req.target = req.user;
        req.permission = req.user.permission;
        return next();
    }

    if (!id) {
        throw new HttpError(400, "InvalidId", "Please provide a valid user id.")
    }

    const user = await getUserById(id);

    if (!user) {
        return next(new HttpError(400, "BadId", "You supplied an invalid user id."));
    }

    req.target = user;
    req.permission = req.user.permission;
    return next();
}));

router.get("/", requiredPermission(PERMISSION.Admin), wrapHandler(async (req, res)=> {
    const users = await getAllUsers();
    res.send(users);
}));




function requiredPermission(required) {
    return (req, _res, next) => {
        if (req.user.permission >= required || req.target && (req.target.userId === req.user)) {
            return next();
        } else {
            return next(new HttpError(403, "Forbidden", "You do not have permission."))
        }
    };
}

/**
 * Get the user object for a given user id.
 */
router.get("/:id", wrapHandler(async (req, res) => {
    const {userID, username, permission, points} = req.target;

    const externalInfo = await getExternal(userID);

    const externalToSend = externalInfo ? {
        externalID: externalInfo.externalId,
        groupID: externalInfo.groupID,
        lastFetched: externalInfo.lastFetched
    } : null;

    let email = null;

    if (req.user.userID === req.target.userID || req.user.permission === PERMISSION.Admin) {
        email = req.target.email;
    }

    res.send({
        username,
        id: userID,
        email,
        permission,
        external: externalToSend || undefined,
        points
    });
}));



/**
 * Get all the puzzles this user has created
 */
router.get("/:id/creations", wrapHandler(async (req, res) => {
    const puzzles = await getCreations(req.target.userID);

    res.send(await addLikesToPuzzles(puzzles));
}));

// Quests this user has created
router.get("/:id/quests", pagination, wrapHandler(async (req, res) => {
    const id = req.params.id;

    if (isNaN(id) || parseInt(id, 10) < 0) throw new HttpError(400, "InvalidId", "Invalid user id.");

    const user = await getUserById(id);

    if (!user) throw new HttpError(404, "UserNotFound", "No user exists with that ID.");

    const quests = await getQuestsByUser(id, req.pagination.offset, req.pagination.size);
    let questCountTotal = await getQuestCount(id);

    const pageCount = questCountTotal === 0 ? 0 : Math.max(Math.floor(questCountTotal / req.pagination.size), 1);

    res.send({
        pageCount,
        data: quests
    });
}));

async function addLikesToPuzzles (puzzles) {
    const promises = [];

    for (const p of puzzles) {
        promises.push(getLikes(p.puzzleID));
    }

    const results = await Promise.all(promises);

    for (let counter = 0; counter < promises.length; counter++) {
        const {likes, dislikes} = results[counter];
        puzzles[counter].likes = likes;
        puzzles[counter].dislikes = dislikes;
    }

    return puzzles;
}

/**
 * Get the puzzles this user has solved
 */
router.get("/:id/solved", wrapHandler(async (req, res) => {
    const puzzles = await getSolved(req.target.userID);

    res.send(await addLikesToPuzzles(puzzles));
}));

router.get("/:id/likes/", wrapHandler(async (req, res) => {
    const puzzles = await getLiked(req.target.userID);
    res.send(await addLikesToPuzzles(puzzles));
}));


router.get("/:id/comments/", wrapHandler(async (req, res) => {
    const puzzles = await getComments(req.target.userID);

    res.send(await addLikesToPuzzles(puzzles));
}));

/**
 * Update user
 */
router.patch("/:id/",requiredPermission(PERMISSION.Admin), wrapHandler(async (req, res)=> {
    const currentInfo = req.target;
    const {
        username: newUsername,
        email: newEmail,
        permission: newPermission,
        password: newPassword,
        external
    } = req.body;

    // Not updating anything is an error.
    let hasUpdatedSomething = false;

    const acceptedNewValues = {...currentInfo};

    if (external && newPermission === undefined) {
        throw new HttpError(422, "UnsupportedOperation", "You cannot update anything other than permission for external users.");
    }

    // Update username
    if (newUsername && newUsername !== currentInfo.username) {
        // todo: validate

        // Check if username in use by group 19 user
        const existingUser = await getByEmailOrUsername(newUsername, null);

        if (existingUser && existingUser.email !== currentInfo.email) {
            throw new HttpError(400, "UsernameTaken", "Username already in use by local user.");
        }

        acceptedNewValues.username = newUsername;
        hasUpdatedSomething = true;
    }

    // Update email
    console.log(newEmail);
    console.log(currentInfo.email);
    if (newEmail && newEmail !== currentInfo.email) {
        // Check if username in use by group 19 user
        const existingUser = await getByEmailOrUsername(null, newEmail);

        if (existingUser && existingUser.username !== currentInfo.username) {
            throw new HttpError(400, "EmailTaken", "Email already in use by local user.");
        }

        acceptedNewValues.email = newEmail;
        hasUpdatedSomething = true;
    }

    // Update password
    if (newPassword && newPassword !== "") {
        const saltRounds = 10;
        acceptedNewValues.password = await bcrypt.hash(newPassword, saltRounds);
        hasUpdatedSomething = true;
    }


    // Permission check
    if (newPermission && newPermission !== req.target.permission) {
        if (req.user.globalID === req.target.globalID) {
            // They are applying the operation to themselves. We blanket prohibit these operations.
            throw new HttpError(422, "SelfPermission", "You cannot alter your own permission.");
        }

        // Check the requested permission is legal
        // Instead of checking <= 2, check it's one of allowed ints. Makes things more flexible.
        const validPermissions = Object.values(PERMISSION);
        let isValid = false;
        for (const v of validPermissions) {
            if (newPermission === v) {
                isValid = true;
                break;
            }
        }

        if (!isValid) {
            throw new HttpError(400, "InvalidPermission", "Supplied permission is not a legal value.");
        }
        acceptedNewValues.permission = newPermission;
        hasUpdatedSomething = true;
    }

    if (!hasUpdatedSomething) {
        throw new HttpError(400, "NoChange", "You must supply some changes to be made.");
    }

    // Make the changes to the database
    await updateUser(acceptedNewValues);

    return res.send(await getUserById(req.target.userID));
}));



router.delete("/:id/", requiredPermission(PERMISSION.Admin), wrapHandler(async (req, res)=> {
    if (req.target.userID === req.user.userID) {
        throw new HttpError(400, "SelfDelete", "You cannot delete your own account in this way.")
    }

    await deleteUser(req.target.userID);

    res.send({
        message: "User deleted."
    })
}));

// A re-sync involves updating user information from source.
router.post("/:id/resync", requiredPermission(PERMISSION.Admin), wrapHandler(async (req, _res)=> {
    if (!req.target.external) {
        throw new HttpError(400, "This endpoint only implies to external users.");
    }
    throw new HttpError(501, "NotImplemented");
}));




router.post("/:id/sign-out", requiredPermission(PERMISSION.Admin), wrapHandler(async (_req, _res)=> {
    // Query params: all - bool
    // if present & true, sign out all sessions & issue a new one
    throw new HttpError(501, "NotImplemented");
}));

/**
 * Update the most recent accessed puzzle
 */
router.post("/:id/upd-recent", wrapHandler(async (req, res) => {
    const puzzleID = req.body.gameID;
    await (updateRecent(req.target.userID, puzzleID));
    res.status(200).send({message: "Insert success"})
}));

/**
 * Obtain the most recent accessed puzzle
 */
router.get("/:id/getRecent", wrapHandler(async (req, res) => {
    const recent = await getRecent(req.target.userID);
    res.send(recent[0]);
}));

module.exports = router;