//HTML elements
const grid = document.querySelector(".grid");
const resultDisplay = document.querySelector(".results");
const menuBtn = document.querySelector(".menuBtn");
const optionsMenu = document.querySelector(".options");
const continueBtn = document.querySelector("#continue");
const restartBtn = document.querySelector("#restart");
const scoreStat = document.querySelector(".score");
const liveStat = document.querySelector(".lives");
const levelStat = document.querySelector(".level");
const timer = document.querySelector(".timer");

const width = 15; //Used to indicate the grid size
const aliensRemoved = []; //To keep a list of the removed aliens

//Setting the start alien positions
let alienInvaders = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39,
];

let currentShooterIndex = 202; //The starting shooter position
let alienMoveInterval = 300; // Time between invader movements in milliseconds
let lastAlienMoveTime = 0; //Keep track of the alien movements

//Direction variables
let isGoingRight = true;
let direction = 1;

//Game tracking variables
let gameOver = false; // To track game status
let gamePaused = false; //Track game pausing
let isResetting = false; // Flag to indicate that the game is reseting
let score = 0;
let lives = 3;
let level = 1;
let cleared = false; //Indicate that player cleared all aliens
let win = false; //Player finished all levels
let globalID; // Controls the animation frames

//Timer variables
let elapsedTime = 0;
let timerInterval;

