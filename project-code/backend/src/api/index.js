const express = require('express');
const router = express.Router();
const sudoku = require("./sudoku");
const authentication = require("./auth");
const auth = require("../middleware/auth");
const {HttpError} = require("../util/error");
const user = require("./user");
const quest = require("./quest");
const leaderboard = require("./leaderboard");
const importer = require("./importer");



router.use("/sudoku", sudoku);
router.use("/authentication", authentication);
router.use("/user", user);
router.use("/quest", quest);
router.use("/leaderboard", leaderboard);
router.use("/importer", importer)

router.get("/secret", auth, function (req, res) {
    res.send("Secret page");
})

router.get("/fed-secret", auth.fedapi, function (req, res) {
    res.send("Secret page");
})

router.get("/error", function (_req, _res) {
    throw new HttpError(412, "I'm a Teapot!");

})


router.get("/error2", auth,function (_req, _res) {
    throw new Error("Really bad error");

})

module.exports = router;
