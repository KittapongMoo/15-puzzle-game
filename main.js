import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCiDd53C2CZySuXGjsHWS6Pj4b2k854Oc",
  authDomain: "puzzle-8bf14.firebaseapp.com",
  databaseURL:
    "https://puzzle-8bf14-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "puzzle-8bf14",
  storageBucket: "puzzle-8bf14.appspot.com",
  messagingSenderId: "857947799718",
  appId: "1:857947799718:web:8e73c7626b8355b2e93467",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
  const puzzleContainer = document.getElementById("puzzle-container");
  const startButton = document.getElementById("start-button");
  const timerDisplay = document.getElementById("timer");
  const scoresList = document.getElementById("scores");
  const modal = document.getElementById("user-modal");
  const userNameInput = document.getElementById("user-name-input");
  const submitNameButton = document.getElementById("submit-name-button");

  const imagePieces = Array.from({ length: 16 }, (_, i) =>
    i < 15 ? `url("img/${i}.jpg")` : "none"
  );

  let userName = "";
  let tiles;
  const puzzleSize = 4;
  let timer;
  let startTime;
  let elapsedSeconds = 0;
  let gameStarted = false;

  window.addEventListener("load", () => window.scrollTo(0, 0));

  function init() {
    tiles = Array.from(
      { length: puzzleSize * puzzleSize },
      (_, i) => (i + 1) % (puzzleSize * puzzleSize)
    );
    renderPuzzle(tiles);
    document.addEventListener("keydown", handleKeydown);
    puzzleContainer.addEventListener("click", handleTileClick);
  }

  function renderPuzzle(tiles) {
    puzzleContainer.innerHTML = "";
    tiles.forEach((number, index) => {
      const tile = document.createElement("div");
      tile.className = `tile ${number === 0 ? "empty" : ""}`;
      if (number !== 0) {
        tile.style.backgroundImage = imagePieces[number - 1];
      }
      tile.dataset.index = index;
      puzzleContainer.appendChild(tile);
    });
  }

  function moveTile(index) {
    const emptyIndex = tiles.indexOf(0);
    const validMoves = [
      emptyIndex - 1,
      emptyIndex + 1,
      emptyIndex - puzzleSize,
      emptyIndex + puzzleSize,
    ];

    if (validMoves.includes(index)) {
      [tiles[emptyIndex], tiles[index]] = [tiles[index], tiles[emptyIndex]];
      renderPuzzle(tiles);
      checkWin();
    }
  }

  function handleTileClick(event) {
    if (!gameStarted) return;
    const clickedIndex = parseInt(event.target.dataset.index);
    moveTile(clickedIndex);
  }

  function handleKeydown(event) {
    if (!gameStarted) return;

    const emptyIndex = tiles.indexOf(0);
    let moveIndex = -1;

    if (
      event.key === "ArrowUp" &&
      emptyIndex + puzzleSize < puzzleSize * puzzleSize
    ) {
      moveIndex = emptyIndex + puzzleSize;
    } else if (event.key === "ArrowDown" && emptyIndex - puzzleSize >= 0) {
      moveIndex = emptyIndex - puzzleSize;
    } else if (
      event.key === "ArrowLeft" &&
      emptyIndex % puzzleSize < puzzleSize - 1
    ) {
      moveIndex = emptyIndex + 1;
    } else if (event.key === "ArrowRight" && emptyIndex % puzzleSize > 0) {
      moveIndex = emptyIndex - 1;
    }

    if (moveIndex !== -1) {
      moveTile(moveIndex);
    }
  }

  function checkWin() {
    const isSolved = isSolvedFormat();
    if (isSolved) {
      clearInterval(timer);
      const timeTaken = elapsedSeconds;
      alert(`You solved the puzzle in ${formatTime(timeTaken)}!`);
      saveScore(userName, timeTaken);
      fetchScores();
    }
  }

  function isSolvedFormat() {
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
  }

  function shufflePuzzle() {
    do {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
    } while (!isSolvable(tiles));
    renderPuzzle(tiles);
  }

  function isSolvable(puzzle) {
    let inversions = 0;
    for (let i = 0; i < puzzle.length - 1; i++) {
      for (let j = i + 1; j < puzzle.length; j++) {
        if (puzzle[i] > puzzle[j] && puzzle[i] !== 0 && puzzle[j] !== 0) {
          inversions++;
        }
      }
    }
    const emptyRowFromBottom = Math.floor(puzzle.indexOf(0) / puzzleSize) + 1;
    return (inversions + emptyRowFromBottom) % 2 === 0;
  }

  function startGame() {
    userName = userNameInput.value.trim();
    if (!userName) {
      alert("Please enter your name.");
      return;
    }
    modal.style.display = "none";
    startTime = new Date();
    elapsedSeconds = 0;
    updateTimerDisplay();
    shufflePuzzle();
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
    gameStarted = true;
  }

  function updateTimer() {
    elapsedSeconds++;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = `Time: ${formatTime(elapsedSeconds)}`;
  }

  function formatTime(seconds) {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  }

  function fetchScores() {
    const scoresRef = ref(database, "scores");
    onValue(scoresRef, (snapshot) => {
      const scores = snapshot.val();
      const scoresArray = Object.keys(scores).map((key) => ({
        name: scores[key].name,
        time: scores[key].time,
      }));
      scoresArray.sort((a, b) => a.time - b.time);
      scoresList.innerHTML = "";
      const topScores = scoresArray.slice(0, 10);
      topScores.forEach((score) => {
        const li = document.createElement("li");
        li.textContent = `${score.name}: ${formatTime(score.time)}`;
        scoresList.appendChild(li);
      });
    });
  }

  function saveScore(name, time) {
    const scoresRef = ref(database, "scores");
    push(scoresRef, {
      name: name,
      time: time,
    });
  }

  startButton.addEventListener("click", () => {
    modal.style.display = "block";
  });

  submitNameButton.addEventListener("click", startGame);

  init();
  fetchScores();
});
