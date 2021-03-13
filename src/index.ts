class Tetris {
    bag: tetrominoType[] = ["I", "T", "O", "L", "J", "S", "Z"];
    nextTetromino?: tetrominoType;
    nextTetrominoVisual?: Tetromino;
    isPlaying = false;
    isMuted = false;
    clearedRows: number = 0;
    currentPiece?: Tetromino;
    delay = 1500;
    cycle: number = 0;
    timerTime: number = 0;
    timer: number = 0;
    grid: Grid;
    nextPieceGrid: Grid;
    music: HTMLAudioElement;
    rpm: number[] = [];

    constructor() {
        const gridParent = document.querySelector("main") as HTMLDivElement;
        this.grid = new Grid(gridParent, 250, 500, 25);

        const nextTetromionoParent = document.querySelector("#nextTetromino") as HTMLDivElement;
        this.nextPieceGrid = new Grid(nextTetromionoParent, 125, 100, 25);

        this.music = new Audio("./audio/music.mp3");
        this.music.loop = true;
        this.music.volume = 0.1;

        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if (this.isPlaying == false) return false;
            switch (e.code) {
                case "KeyR":
                    this.currentPiece!.rotate();
                    break;
                case "ArrowLeft":
                case "KeyA":
                    this.currentPiece!.moveLeft();
                    break;
                case "ArrowRight":
                case "KeyD":
                    this.currentPiece!.moveRight()
                    break;
                case "Space":
                    this.currentPiece!.hardDrop();
                    break;
                case "ArrowDown":
                case "KeyS":
                    this.currentPiece!.softDrop();
                    break;
                case "Escape":
                    e.preventDefault()
                    this.pause();
                    break;
                default:
                    break;
            }
        });
    }

    getBlockFromBag = () => {
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
        this.nextTetrominoVisual = new Tetromino(this.nextTetromino, 3, this.nextPieceGrid)
        this.bag.splice(rand, 1);
        return block;
    }

    pause = () => {
        this.isPlaying = false;
        this.music.pause();
        clearInterval(this.timer)
        clearTimeout(this.cycle);
        document.getElementById("pauseOverlay")!.style.display = "flex";
        document.getElementById("resume")!.style.display = "block";
        document.getElementById("pauseTimer")!.style.display = "none";
    }

    resume = () => {
        document.getElementById("pauseTimer")!.style.display = "block";
        document.getElementById("resume")!.style.display = "none";
        document.getElementById("pauseTimer")!.textContent = "3";
        let timeleft = 2;
        let timer = setInterval(function () {
            if (timeleft <= 0) {
                clearInterval(timer);
                actualResume()
            }
            document.getElementById("pauseTimer")!.textContent = "" + timeleft;
            timeleft -= 1;
        }, 1000);

        const actualResume = () => {
            document.getElementById("pauseOverlay")!.style.display = "none";
            if (this.isMuted == false) this.music.play();
            this.isPlaying = true
            this.cycle = setTimeout(this.gravityCycle, this.delay);
            this.timer = setTimeout(() => { this.timerTime++; }, 1000)
        }
    }

    start = () => {
        this.grid.clearGrid();
        this.nextPieceGrid.clearGrid();
        this.nextTetromino = undefined;
        this.currentPiece = new Tetromino(this.getBlockFromBag(), this.grid.trueSizeX / 2);
        this.delay = 1500;
        this.cycle = setTimeout(this.gravityCycle, this.delay);
        this.isPlaying = true;
        this.timer = setInterval(() => { this.timerTime++;
            if(this.timerTime % 60 == 0){
                this.rpm.push(this.clearedRows);
                this.clearedRows = 0;
            }
        }, 1000)
        if (!this.isMuted) this.music.play();
    }

    gravityCycle = () => {
        this.currentPiece!.softDrop();
        this.delay -= 1;
    }

    gameOver = () => {
        this.music.pause();
        clearInterval(this.timer);
        clearTimeout(this.cycle);

        const formatTime = () => {
            const timeString = new Date(this.timerTime * 1000).toISOString()
            const minutes = timeString.substr(14, 2);
            const seconds = timeString.substr(17, 2);
            return `<b>${parseInt(minutes)} minutes</b> and <b>${parseInt(seconds)} seconds </b>`;
        }

        document.getElementById("gameOverOverlay")!.style.display = "flex";

        if(this.rpm.length == 0){ 
            this.rpm.push(this.clearedRows);
            this.clearedRows = 0;
        }else if (this.clearedRows != 0){
            this.rpm.push(this.clearedRows);
        }

        const clearedRowsSum = this.rpm.reduce((a,b)=>{
            return a+b;
        });

        document.getElementById("score")!.innerHTML = `You have cleared <b>${clearedRowsSum} rows</b> in ${formatTime()}
        <br> Rows cleared per minute:<b> ${clearedRowsSum / this.rpm.length}</b>`;

        this.clearedRows = 0;
        this.timerTime = 0;
        this.bag = ["I", "T", "O", "L", "J", "S", "Z"];
        this.music.currentTime = 0;
    }

    getNextPiece = () => {
        this.currentPiece = new Tetromino(this.getBlockFromBag(), this.grid.trueSizeX / 2);
        clearTimeout(this.cycle);
        this.cycle = setTimeout(this.gravityCycle, this.delay)
        return true;
    }
}

class Cell {
    x: number;
    y: number;
    size: number;
    divRelative: HTMLDivElement;
    isBlock: boolean = false;
    constructor(y: number, x: number, size: number) {
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
    cellSize: number;
    x: number;
    y: number;
    trueSizeX: number;
    trueSizeY: number;
    grid: Cell[][];
    gameOverEvent: Event;
    HTMLparent: HTMLElement;
    constructor(HTMLparent: HTMLElement, x: number, y: number, cellSize: number) {
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

    drawGrid = () => {
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
    }

    clearGrid = () => {
        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[i].length; j++) {
                const cell = this.getCell(j, i);
                cell.isBlock = false;
                cell.divRelative.style.backgroundColor = "#ffffff";
            }
        }
    }

    getGrid = (): Cell[][] => {
        return this.grid;
    }

    getCell = (x: number, y: number): Cell => {
        return this.grid[y][x];
    }
}

const game = new Tetris();

document.querySelector("#start")!.addEventListener("click", function (this: HTMLButtonElement) {
    game.start();
    this.disabled = true;
})

document.querySelector("#toggleMusic")!.addEventListener("click", function (this: HTMLButtonElement) {
    game.isMuted = !game.isMuted;
    if (game.isMuted) {
        this.textContent = "Unmute";
        game.music.pause();
        game.music.currentTime = 0;
    } else {
        this.textContent = "Mute"
        if (game.isPlaying) game.music.play();
    }
})

document.querySelector("#resume")!.addEventListener("click", game.resume);

document.querySelector("#playAgain")!.addEventListener("click", () => {
    document.getElementById("gameOverOverlay")!.style.display = "none";
    (document.getElementById("start")! as HTMLButtonElement).disabled = false;
})
