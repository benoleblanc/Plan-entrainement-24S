// Jeu de taquin (sliding puzzle / 15-puzzle) — vanilla JS, sans dépendance.

const boardEl = document.getElementById('puzzle-board');
const sizeSelectEl = document.getElementById('size-select');
const movesCountEl = document.getElementById('moves-count');
const timerDisplayEl = document.getElementById('timer-display');
const bestScoreEl = document.getElementById('best-score');
const shuffleBtn = document.getElementById('shuffle-btn');
const resetBtn = document.getElementById('reset-btn');
const winOverlayEl = document.getElementById('win-overlay');
const winSummaryEl = document.getElementById('win-summary');
const winReplayBtn = document.getElementById('win-replay-btn');

const STORAGE_KEY = 'puzzle24s-best-scores';

/** @type {{size:number, tiles:number[], startTiles:number[], moves:number, startTime:number|null, elapsed:number, won:boolean}} */
let state = {
  size: 4,
  tiles: [],
  startTiles: [],
  moves: 0,
  startTime: null,
  elapsed: 0,
  won: false,
};

let timerInterval = null;

function loadBestScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveBestScore(size, moves, timeSeconds) {
  const scores = loadBestScores();
  const current = scores[size];
  if (!current || moves < current.moves) {
    scores[size] = { moves, time: timeSeconds };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateBestScoreDisplay() {
  const scores = loadBestScores();
  const best = scores[state.size];
  bestScoreEl.textContent = best ? `${best.moves} coups` : '--';
}

/** Génère une position résolue : [1, 2, ..., n*n-1, 0] */
function solvedTiles(size) {
  const total = size * size;
  const tiles = [];
  for (let i = 1; i < total; i++) tiles.push(i);
  tiles.push(0);
  return tiles;
}

function blankIndex(tiles) {
  return tiles.indexOf(0);
}

function getRowCol(index, size) {
  return { row: Math.floor(index / size), col: index % size };
}

function areAdjacent(indexA, indexB, size) {
  const a = getRowCol(indexA, size);
  const b = getRowCol(indexB, size);
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/** Mélange en simulant des coups valides depuis la position résolue -> toujours solvable. */
function shuffleTiles(size) {
  const tiles = solvedTiles(size);
  let blank = blankIndex(tiles);
  const moveCount = size * size * 60;
  let lastBlank = -1;

  for (let i = 0; i < moveCount; i++) {
    const neighbors = [];
    const { row, col } = getRowCol(blank, size);
    if (row > 0) neighbors.push(blank - size);
    if (row < size - 1) neighbors.push(blank + size);
    if (col > 0) neighbors.push(blank - 1);
    if (col < size - 1) neighbors.push(blank + 1);

    // Évite de défaire immédiatement le coup précédent pour un meilleur mélange.
    const candidates = neighbors.filter((n) => n !== lastBlank);
    const pool = candidates.length ? candidates : neighbors;
    const target = pool[Math.floor(Math.random() * pool.length)];

    [tiles[blank], tiles[target]] = [tiles[target], tiles[blank]];
    lastBlank = blank;
    blank = target;
  }

  return tiles;
}

function isSolved(tiles) {
  const size = Math.sqrt(tiles.length);
  const solved = solvedTiles(size);
  return tiles.every((v, i) => v === solved[i]);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimerIfNeeded() {
  if (state.startTime !== null) return;
  state.startTime = Date.now();
  timerInterval = setInterval(() => {
    const seconds = (Date.now() - state.startTime) / 1000;
    timerDisplayEl.textContent = formatTime(seconds);
  }, 250);
}

function newGame(size = state.size) {
  stopTimer();
  const tiles = shuffleTiles(size);
  state = {
    size,
    tiles,
    startTiles: [...tiles],
    moves: 0,
    startTime: null,
    elapsed: 0,
    won: false,
  };
  movesCountEl.textContent = '0';
  timerDisplayEl.textContent = '00:00';
  winOverlayEl.classList.remove('active');
  boardEl.dataset.size = String(size);
  updateBestScoreDisplay();
  render();
}

function restartCurrent() {
  stopTimer();
  state.tiles = [...state.startTiles];
  state.moves = 0;
  state.startTime = null;
  state.won = false;
  movesCountEl.textContent = '0';
  timerDisplayEl.textContent = '00:00';
  winOverlayEl.classList.remove('active');
  render();
}

function handleWin() {
  state.won = true;
  stopTimer();
  const totalSeconds = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  timerDisplayEl.textContent = formatTime(totalSeconds);
  saveBestScore(state.size, state.moves, totalSeconds);
  updateBestScoreDisplay();

  winSummaryEl.textContent = `Résolu en ${state.moves} coup${state.moves > 1 ? 's' : ''}, en ${formatTime(totalSeconds)}.`;
  winOverlayEl.classList.add('active');

  if (typeof window.confetti === 'function') {
    window.confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#4a6741', '#a87c51', '#d4a373'],
    });
  }
}

function tryMove(index) {
  if (state.won) return;
  const blank = blankIndex(state.tiles);
  if (!areAdjacent(index, blank, state.size)) return;

  [state.tiles[blank], state.tiles[index]] = [state.tiles[index], state.tiles[blank]];
  state.moves += 1;
  movesCountEl.textContent = String(state.moves);
  startTimerIfNeeded();
  render();

  if (isSolved(state.tiles)) {
    handleWin();
  }
}

function moveBlankBy(dr, dc) {
  // Déplacer le "vide" de (dr, dc) revient à faire glisser la tuile qui s'y trouve.
  const blank = blankIndex(state.tiles);
  const { row, col } = getRowCol(blank, state.size);
  const targetRow = row + dr;
  const targetCol = col + dc;
  if (targetRow < 0 || targetRow >= state.size || targetCol < 0 || targetCol >= state.size) return;
  const targetIndex = targetRow * state.size + targetCol;
  tryMove(targetIndex);
}

function render() {
  const { size, tiles } = state;
  boardEl.innerHTML = '';

  const gapPercent = 2.5;
  const cellPercent = (100 - gapPercent) / size;

  tiles.forEach((value, index) => {
    if (value === 0) return;
    const { row, col } = getRowCol(index, size);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'puzzle-tile';
    if (value === index + 1) btn.classList.add('solved-tile');
    btn.textContent = String(value);
    btn.style.width = `calc(${cellPercent}% - ${gapPercent / 2}px)`;
    btn.style.height = `calc(${cellPercent}% - ${gapPercent / 2}px)`;
    btn.style.left = `calc(${col * cellPercent}% + ${gapPercent / 2}px)`;
    btn.style.top = `calc(${row * cellPercent}% + ${gapPercent / 2}px)`;
    btn.setAttribute('aria-label', `Case ${value}`);
    btn.addEventListener('click', () => tryMove(index));
    boardEl.appendChild(btn);
  });
}

sizeSelectEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.size-btn');
  if (!btn) return;
  sizeSelectEl.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  newGame(Number(btn.dataset.size));
});

shuffleBtn.addEventListener('click', () => newGame(state.size));
resetBtn.addEventListener('click', restartCurrent);
winReplayBtn.addEventListener('click', () => newGame(state.size));

document.addEventListener('keydown', (e) => {
  const keyMap = {
    ArrowUp: [1, 0],
    ArrowDown: [-1, 0],
    ArrowLeft: [0, 1],
    ArrowRight: [0, -1],
  };
  const delta = keyMap[e.key];
  if (!delta) return;
  e.preventDefault();
  moveBlankBy(delta[0], delta[1]);
});

newGame(state.size);
