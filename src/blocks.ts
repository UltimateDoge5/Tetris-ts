type tetrominoType = "I" | "T" | "O" | "L" | "J" | "S" | "Z";

class Tetromino {
    x: number;
    y: number = 0;
    type: tetrominoType;
    r: number;
    cells: Cell[] = [];
    myGrid!: Grid;
    constructor(type: tetrominoType, middle: number, myGrid?: Grid) {
        this.type = type;
        this.r = blocks[this.type].defaultRotationIndex! | 0;
        this.x = middle;
        this.myGrid = myGrid || game.grid;
        this.draw();
    }

    draw = () => {
        for (let cell of this.cells) {
            cell.isBlock = false;
            cell.divRelative.style.backgroundColor = "#ffffff"
        }
        this.cells = [];

        if (!this.checkForFit(this.x, this.y, this.type, this.r)) {
            clearTimeout(game.cycle)
            if (game.isPlaying == true) {
                game.isPlaying = false;
                return game.gameOver()
            }
            return true;
        }

        for (let y = 0; y < blocks[this.type].shape[this.r].length; y++) {
            for (let x = 0; x < blocks[this.type].shape[this.r][y].length; x++) {
                const cell = this.myGrid.getCell(this.x + x - 2, this.y + y);
                if (blocks[this.type].shape[this.r][y][x] == 1) {
                    this.cells.push(cell);
                    cell.divRelative.style.backgroundColor = blocks[this.type].color;
                    cell.isBlock = true;
                }
            }
        }
    }

    moveRight = () => {
        if (!this.borderCollisionCheck(1) && !this.blockCollisionCheck(1)) {
            this.x++;
            this.draw()
        }
    }

    moveLeft = () => {
        if (!this.borderCollisionCheck(-1) && !this.blockCollisionCheck(-1)) {
            this.x--;
            this.draw()
        }
    }

    rotate = () => {
        if (this.r == blocks[this.type].maxRotationIndex) {
            if (this.checkForRotation(0) == false) return false;
            this.r = 0;
        } else {
            if (this.checkForRotation(this.r + 1) == false) return false;
            this.r++;
        }
        this.draw();
    }

    softDrop = () => {
        if (this.checkForSettle() == false) {
            this.y++;
            clearTimeout(game.cycle);
            game.cycle = setTimeout(game.gravityCycle, game.delay);
            this.draw()
            return true;
        }
        this.settle()
        return false;
    }

    hardDrop = () => {
        while (this.softDrop() == true) {}
    }

    borderCollisionCheck = (change: number) => {
        for (let cell of this.cells) {
            if (cell.x + change <= -1 || cell.x + change >= 10) {
                return true;
            }
        }
        return false;
    }

    blockCollisionCheck = (changeX: number) => {
        for (let cell of this.cells) {
            const neighborCell = game.grid.getCell(cell.x + changeX, cell.y)
            if (!this.cells.includes(neighborCell) && neighborCell.isBlock == true) {
                return true;
            }
        }
        return false;
    }

    checkForSettle = () => {
        for (let cell of this.cells) {
            if (cell.y + 1 >= 20) {
                return true;
            }
            const neighborCell = game.grid.getCell(cell.x, cell.y + 1);
            if (!this.cells.includes(neighborCell) && neighborCell.isBlock == true) {
                return true;
            }
        }
        return false;
    }

