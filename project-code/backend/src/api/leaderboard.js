const express = require("express");
const auth = require("../middleware/auth");
const {wrapHandler} = require("../util/error");
const {db} = require("../util/db");
const router = express.Router();


router.get("/", auth, wrapHandler(async (req,res, next) => {

    // If all ok send response
    const getLeaderboard = `SELECT username, points
                            FROM Users
                            ORDER BY points DESC;`
    db.all(getLeaderboard, (err, leaderboard) => {
        if (err) {
            return next(err);
        }
        res.send(leaderboard);

    });
}));


module.exports = router;