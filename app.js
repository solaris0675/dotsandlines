const { supabaseUrl, supabaseAnonKey } = window.DOTS_LINES_CONFIG;
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

const colors = [
  "#4d7cff",
  "#ff9f43",
  "#54d98c",
  "#f368e0",
  "#00d2d3",
  "#ff6b6b",
  "#48dbfb",
  "#feca57",
  "#5f27cd",
  "#1dd1a1",
];

const state = {
  roomCode: null,
  playerId: null,
  playerName: null,
  maxPlayers: 10,
  boardSize: 10,
  players: [],
  turnIndex: 0,
  board: [],
  lines: new Map(),
  channel: null,
};

const dom = {
  roomCode: document.getElementById("roomCode"),
  playerName: document.getElementById("playerName"),
  boardSize: document.getElementById("boardSize"),
  maxPlayers: document.getElementById("maxPlayers"),
  createRoom: document.getElementById("createRoom"),
  joinRoom: document.getElementById("joinRoom"),
  status: document.getElementById("status"),
  turnStatus: document.getElementById("turnStatus"),
  roomStatus: document.getElementById("roomStatus"),
  board: document.getElementById("board"),
  playerList: document.getElementById("playerList"),
};

const randomId = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const ensurePlayer = (player) => {
  if (!player) {
    return;
  }
  const exists = state.players.some((entry) => entry.id === player.id);
  if (!exists) {
    state.players.push({ ...player, score: player.score ?? 0 });
  }
};

const isHost = () => state.players[0]?.id === state.playerId;

const setStatus = (text) => {
  dom.status.textContent = text;
};

const setTurnStatus = () => {
  if (state.players.length === 0) {
    dom.turnStatus.textContent = "Waiting for players";
    return;
  }
  const current = state.players[state.turnIndex] ?? state.players[0];
  dom.turnStatus.textContent = `${current.name}'s turn`;
};

const setRoomStatus = () => {
  dom.roomStatus.textContent = state.roomCode ?? "-";
};

const resetBoard = () => {
  state.lines.clear();
  state.board = Array.from({ length: state.boardSize - 1 }, () =>
    Array.from({ length: state.boardSize - 1 }, () => null),
  );
};

const buildBoard = () => {
  dom.board.innerHTML = "";
  dom.board.style.gridTemplateColumns = `repeat(${state.boardSize * 2 - 1}, auto)`;
  dom.board.style.gridTemplateRows = `repeat(${state.boardSize * 2 - 1}, auto)`;

  for (let row = 0; row < state.boardSize * 2 - 1; row += 1) {
    for (let col = 0; col < state.boardSize * 2 - 1; col += 1) {
      const isDot = row % 2 === 0 && col % 2 === 0;
      const isHorizontal = row % 2 === 0 && col % 2 === 1;
      const isVertical = row % 2 === 1 && col % 2 === 0;
      const cell = document.createElement("div");

      if (isDot) {
        cell.className = "dot";
      } else if (isHorizontal || isVertical) {
        cell.className = `line ${isHorizontal ? "horizontal" : "vertical"} available`;
        cell.dataset.lineKey = `${row},${col}`;
        cell.addEventListener("click", () => handleLineClick(row, col));
      } else {
        cell.className = "cell";
        cell.dataset.cellKey = `${row},${col}`;
      }

      dom.board.appendChild(cell);
    }
  }
};

const updateBoardStyles = () => {
  for (const [key, playerIndex] of state.lines.entries()) {
    const line = dom.board.querySelector(`[data-line-key="${key}"]`);
    if (line) {
      line.classList.remove("available");
      line.classList.add("claimed");
      line.style.background = colors[playerIndex];
    }
  }

  dom.board.querySelectorAll(".cell").forEach((cell) => {
    const [row, col] = cell.dataset.cellKey.split(",").map(Number);
    const boxRow = Math.floor(row / 2);
    const boxCol = Math.floor(col / 2);
    const owner = state.board[boxRow][boxCol];
    if (owner !== null) {
      cell.style.background = colors[owner];
      cell.textContent = state.players[owner]?.name?.[0] ?? "";
    }
  });
};

