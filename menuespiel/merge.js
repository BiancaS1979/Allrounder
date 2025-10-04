const game = document.getElementById("game");
const scoreDisplay = document.getElementById("score");
const highscoreDisplay = document.getElementById("highscore");
const restartBtn = document.getElementById("restart");
const overlay = document.getElementById("overlay");

const size = 4;
let grid;
let score;
let highscore = localStorage.getItem("mergeHighscore") || 0;

const mergeChain = ["smileshy", "smilelove", "smileparty", "ufofly"];
const assets = {
    smileshy: "./images/smileshy.png",
    smilelove: "./images/smilelove.png",
    smileparty: "./images/smileparty.png",
    ufofly: "./images/ufofly.png"
};

const points = {
    smileshy: 10,
    smilelove: 20,
    smileparty: 50,
    ufofly: 100
};

function initGame() {
    grid = Array(size * size).fill(null);
    score = 0;
    updateScore(0, true);
    updateHighscoreDisplay();
    spawnStartItems();
    render();
}

function spawnStartItems() {
    spawnRandomItem();
    spawnRandomItem();
    spawnRandomItem();
}

function spawnRandomItem() {
    const emptyCells = grid.map((val, i) => val === null ? i : null).filter(v => v !== null);
    if (emptyCells.length === 0) return;
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    let rand = Math.random();
    if (score < 100) {
        if (rand < 0.7) grid[randomCell] = "smileshy";
        else if (rand < 0.9) grid[randomCell] = "smilelove";
        else grid[randomCell] = "smileparty";
        
    }

    else if (score < 300) {
        if (rand < 0.5) grid[randomCell] = "smileshy";
        else if (rand < 0.8) grid[randomCell] = "smilelove";
        else grid[randomCell]= "smileparty";
        
    }

    else {
        if (rand < 0.3) grid[randomCell] = "smileshy";
        else if (rand < 0.6) grid[randomCell] = "smilelove";
        else grid[randomCell]= "smileparty";
    }
}

function updateScore(value, reset = false) {
    if (reset) score = 0;
    else score += value;
    scoreDisplay.textContent = `Punkte: ${score}`;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem("mergeHighscore", highscore);
        updateHighscoreDisplay();
    }
}

function updateHighscoreDisplay() {
    highscoreDisplay.textContent = `Highscore: ${highscore}`;
}

function checkGameOver() {
    if (grid.every(cell => cell !== null)) {
        overlay.style.display = "flex";
    }
}

function render() {
    game.innerHTML = "";
    grid.forEach((item, i) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;

        if (item) {
            const img = document.createElement("img");
            img.src = assets[item];
            img.classList.add("item");
            img.draggable = true;

            img.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("from", i);
            });

            cell.appendChild(img);
        }

        cell.addEventListener("dragover", (e) => e.preventDefault());

        cell.addEventListener("drop", (e) => {
            const from = e.dataTransfer.getData("from");
            const to = i;

            if (from == to) return;

            if (grid[to] === null) {
                grid[to] = grid[from];
                grid[from] = null;
                spawnRandomItem();
            }

            else if (grid[to] === grid[from]) {
                const currentIndex = mergeChain.indexOf(grid[to]);
                if (currentIndex < mergeChain.length - 1) {
                    const newItem = mergeChain[currentIndex + 1];
                    grid[to] = newItem;
                    updateScore(points[newItem]);
                }

                grid[from] = null;
                spawnRandomItem();

            }

            render();
            checkGameOver();

        });

        game.appendChild(cell);

     });
}

function restartGame() {
    overlay.style.display = "none";
    initGame();
}

restartBtn.addEventListener("click", restartGame);

initGame();
