const {
    isSolvable,
    isStandard,
    getSolution,
    generatePuzzle, closePool
} = require("../util/solver");

afterAll(()=> {
    return closePool();
});

test("9x9 puzzle is generated", async()=> {
    const puzzle = await generatePuzzle();
    expect(puzzle).toHaveLength(9);
    expect(puzzle.every(i => Array.isArray(i) && i.length === 9)).toBe(true);
    expect(puzzle.every(i => i.every(a => typeof a === "number" && a >= 0 && a <= 9))).toBe(true);
});

test("Solver can solve generated puzzles", async ()=> {
    const puzz = await generatePuzzle();
    const sol = await getSolution(puzz);

    // Basic checks for sol
    expect(sol).toHaveLength(9);
    expect(sol.every(i => Array.isArray(i) && i.length === 9)).toBe(true);
    expect(sol.every(i => i.every(a => typeof a === "number" && a >= 0 && a <= 9))).toBe(true);

    // Check it's an actual solution for puzz
    for (let row = 0; row < puzz.length; row++) {
        for (let col = 0; col < puzz.length; col++) {
            if (puzz[row][col] !== 0) {
                expect(sol[row][col]).toBe(puzz[row][col]);
            }
        }
    }
});

test("Is solvable return false for invalid", async ()=> {
    const simpleUnsolvable = [[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0]];

    const hardUnsolvable = [[4,2,0,0,0,0,0,1,0],[0,3,0,8,0,0,5,0,0],[0,0,6,0,0,0,0,0,0],
                            [0,0,0,2,0,0,0,0,0],[0,0,0,0,0,7,0,6,0],[0,9,0,0,5,0,3,0,0],
                            [1,0,0,0,0,0,0,4,0],[0,5,0,3,0,0,9,0,0],[0,0,7,0,0,6,0,0,8]];

    expect(await isSolvable(simpleUnsolvable)).toBe(false);
    expect(await isSolvable(hardUnsolvable)).toBe(false);
})
test("Is solvable return true for valid", async ()=> {
    const hardSolvable = [[4,0,0,0,0,0,0,1,0],[0,3,0,8,0,0,5,0,0],[0,0,6,0,0,0,0,0,0],
        [0,0,0,2,0,0,0,0,0],[0,0,0,0,0,7,0,6,0],[0,9,0,0,5,0,3,0,0],
        [1,0,0,0,0,0,0,4,0],[0,5,0,3,0,0,9,0,0],[0,0,7,0,0,6,0,0,8]];

    const two = [["1",0,0,0,0,0,0,0,"7"],[0,0,0,0,"8","3","5","6",0],[0,0,"8","6",0,"7",0,0,0],["8",0,0,"4",0,0,"1","7",0],["4",0,"5",0,0,0,"2",0,"6"],[0,0,"6",0,"3",0,0,0,0],[0,"8","4","2",0,"6","9","1","5"],[0,"2","1",0,"5",0,0,0,0],[0,"7","9","3","1","4","6",0,"8"]];

    expect(await isSolvable(hardSolvable)).toBe(true);
})
test("Is standard return true for 9x9", ()=> {
    const puzzle = [[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
                    [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
                    [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0]];

    expect(isStandard(puzzle)).toBe(true);
})
test("Is standard return false for other", ()=>{
    const puzzle = [[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0]];

    const puzzle1 = [[1,2,3,4,5,6,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0]];

    const puzzle2 = [[1,2,3,4,5,6,0,0, 0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],
        [1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0],[1,2,3,4,5,6,0,0,0]];

    expect(isStandard(puzzle)).toBe(false);
    expect(isStandard(puzzle1)).toBe(false);
    expect(isStandard(puzzle2)).toBe(false);
})


function print(puzz) {
    for (const row of puzz) {
        console.log(row.join(", "));
    }
}