const updatePlayers = () => {
  dom.playerList.innerHTML = "";
  state.players.forEach((player, index) => {
    const item = document.createElement("li");
    item.className = "player";
    const swatch = document.createElement("span");
    swatch.className = "player__swatch";
    swatch.style.background = colors[index];
    const label = document.createElement("span");
    label.textContent = `${player.name} (${player.score})`;
    if (index === state.turnIndex) {
      label.textContent += " • turn";
    }
    item.appendChild(swatch);
    item.appendChild(label);
    dom.playerList.appendChild(item);
  });
  setTurnStatus();
};

const calculateBoxes = (row, col, playerIndex) => {
  const claimedBoxes = [];
  const isHorizontal = row % 2 === 0;
  const rowIndex = Math.floor(row / 2);
  const colIndex = Math.floor(col / 2);

  const checkBox = (boxRow, boxCol) => {
    if (
      boxRow < 0 ||
      boxCol < 0 ||
      boxRow >= state.boardSize - 1 ||
      boxCol >= state.boardSize - 1
    ) {
      return;
    }

    const top = `${boxRow * 2},${boxCol * 2 + 1}`;
    const bottom = `${boxRow * 2 + 2},${boxCol * 2 + 1}`;
    const left = `${boxRow * 2 + 1},${boxCol * 2}`;
    const right = `${boxRow * 2 + 1},${boxCol * 2 + 2}`;
    if (
      state.lines.has(top) &&
      state.lines.has(bottom) &&
      state.lines.has(left) &&
      state.lines.has(right)
    ) {
      if (state.board[boxRow][boxCol] === null) {
        state.board[boxRow][boxCol] = playerIndex;
        claimedBoxes.push([boxRow, boxCol]);
      }
    }
  };

  if (isHorizontal) {
    checkBox(rowIndex - 1, colIndex);
    checkBox(rowIndex, colIndex);
  } else {
    checkBox(rowIndex, colIndex - 1);
    checkBox(rowIndex, colIndex);
  }

  return claimedBoxes;
};

const advanceTurn = (extraTurn) => {
  if (!extraTurn) {
    state.turnIndex = (state.turnIndex + 1) % state.players.length;
  }
};

const applyMove = ({ lineKey, playerIndex }) => {
  if (state.lines.has(lineKey)) {
    return;
  }
  const [row, col] = lineKey.split(",").map(Number);
  state.lines.set(lineKey, playerIndex);
  const claimed = calculateBoxes(row, col, playerIndex);
  if (claimed.length > 0) {
    state.players[playerIndex].score += claimed.length;
  }
  advanceTurn(claimed.length > 0);
  updateBoardStyles();
  updatePlayers();
};

const sendMove = async (lineKey) => {
  const playerIndex = state.players.findIndex((p) => p.id === state.playerId);
  if (playerIndex !== state.turnIndex) {
    return;
  }
  await state.channel.send({
    type: "broadcast",
    event: "move",
    payload: { lineKey, playerIndex },
  });
  applyMove({ lineKey, playerIndex });
};

const handleLineClick = (row, col) => {
  const lineKey = `${row},${col}`;
  if (!state.channel || state.lines.has(lineKey)) {
    return;
  }
  sendMove(lineKey);
};

const broadcastState = async () => {
  await state.channel.send({
    type: "broadcast",
    event: "sync",
    payload: {
      boardSize: state.boardSize,
      maxPlayers: state.maxPlayers,
      players: state.players,
      turnIndex: state.turnIndex,
      lines: Array.from(state.lines.entries()),
      board: state.board,
    },
  });
};