    checkForFit = (tx: number, ty: number, type: tetrominoType, r: number) => {
        for (let y = 0; y < blocks[type].shape[r].length; y++) {
            for (let x = 0; x < blocks[type].shape[r][y].length; x++) {
                const cell = game.grid.getCell(x + tx - 2, y + ty);

                if (blocks[this.type].shape[r][y][x] == 1) {
                    if (cell.isBlock == true) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    checkForRotation = (rotation: number) => {
        for (let y = 0; y < blocks[this.type].shape[rotation].length; y++) {
            for (let x = 0; x < blocks[this.type].shape[rotation][y].length; x++) {
                const cell = this.myGrid.getCell(this.x + x - 2, this.y + y);
                if (cell == undefined || cell.isBlock && this.cells.includes(cell) == false) {
                    return false;
                }
            }
        }

        return true;
    }

    private settle = (): boolean => {
        //check for line completion
        let row = undefined;
        for (let y = 0; y < game.grid.getGrid().length; y++) {//Get full row
            let isRow = true;
            for (let x = 0; x < game.grid.getGrid()[y].length; x++) {
                if (game.grid.getCell(x, y).isBlock === false) {
                    isRow = false;
                    break;
                }
            }
            if (isRow) {
                row = y;
            }
        }

        if (row == undefined) {
            return game.getNextPiece();
        }

        let gridCopy: any[][] = [];

        for (let y = 0; y < game.grid.getGrid().length; y++) {//copy the game.grid
            gridCopy.push([]);
            for (let x = 0; x < game.grid.getGrid()[y].length; x++) {
                const cell = game.grid.getCell(x, y);
                gridCopy[y].push([cell.isBlock, cell.divRelative.style.backgroundColor]);
            }
        }

        gridCopy.splice(row, 1)//delete full row

        let emptyRow = [];
        for (let x = 0; x < game.grid.getGrid()[0].length; x++) {
            emptyRow.push([false, "#ffffff"]);
        }

        gridCopy.unshift(emptyRow)//Insert one empty row

        for (let y = 0; y < game.grid.getGrid().length; y++) {//Paste the copy
            for (let x = 0; x < gridCopy[y].length; x++) {
                const cell = game.grid.getCell(x, y);
                cell.isBlock = gridCopy[y][x][0];
                cell.divRelative.style.backgroundColor = gridCopy[y][x][1];
            }
        }
        game.clearedRows++;
        return this.settle()//Check for another row
    }
}

type blocksInterface = {
    [x in tetrominoType]: {
        shape: number[][][];
        color: string;
        maxRotationIndex: number;
        defaultRotationIndex?: number;
    };
};

const blocks: blocksInterface = {
    "T": {
        shape: [
            [
                [1, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [0, 1, 0]
            ],
            [
                [0, 1, 0],
                [1, 1, 1]
            ],
            [
                [0, 1, 0],
                [0, 1, 1],
                [0, 1, 0]
            ]
        ],
        defaultRotationIndex: 2,
        maxRotationIndex: 3,
        color: "#ff00c8"
    },
    "I": {
        shape: [
            [
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 0]
            ],
            [
                [1, 1, 1, 1]
            ]
        ],
        maxRotationIndex: 1,
        color: "#11f2fa"
    },
    "O": {
        shape: [
            [
                [1, 1],
                [1, 1]
            ]
        ],
        maxRotationIndex: 0,
        color: "#ffcc00"
    },
    "L": {
        shape: [
            [
                [1, 1, 1],
                [1, 0, 0]
            ],
            [
                [0, 1, 1],
                [0, 0, 1],
                [0, 0, 1]
            ], [
                [0, 0, 1],
                [1, 1, 1]
            ],
            [
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 1]
            ]
        ],
        maxRotationIndex: 3,
        color: "#ff9100"
    },
    "J": {
        shape: [
            [
                [1, 1, 1],
                [0, 0, 1]
            ],
            [
                [0, 0, 1],
                [0, 0, 1],
                [0, 1, 1],
            ],
            [
                [0, 0, 0],
                [1, 0, 0],
                [1, 1, 1],
            ],
            [
                [0, 1, 1],
                [0, 1, 0],
                [0, 1, 0],
            ],

        ],
        maxRotationIndex: 3,
        color: "#001eff"
    },
    "S": {
        shape: [
            [
                [0, 1, 1],
                [1, 1, 0]
            ],
            [
                [1, 0, 0],
                [1, 1, 0],
                [0, 1, 0]
            ],
        ],
        maxRotationIndex: 1,
        color: "#00ff04"
    },
    "Z": {
        shape: [
            [
                [1, 1, 0],
                [0, 1, 1]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0]
            ]
        ],
        maxRotationIndex: 1,
        color: "#f52a2a"
    }
};