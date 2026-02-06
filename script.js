const DOTS_PER_SIDE = 5;
const GRID_SIZE = DOTS_PER_SIDE * 2 - 1;

const grid = document.getElementById("grid");
const currentPlayerEl = document.getElementById("current-player");
const scoreOneEl = document.getElementById("score-one");
const scoreTwoEl = document.getElementById("score-two");
const resetButton = document.getElementById("reset");
const gameMessage = document.getElementById("game-message");

let horizontalLines = [];
let verticalLines = [];
let boxes = [];
let currentPlayer = 1;
let scores = [0, 0];
let totalBoxes = (DOTS_PER_SIDE - 1) * (DOTS_PER_SIDE - 1);

const buildState = () => {
  horizontalLines = Array.from({ length: DOTS_PER_SIDE }, () =>
    Array.from({ length: DOTS_PER_SIDE - 1 }, () => 0)
  );
  verticalLines = Array.from({ length: DOTS_PER_SIDE - 1 }, () =>
    Array.from({ length: DOTS_PER_SIDE }, () => 0)
  );
  boxes = Array.from({ length: DOTS_PER_SIDE - 1 }, () =>
    Array.from({ length: DOTS_PER_SIDE - 1 }, () => 0)
  );
  currentPlayer = 1;
  scores = [0, 0];
  totalBoxes = (DOTS_PER_SIDE - 1) * (DOTS_PER_SIDE - 1);
};

const renderGrid = () => {
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 32px)`;
  grid.style.gridTemplateRows = `repeat(${GRID_SIZE}, 32px)`;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (row % 2 === 0 && col % 2 === 0) {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        cell.appendChild(dot);
      } else if (row % 2 === 0 && col % 2 === 1) {
        cell.classList.add("line", "horizontal");
        cell.dataset.type = "h";
        cell.dataset.row = `${row / 2}`;
        cell.dataset.col = `${(col - 1) / 2}`;
        cell.addEventListener("click", handleLineClick);
      } else if (row % 2 === 1 && col % 2 === 0) {
        cell.classList.add("line", "vertical");
        cell.dataset.type = "v";
        cell.dataset.row = `${(row - 1) / 2}`;
        cell.dataset.col = `${col / 2}`;
        cell.addEventListener("click", handleLineClick);
      } else {
        cell.classList.add("box");
        cell.dataset.type = "b";
        cell.dataset.row = `${(row - 1) / 2}`;
        cell.dataset.col = `${(col - 1) / 2}`;
      }

      grid.appendChild(cell);
    }
  }
};

const updateUI = () => {
  currentPlayerEl.textContent = `Player ${currentPlayer}`;
  currentPlayerEl.classList.toggle("player-one", currentPlayer === 1);
  currentPlayerEl.classList.toggle("player-two", currentPlayer === 2);
  scoreOneEl.textContent = scores[0];
  scoreTwoEl.textContent = scores[1];

  if (scores[0] + scores[1] === totalBoxes) {
    if (scores[0] === scores[1]) {
      gameMessage.textContent = "It's a tie! Reset to play again.";
    } else {
      const winner = scores[0] > scores[1] ? "Player 1" : "Player 2";
      gameMessage.textContent = `${winner} wins the game!`;
    }
  } else {
    gameMessage.textContent = "";
  }
};

const setLineOwner = (type, row, col, player) => {
  const selector = `.line[data-type="${type}"][data-row="${row}"][data-col="${col}"]`;
  const lineEl = grid.querySelector(selector);
  if (lineEl) {
    lineEl.classList.add("taken", player === 1 ? "player-one" : "player-two");
  }
};

const setBoxOwner = (row, col, player) => {
  const selector = `.box[data-row="${row}"][data-col="${col}"]`;
  const boxEl = grid.querySelector(selector);
  if (boxEl) {
    boxEl.classList.add(player === 1 ? "player-one" : "player-two");
  }
};

const isBoxComplete = (row, col) => {
  return (
    horizontalLines[row][col] &&
    horizontalLines[row + 1][col] &&
    verticalLines[row][col] &&
    verticalLines[row][col + 1]
  );
};

const claimBox = (row, col) => {
  if (!boxes[row][col]) {
    boxes[row][col] = currentPlayer;
    scores[currentPlayer - 1] += 1;
    setBoxOwner(row, col, currentPlayer);
    return true;
  }
  return false;
};

const checkAdjacentBoxes = (type, row, col) => {
  const completed = [];
  if (type === "h") {
    if (row > 0 && isBoxComplete(row - 1, col)) {
      completed.push([row - 1, col]);
    }
    if (row < DOTS_PER_SIDE - 1 && isBoxComplete(row, col)) {
      completed.push([row, col]);
    }
  }

  if (type === "v") {
    if (col > 0 && isBoxComplete(row, col - 1)) {
      completed.push([row, col - 1]);
    }
    if (col < DOTS_PER_SIDE - 1 && isBoxComplete(row, col)) {
      completed.push([row, col]);
    }
  }

  return completed;
};

const handleLineClick = (event) => {
  const { type, row, col } = event.currentTarget.dataset;
  const rowIndex = Number(row);
  const colIndex = Number(col);

  if (type === "h" && horizontalLines[rowIndex][colIndex]) {
    return;
  }

  if (type === "v" && verticalLines[rowIndex][colIndex]) {
    return;
  }

  if (type === "h") {
    horizontalLines[rowIndex][colIndex] = currentPlayer;
  } else {
    verticalLines[rowIndex][colIndex] = currentPlayer;
  }

  setLineOwner(type, rowIndex, colIndex, currentPlayer);

  const boxesCompleted = checkAdjacentBoxes(type, rowIndex, colIndex);
  let scored = false;
  boxesCompleted.forEach(([boxRow, boxCol]) => {
    if (claimBox(boxRow, boxCol)) {
      scored = true;
    }
  });

  if (!scored) {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
  }

  updateUI();
};

const resetGame = () => {
  buildState();
  renderGrid();
  updateUI();
};

resetButton.addEventListener("click", resetGame);

buildState();
renderGrid();
updateUI();
