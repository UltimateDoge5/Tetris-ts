"use strict";
class Tetris {
    constructor() {
        this.bag = ["I", "T", "O", "L", "J", "S", "Z"];
        this.isPlaying = false;
        this.isMuted = false;
        this.clearedRows = 0;
        this.delay = 1500;
        this.cycle = 0;
        this.timerTime = 0;
        this.timer = 0;
        this.rpm = [];
        this.getBlockFromBag = () => {
            if (this.bag.length == 0) {
                this.bag = ["I", "T", "O", "L", "J", "S", "Z"];
            }
            if (this.nextTetromino == undefined) {
                const rand = Math.floor(Math.random() * (this.bag.length - 0)) + 0;
                this.nextTetromino = this.bag[rand];
                this.bag.splice(rand, 1);
            }
            const rand = Math.floor(Math.random() * (this.bag.length - 0)) + 0;
            const block = this.nextTetromino;
            this.nextTetromino = this.bag[rand];
            this.nextPieceGrid.clearGrid();
            this.nextTetrominoVisual = new Tetromino(this.nextTetromino, 3, this.nextPieceGrid);
            this.bag.splice(rand, 1);
            return block;
        };
        this.pause = () => {
            this.isPlaying = false;
            this.music.pause();
            clearInterval(this.timer);
            clearTimeout(this.cycle);
            document.getElementById("pauseOverlay").style.display = "flex";
            document.getElementById("resume").style.display = "block";
            document.getElementById("pauseTimer").style.display = "none";
        };
        this.resume = () => {
            document.getElementById("pauseTimer").style.display = "block";
            document.getElementById("resume").style.display = "none";
            document.getElementById("pauseTimer").textContent = "3";
            let timeleft = 2;
            let timer = setInterval(function () {
                if (timeleft <= 0) {
                    clearInterval(timer);
                    actualResume();
                }
                document.getElementById("pauseTimer").textContent = "" + timeleft;
                timeleft -= 1;
            }, 1000);
            const actualResume = () => {
                document.getElementById("pauseOverlay").style.display = "none";
                if (this.isMuted == false)
                    this.music.play();
                this.isPlaying = true;
                this.cycle = setTimeout(this.gravityCycle, this.delay);
                this.timer = setTimeout(() => { this.timerTime++; }, 1000);
            };
        };
        this.start = () => {
            this.grid.clearGrid();
            this.nextPieceGrid.clearGrid();
            this.nextTetromino = undefined;
            this.currentPiece = new Tetromino(this.getBlockFromBag(), this.grid.trueSizeX / 2);
            this.delay = 1500;
            this.cycle = setTimeout(this.gravityCycle, this.delay);
            this.isPlaying = true;
            this.timer = setInterval(() => {
                this.timerTime++;
                if (this.timerTime % 60 == 0) {
                    this.rpm.push(this.clearedRows);
                    this.clearedRows = 0;
                }
            }, 1000);
            if (!this.isMuted)
                this.music.play();
        };
        this.gravityCycle = () => {
            this.currentPiece.softDrop();
            this.delay -= 1;
        };
        this.gameOver = () => {
            this.music.pause();
            clearInterval(this.timer);
            clearTimeout(this.cycle);
            const formatTime = () => {
                const timeString = new Date(this.timerTime * 1000).toISOString();
                const minutes = timeString.substr(14, 2);
                const seconds = timeString.substr(17, 2);
                return `<b>${parseInt(minutes)} minutes</b> and <b>${parseInt(seconds)} seconds </b>`;
            };
            document.getElementById("gameOverOverlay").style.display = "flex";
            if (this.rpm.length == 0) {
                this.rpm.push(this.clearedRows);
                this.clearedRows = 0;
            }
            else if (this.clearedRows != 0) {
                this.rpm.push(this.clearedRows);
            }
            const clearedRowsSum = this.rpm.reduce((a, b) => {
                return a + b;
            });
            document.getElementById("score").innerHTML = `You have cleared <b>${clearedRowsSum} rows</b> in ${formatTime()}
        <br> Rows cleared per minute:<b> ${clearedRowsSum / this.rpm.length}</b>`;
            this.clearedRows = 0;
            this.timerTime = 0;
            this.bag = ["I", "T", "O", "L", "J", "S", "Z"];
            this.music.currentTime = 0;
        };
        this.getNextPiece = () => {
            this.currentPiece = new Tetromino(this.getBlockFromBag(), this.grid.trueSizeX / 2);
            clearTimeout(this.cycle);
            this.cycle = setTimeout(this.gravityCycle, this.delay);
            return true;
        };
        const gridParent = document.querySelector("main");
        this.grid = new Grid(gridParent, 250, 500, 25);
        const nextTetromionoParent = document.querySelector("#nextTetromino");
        this.nextPieceGrid = new Grid(nextTetromionoParent, 125, 100, 25);
        this.music = new Audio("./audio/music.mp3");
        this.music.loop = true;
        this.music.volume = 0.1;
        document.addEventListener("keydown", (e) => {
            if (this.isPlaying == false)
                return false;
            switch (e.code) {
                case "KeyR":
                    this.currentPiece.rotate();
                    break;
                case "ArrowLeft":
                case "KeyA":
                    this.currentPiece.moveLeft();
                    break;
                case "ArrowRight":
                case "KeyD":
                    this.currentPiece.moveRight();
                    break;
                case "Space":
                    this.currentPiece.hardDrop();
                    break;
                case "ArrowDown":
                case "KeyS":
                    this.currentPiece.softDrop();
                    break;
                case "Escape":
                    e.preventDefault();
                    this.pause();
                    break;
                default:
                    break;
            }
        });
    }
}
class Cell {
    constructor(y, x, size) {
        this.isBlock = false;
        this.x = x;
        this.y = y;
        this.size = size;
        this.divRelative = document.createElement("div");
        this.divRelative.style.width = `${this.size}px`;
        this.divRelative.style.height = `${this.size}px`;
        this.divRelative.classList.add("cell");
        this.divRelative.dataset.x = this.x.toString();
        this.divRelative.dataset.y = this.y.toString();
    }
}
class Grid {
    constructor(HTMLparent, x, y, cellSize) {
        this.drawGrid = () => {
            this.HTMLparent.innerHTML = "";
            for (let i = 0; i < this.trueSizeY; i++) {
                this.grid.push([]);
                let row = document.createElement("div");
                row.classList.add("row");
                for (let j = 0; j < this.trueSizeX; j++) {
                    this.grid[i][j] = new Cell(i, j, this.cellSize);
                    row.append(this.grid[i][j].divRelative);
                }
                this.HTMLparent.append(row);
            }
        };
        this.clearGrid = () => {
            for (let i = 0; i < this.grid.length; i++) {
                for (let j = 0; j < this.grid[i].length; j++) {
                    const cell = this.getCell(j, i);
                    cell.isBlock = false;
                    cell.divRelative.style.backgroundColor = "#ffffff";
                }
            }
        };
        this.getGrid = () => {
            return this.grid;
        };
        this.getCell = (x, y) => {
            return this.grid[y][x];
        };
        this.cellSize = cellSize;
        this.x = x;
        this.y = y;
        this.grid = [];
        this.gameOverEvent = new Event('gameOverEvent');
        this.HTMLparent = HTMLparent;
        this.trueSizeX = Math.round(this.x / this.cellSize);
        this.trueSizeY = Math.round(this.y / this.cellSize);
        this.HTMLparent.classList.add("gridParent");
        this.drawGrid();
    }
}
const game = new Tetris();
document.querySelector("#start").addEventListener("click", function () {
    game.start();
    this.disabled = true;
});
document.querySelector("#toggleMusic").addEventListener("click", function () {
    game.isMuted = !game.isMuted;
    if (game.isMuted) {
        this.textContent = "Unmute";
        game.music.pause();
        game.music.currentTime = 0;
    }
    else {
        this.textContent = "Mute";
        if (game.isPlaying)
            game.music.play();
    }
});
document.querySelector("#resume").addEventListener("click", game.resume);
document.querySelector("#playAgain").addEventListener("click", () => {
    document.getElementById("gameOverOverlay").style.display = "none";
    document.getElementById("start").disabled = false;
});
//# sourceMappingURL=index.js.map