const requestState = async () => {
  await state.channel.send({
    type: "broadcast",
    event: "sync-request",
    payload: {},
  });
};

const updateStateFromSync = (payload) => {
  state.boardSize = payload.boardSize;
  state.maxPlayers = payload.maxPlayers;
  state.players = payload.players.map((player) => ({
    ...player,
    score: player.score ?? 0,
  }));
  state.turnIndex = payload.turnIndex;
  state.lines = new Map(payload.lines);
  state.board = payload.board;
  dom.boardSize.value = state.boardSize;
  dom.maxPlayers.value = state.maxPlayers;
  buildBoard();
  updateBoardStyles();
  updatePlayers();
};

const setupChannel = async () => {
  if (state.channel) {
    await supabase.removeChannel(state.channel);
  }
  state.channel = supabase.channel(`room-${state.roomCode}`, {
    config: { presence: { key: state.playerId } },
  });

  state.channel
    .on("broadcast", { event: "join-request" }, ({ payload }) => {
      if (!isHost()) {
        return;
      }
      ensurePlayer({ id: payload.id, name: payload.name, score: 0 });
      if (state.players.length > state.maxPlayers) {
        state.players = state.players.slice(0, state.maxPlayers);
      }
      updatePlayers();
      broadcastState();
    })
    .on("broadcast", { event: "move" }, ({ payload }) => {
      applyMove(payload);
    })
    .on("broadcast", { event: "sync" }, ({ payload }) => {
      updateStateFromSync(payload);
    })
    .on("broadcast", { event: "sync-request" }, () => {
      const meIndex = state.players.findIndex((p) => p.id === state.playerId);
      if (meIndex === 0) {
        broadcastState();
      }
    })
    .on("presence", { event: "sync" }, () => {
      const presenceState = state.channel.presenceState();
      const roster = Object.values(presenceState).flat();
      const scoreMap = new Map(
        state.players.map((player) => [player.id, player.score ?? 0]),
      );
      state.players = roster.map((player, index) => ({
        ...player,
        score: scoreMap.get(player.id) ?? 0,
      }));
      if (state.turnIndex >= state.players.length) {
        state.turnIndex = 0;
      }
      updatePlayers();
    });

  await state.channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await state.channel.track({
        id: state.playerId,
        name: state.playerName,
      });
      if (state.players.length === 0) {
        state.players = [
          {
            id: state.playerId,
            name: state.playerName,
            score: 0,
          },
        ];
        state.turnIndex = 0;
        updatePlayers();
      }
      if (!isHost()) {
        await state.channel.send({
          type: "broadcast",
          event: "join-request",
          payload: { id: state.playerId, name: state.playerName },
        });
      }
      await requestState();
      setTurnStatus();
    }
  });
};

const validateInputs = () => {
  if (!dom.playerName.value.trim()) {
    setStatus("Enter your name first.");
    return false;
  }
  if (!dom.roomCode.value.trim()) {
    setStatus("Enter a room code.");
    return false;
  }
  return true;
};

const startRoom = async ({ create }) => {
  if (!validateInputs()) {
    return;
  }
  state.playerName = dom.playerName.value.trim();
  state.roomCode = dom.roomCode.value.trim().toUpperCase();
  state.playerId = randomId();
  state.maxPlayers = Number(dom.maxPlayers.value) || 10;
  state.boardSize = Number(dom.boardSize.value) || 10;

  if (create) {
    state.players = [
      {
        id: state.playerId,
        name: state.playerName,
        score: 0,
      },
    ];
    state.turnIndex = 0;
    resetBoard();
    buildBoard();
    updatePlayers();
  } else {
    setStatus("Joining room...");
  }

  await setupChannel();
  setStatus("Connected");
  setRoomStatus();
};

dom.createRoom.addEventListener("click", () => startRoom({ create: true }));
dom.joinRoom.addEventListener("click", () => startRoom({ create: false }));

buildBoard();
setTurnStatus();