function startTimer() {
  timerInterval = setInterval(() => {
    elapsedTime++;
    timer.innerHTML = `${formatTime(elapsedTime)}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

resultDisplay.innerHTML = "";

// Create the grid
for (let i = 0; i < width * width; i++) {
  const square = document.createElement("div");
  square.id = i;
  grid.appendChild(square);
}

// All the squares in the grid
const squares = Array.from(document.querySelectorAll(".grid div"));

//Indicate the squares that the invaders should not reach (Deadline)
let killSquares = [
  195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
];

// Function to draw the aliens on the grid
function draw() {
  for (let i = 0; i < alienInvaders.length; i++) {
    if (!aliensRemoved.includes(i)) {
      squares[alienInvaders[i]].classList.add("invader");
    }
  }
}

//Draw the aliens
draw();

startTimer();

//Setting the shooter at the correct start position
squares[currentShooterIndex].classList.add("shooter");

// Function to remove aliens from the grid
function remove() {
  for (let i = 0; i < alienInvaders.length; i++) {
    if (alienInvaders[i] !== -1) {
      squares[alienInvaders[i]].classList.remove("invader");
    }
  }
}

// Move the shooter
function moveShooter(e) {
  if (gameOver || gamePaused) return; // Stop the shooter movement after game over or if the game is paused
  squares[currentShooterIndex].classList.remove("shooter");

  switch (e.key) {
    case "ArrowLeft":
      if (currentShooterIndex % width !== 0) currentShooterIndex -= 1;
      break;
    case "ArrowRight":
      if (currentShooterIndex % width < width - 1) currentShooterIndex += 1;
      break;
  }

  squares[currentShooterIndex].classList.add("shooter");
}

// Control shooter movement
document.addEventListener("keydown", moveShooter);

// Resets game state but keep track of lives
function resetGame() {
  gameOver = false;
  win = false;
  currentShooterIndex = 202;
  aliensRemoved.length = 0; // Reset the removed aliens array

  if (cleared && level < 6) {
    level++;
    alienMoveInterval -= 50;
    cleared = false;
    levelStat.innerHTML = level;
  } else if (level === 6) {
    win = true;
  }

  for (let i = 0; i <= 224; i++) {
    if (squares[i] !== -1 && squares[i].classList.contains("shooter")) {
      squares[i].classList.remove("shooter");
    }
    if (squares[i] !== -1 && squares[i].classList.contains("laser")) {
      squares[i].classList.remove("laser");
    }
  }

  remove(); // Clear the current invader positions from the grid

  // Reset alien positions to the initial layout
  alienInvaders = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
  ];

  draw(); // Redraw the invaders in their starting positions
  squares[currentShooterIndex].classList.add("shooter"); // Reposition shooter

  isResetting = false; // Re-enable shooting after reset
  globalID = requestAnimationFrame(moveInvaders); // Resume the game loop
}

// Move the invaders
function moveInvaders(timestamp) {
  if (gameOver || gamePaused) return; // Stop updating the game if game is over

  if (win) {
    stopTimer();
    resultDisplay.innerHTML = "You WIN!";
    optionsMenu.style.display = "block";
    pauseGame();
    return;
  }

  //When the player clears the aliens => reset with faster aliens
  if (aliensRemoved.length === alienInvaders.length) {
    isResetting = true;
    cancelAnimationFrame(globalID);
    squares[currentShooterIndex].classList.remove("shooter");
    for (let i = 0; i <= 224; i++) {
      if (squares[i] !== -1 && squares[i].classList.contains("shooter")) {
        squares[i].classList.remove("shooter");
      }
      if (squares[i] !== -1 && squares[i].classList.contains("laser")) {
        squares[i].classList.remove("laser");
      }
    }
    cleared = true;
    setTimeout(resetGame, 1000);
  }

  let invaderCrossed = false;
  killSquares.forEach((id) => {
    if (squares[id].classList.contains("invader")) {
      invaderCrossed = true;
    }
    return invaderCrossed;
  });

  // Check for collision before updating invader positions
  if (invaderCrossed) {
    lives--; // Decrease lives when player is hit
    liveStat.innerHTML = lives;
    console.log(lives);
    if (lives > 0) {
      isResetting = true;
      cancelAnimationFrame(globalID);
      squares[currentShooterIndex].classList.remove("shooter");
      for (let i = 0; i <= 224; i++) {
        if (squares[i] !== -1 && squares[i].classList.contains("shooter")) {
          squares[i].classList.remove("shooter");
        }
        if (squares[i] !== -1 && squares[i].classList.contains("laser")) {
          squares[i].classList.remove("laser");
        }
      }
      setTimeout(resetGame, 1000); // Reset after a brief delay
    } else {
      resultDisplay.innerHTML = "Game Over";
      stopTimer();
      gameOver = true;
      cancelAnimationFrame(globalID);
      optionsMenu.style.display = "block";
      pauseGame();
    }

    return;
  }

  if (timestamp - lastAlienMoveTime > alienMoveInterval) {
    const leftEdge = alienInvaders.some((i) => i !== -1 && i % width === 0);
    const rightEdge = alienInvaders.some(
      (i) => i !== -1 && i % width === width - 1
    );

    // Remove previous positions
    alienInvaders.forEach((alien, i) => {
      if (alien !== -1) squares[alien].classList.remove("invader");
    });

    // Update direction based on edge detection
    if (rightEdge && isGoingRight) {
      alienInvaders.forEach((alien, i) => {
        if (alien !== -1) alienInvaders[i] += width + 1;
      });
      direction = -1;
      isGoingRight = false;
    }

    if (leftEdge && !isGoingRight) {
      alienInvaders.forEach((alien, i) => {
        if (alien !== -1) alienInvaders[i] += width - 1;
      });
      direction = 1;
      isGoingRight = true;
    }

    alienInvaders.forEach((alien, i) => {
      if (alien !== -1) alienInvaders[i] += direction;
    });

    draw(); // Re-draw invaders in new positions
    lastAlienMoveTime = timestamp; // Update last move time
  }

  globalID = requestAnimationFrame(moveInvaders); // Continue the animation loop
}

//Move invaders
globalID = requestAnimationFrame(moveInvaders);

let lastShotTime = 0; // To store the time of the last shot
const shootThrottle = 100; // Time in milliseconds to throttle between shots (e.g., 500ms)

function shoot(e) {
  const currentTime = Date.now(); // Get the current time
  if (gameOver || isResetting || currentTime - lastShotTime < shootThrottle) {
    return; // If the game is over, resetting, or the time since the last shot is too short, don't shoot
  }

  lastShotTime = currentTime; // Update the last shot time to the current time

  let laserID;
  let currentLaserIndex = currentShooterIndex;

  function moveLaser() {
    if (!gameOver && !isResetting && !gamePaused) {
      squares[currentLaserIndex].classList.remove("laser");
      currentLaserIndex -= width;

      if (currentLaserIndex < 0) {
        clearInterval(laserID);
        return;
      }

      squares[currentLaserIndex].classList.add("laser");

      if (squares[currentLaserIndex].classList.contains("invader")) {
        squares[currentLaserIndex].classList.remove("laser");
        squares[currentLaserIndex].classList.remove("invader");
        squares[currentLaserIndex].classList.add("boom");

        setTimeout(
          () => squares[currentLaserIndex].classList.remove("boom"),
          100
        );
        clearInterval(laserID);

        const alienRemovedIndex = alienInvaders.indexOf(currentLaserIndex);
        if (alienRemovedIndex !== -1) {
          // Mark the alien as removed
          alienInvaders[alienRemovedIndex] = -1;
          aliensRemoved.push(alienRemovedIndex); // Add to removed list
          score++;
          scoreStat.innerHTML = score;
        }
        return;
      }
    }
  }

  if (e.key === " ") laserID = setInterval(moveLaser, 300);
}

document.addEventListener("keydown", shoot);

function pauseGame() {
  stopTimer();
  gamePaused = true;
  cancelAnimationFrame(globalID);
}

function continueGame() {
  startTimer();
  gamePaused = false;
  if (!gameOver) {
    globalID = requestAnimationFrame(moveInvaders); // Resume the game loop
  }
}

function restartGame() {
  elapsedTime = 0;
  gameOver = false;
  win = false;
  cleared = false;
  isResetting = false; // Re-enable shooting after reset
  currentShooterIndex = 202;
  aliensRemoved.length = 0; // Reset the removed aliens array
  score = 0;
  level = 1;
  lives = 3;
  alienMoveInterval = 300;
  scoreStat.innerHTML = score;
  liveStat.innerHTML = lives;
  levelStat.innerHTML = level;
  resultDisplay.innerHTML = "";

  for (let i = 0; i <= 224; i++) {
    if (squares[i] !== -1 && squares[i].classList.contains("shooter")) {
      squares[i].classList.remove("shooter");
    }
    if (squares[i] !== -1 && squares[i].classList.contains("laser")) {
      squares[i].classList.remove("laser");
    }
    if (squares[i].classList.contains("invader")) {
      squares[i].classList.remove("invader");
    }
  }

  remove(); // Clear the current invader positions from the grid

  // Reset alien positions to the initial layout
  alienInvaders = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
  ];

  draw(); // Redraw the invaders in their starting positions
  squares[currentShooterIndex].classList.add("shooter"); // Reposition shooter

  gamePaused = false;

  startTimer();

  globalID = requestAnimationFrame(moveInvaders); // Resume the game loop
}

menuBtn.addEventListener("click", function () {
  if (optionsMenu.style.display === "block") {
    optionsMenu.style.display = "none";
    continueGame();
  } else {
    optionsMenu.style.display = "block";
    pauseGame();
  }
});

continueBtn.addEventListener("click", function () {
  optionsMenu.style.display = "none";
  continueGame();
});

restartBtn.addEventListener("click", function () {
  optionsMenu.style.display = "none";
  restartGame();
});
