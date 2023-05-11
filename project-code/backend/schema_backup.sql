-- THIS IS A BACKUP OF THE SCRIPT AS OF 12/03/23.
-- USE THE DUMP SCRIPT TO UPDATE THE DATABASE, NOT THIS FILE.
-- PuzzlesTable definition

CREATE TABLE [Puzzles](
    [puzzleID] INTEGER PRIMARY KEY,
    [difficultyLevel] INTEGER NOT NULL,
    [avgUserDifficulty] INTEGER NOT NULL,
    [puzzleType] INTEGER NOT NULL,
    [puzzleName] TEXT NOT NULL,
    [likes] INTEGER NOT NULL,
    [puzzlesUnSolved] TEXT NOT NULL,
    [puzzleSolved] TEXT NOT NULL,
    [points] INTEGER NOT NULL,
    [hasBeenCompleted] BOOLEAN DEFAULT 0,
    userID INTEGER NOT NULL,
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE
);

CREATE TABLE [PuzzleQuest](
    [questID] INTEGER PRIMARY KEY,
    -- Creator
    [userID] INTEGER NOT NULL,
    [questName] TEXT NOT NULL,
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE
);

CREATE TABLE [PuzzleQuestPart](
    [questID] INTEGER NOT NULL,
    [puzzleID] INTEGER NOT NULL,
    FOREIGN KEY(questID) REFERENCES PuzzleQuest(questID) ON DELETE CASCADE,
    FOREIGN KEY(puzzleID) REFERENCES Puzzles(puzzleID) ON DELETE CASCADE
);


-- UsersTable definition

CREATE TABLE [Users](
    userID INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    secretToken TEXT NOT NULL,
    permission INTEGER DEFAULT (0),
    password TEXT,
    recentlyPlayedPuzzle INTEGER,
    points INTEGER DEFAULT (0),
    FOREIGN KEY (recentlyPlayedPuzzle) REFERENCES Puzzles(puzzleID) ON DELETE SET NULL
    );

-- ExternalUsers definition
CREATE TABLE [ExternalUsers](
    userID INTEGER NOT NULL,
    groupID INTEGER NOT NULL,
    -- Other server's ids are not always integers, despite this being the
    -- agreed-upon data type. So we support that.
    externalID TEXT NOT NULL,
    -- Unix epoch - Seconds since Epoch (... 1970).
    -- more efficient than storing as ISO time string, but a bit unwieldy.
    -- ... but also works quite nicely w/ JS Date types
    lastFetched INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    token TEXT NOT NULL,

    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE SET NULL,
    CONSTRAINT PK PRIMARY KEY(userID)
);


-- LeaderBoardTable definition

CREATE TABLE [LeaderBoard](
    userID INTEGER NOT NULL,
    puzzlesSolved INTEGER NOT NULL,
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE,
    CONSTRAINT user PRIMARY KEY(userID)
    );


-- OAuthTokens definition

CREATE TABLE [OAuthTokens](
    userID INTEGER NOT NULL,
    token varchar(100) NOT NULL,
    serverID INTEGER NOT NULL,
    CONSTRAINT PK PRIMARY KEY(userID, serverID),
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE
);


-- PuzzleAttemptNumber definition

CREATE TABLE [PuzzleAttemptNumber](
    userID INTEGER NOT NULL,
    puzzleID INTEGER NOT NULL,
    attemptNumber INTEGER NOT NULL,
    CONSTRAINT PK PRIMARY KEY(userID, puzzleID),
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE,
    FOREIGN KEY(puzzleID) REFERENCES Puzzles(puzzleID) ON DELETE CASCADE
    );


-- PuzzlesCommentsTable definition

CREATE TABLE [PuzzlesComments](
    commentID INTEGER PRIMARY KEY,
    parentID INTEGER,
    puzzleID INTEGER NOT NULL,
    userID INTEGER NOT NULL,
    reviews TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY(puzzleID) REFERENCES Puzzles(puzzleID) ON DELETE CASCADE,
    FOREIGN KEY(parentID) REFERENCES Puzzles(puzzleID) ON DELETE SET NULL,
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE
    );




-- PuzzlesLikedTable definition

CREATE TABLE PuzzlesLiked(
    puzzleID INTEGER NOT NULL,
    userID INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    isDislike BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT PK PRIMARY KEY(userID, puzzleID),
    FOREIGN KEY(puzzleID) REFERENCES Puzzles(puzzleID) ON DELETE CASCADE,
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE
);
CREATE TABLE [PuzzlesSolved](
                                userID INTEGER NOT NULL,
                                puzzleID INTEGER NOT NULL, puzzleDifficultyRating INTEGER,
                                CONSTRAINT PK PRIMARY KEY(userID, puzzleID),
                                FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE,
                                FOREIGN KEY(puzzleID) REFERENCES Puzzles(puzzleID) ON DELETE CASCADE
);

CREATE INDEX PuzzlesSolvedTable_puzzleDifficultyRating_IDX ON PuzzlesSolved (puzzleDifficultyRating);

-- PuzzlesProgressTable definition
CREATE TABLE PuzzlesProgress(
    userID varchar(20) NOT NULL,
    puzzleID INTEGER NOT NULL,
    puzzleProgress TEXT NOT NULL,
    FOREIGN KEY(puzzleID) REFERENCES Puzzles(puzzleID) ON DELETE CASCADE,
    FOREIGN KEY(userID) REFERENCES Users(userID) ON DELETE CASCADE
);
