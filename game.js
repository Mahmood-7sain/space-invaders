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
const fpsCount = document.querySelector(".fpsCounter");

const width = 15; //Used to indicate the grid size
const aliensRemoved = []; //To keep a list of the removed aliens

//Setting the start alien positions
let alienInvaders = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39,
];

//Bomb drop variables
let validAliens = alienInvaders.filter((alien) => alien !== -1); // Fix the arrow function syntax
let bombID;
let activeBombs = [];
let dropBombInterval = 8000;

let currentShooterIndex = 202; //The starting shooter position
let alienMoveInterval = 500; // Time between invader movements in milliseconds
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
let activeLasers = []; //To track the on screen lasers

//Timer variables
let elapsedTime = 0;
let timerInterval;

//Starts the timer
function startTimer() {
  timerInterval = setInterval(() => {
    elapsedTime++;
    timer.innerHTML = `${formatTime(elapsedTime)}`;
  }, 1000);
}

//Stops the timer
function stopTimer() {
  clearInterval(timerInterval);
}

// function calculateFPS() {
//   let startTime = performance.now();
//   let frameCount = 0;

//   function updateFPS() {
//     const currentTime = performance.now();
//     const elapsedTime = currentTime - startTime;

//     if (elapsedTime >= 1000) {
//       // Measure FPS over 1 second
//       const fps = frameCount / (elapsedTime / 1000);
//       // console.log(`FPS: ${fps}`); // Log the calculated FPS
//       fpsCount.innerHTML = `${fps.toFixed(2)}`;
//       frameCount = 0;
//       startTime = currentTime;
//     }

//     frameCount++;
//     requestAnimationFrame(updateFPS);
//   }

//   requestAnimationFrame(updateFPS);
// }

//Formats the play time
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

//Set the result in the menu to be empty
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

//Start the timer
startTimer();

// calculateFPS();

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

// Control shooter movement
document.addEventListener("keydown", moveShooter);

// Resets game state but keep track of lives
function resetGame() {
  clearActiveLasers();
  clearActiveBombs();
  gameOver = false;
  win = false;
  currentShooterIndex = 202;
  aliensRemoved.length = 0; // Reset the removed aliens array

  //Maximum of 10 levels
  if (cleared && level < 11) {
    level++;
    alienMoveInterval -= 50;
    cleared = false;
    levelStat.innerHTML = level;
  } else if (level === 11) {
    win = true;
  }

  //Clear the screen
  for (let i = 0; i <= 224; i++) {
    squares[i].classList.remove("shooter", "laser", "invader", "boom", "bomb");
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

// Function to pick a random alien that will drop a bomb
function getRandomAlien() {
  let validAliens = alienInvaders.filter((alien) => alien !== -1); // Recalculate valid aliens
  if (validAliens.length > 0) {
    return validAliens[Math.floor(Math.random() * validAliens.length)];
  }
  return -1;
}

// Move the invaders
function moveInvaders(timestamp) {
  if (gameOver || gamePaused) return; // Stop updating the game if game is over

  if (win) {
    gameOver = true;
    stopTimer();
    resultDisplay.innerHTML = `You WON in ${formatTime(elapsedTime)}!`;
    optionsMenu.style.display = "block";
    pauseGame();
    return;
  }

  //When the player clears the aliens => reset with faster aliens
  if (aliensRemoved.length === alienInvaders.length) {
    isResetting = true;
    cancelAnimationFrame(globalID);
    squares[currentShooterIndex].classList.remove("shooter");
    cleared = true;
    resetGame();
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
    if (lives > 0) {
      isResetting = true;
      cancelAnimationFrame(globalID);
      squares[currentShooterIndex].classList.remove("shooter");
      setTimeout(resetGame, 1000); // Reset after a brief delay
    } else {
      resultDisplay.innerHTML = `You LOST in ${formatTime(elapsedTime)}!`;
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
const shootThrottle = 200; // Time in milliseconds to throttle between shots
let canShoot = true; // Track if shooting is allowed
let keysPressed = {}; // Object to store the state of pressed keys

function shoot() {
  const currentTime = Date.now(); // Get the current time
  if (
    gameOver ||
    isResetting ||
    !canShoot ||
    currentTime - lastShotTime < shootThrottle
  ) {
    return; // If the game is over, resetting, or the space is held down, don't shoot
  }

  lastShotTime = currentTime; // Update the last shot time to the current time
  canShoot = false; // Disable shooting until the space key is released

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

  laserID = setInterval(moveLaser, 300);
  activeLasers.push(laserID); // Store the laser interval
}

// Function to clear all active lasers
function clearActiveLasers() {
  activeLasers.forEach(clearInterval); // Clear each active laser interval
  activeLasers = []; // Reset the array
}

// Handle movement (left and right)
function moveShooter() {
  if (!gameOver && !isResetting && !gamePaused) {
    squares[currentShooterIndex].classList.remove("shooter");

    // Move left
    if (keysPressed["ArrowLeft"] && currentShooterIndex % width !== 0) {
      currentShooterIndex -= 1;
    }

    // Move right
    if (keysPressed["ArrowRight"] && currentShooterIndex % width < width - 1) {
      currentShooterIndex += 1;
    }

    squares[currentShooterIndex].classList.add("shooter");
  }
}

// Listen for keydown and keyup events
document.addEventListener("keydown", (e) => {
  keysPressed[e.key] = true; // Mark key as pressed

  if (e.key === " ") {
    shoot(); // Shoot when spacebar is pressed
  }

  moveShooter(); // Trigger movement when keys are pressed
});

document.addEventListener("keyup", (e) => {
  keysPressed[e.key] = false; // Mark key as released

  if (e.key === " ") {
    canShoot = true; // Re-enable shooting when the space key is released
  }
});

//Stops the game
function pauseGame() {
  stopTimer();
  gamePaused = true;
  cancelAnimationFrame(globalID);
}

//Resumes the game
function continueGame() {
  gamePaused = false;
  if (!gameOver) {
    globalID = requestAnimationFrame(moveInvaders); // Resume the game loop
    startTimer();
  }
}

//Restarts the game
function restartGame() {
  clearActiveLasers(); // Clear all active lasers when restarting the game
  clearActiveBombs();
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
  alienMoveInterval = 500;
  scoreStat.innerHTML = score;
  liveStat.innerHTML = lives;
  levelStat.innerHTML = level;
  resultDisplay.innerHTML = "";

  //Clear the screen
  for (let i = 0; i <= 224; i++) {
    squares[i].classList.remove("shooter", "laser", "invader", "boom", "bomb");
  }

  // Reset alien positions to the initial layout
  alienInvaders = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
  ];

  // Reset direction variables
  isGoingRight = true;
  direction = 1;

  draw(); // Redraw the invaders in their starting positions
  squares[currentShooterIndex].classList.add("shooter"); // Reposition shooter

  gamePaused = false;

  startTimer();

  globalID = requestAnimationFrame(moveInvaders); // Resume the game loop
}

//Stops the game and opens the menu
menuBtn.addEventListener("click", function () {
  if (optionsMenu.style.display === "block") {
    optionsMenu.style.display = "none";
    continueGame();
  } else {
    optionsMenu.style.display = "block";
    pauseGame();
  }
});

//Closes the menu and resumes the game
continueBtn.addEventListener("click", function () {
  optionsMenu.style.display = "none";
  continueGame();
});

//Closes the menu and restarts the game
restartBtn.addEventListener("click", function () {
  optionsMenu.style.display = "none";
  restartGame();
});

function dropBomb() {
  if (!gameOver && !isResetting && !gamePaused) {
    let bombIndex = getRandomAlien(); // Choose a new alien to drop a bomb each time

    if (bombIndex === -1) return; // No valid aliens left to drop bombs

    // Continue dropping the bomb down the grid
    bombID = setInterval(() => {
      // Check if the game is paused
      if (gamePaused) {
        clearInterval(bombID); // Stop the bomb movement if paused
        squares[bombIndex].classList.remove("bomb");
        return; // Exit the function
      }

      squares[bombIndex].classList.remove("bomb"); // Clear previous bomb position
      bombIndex += width; // Move bomb down by the grid width

      if (bombIndex >= squares.length) {
        clearInterval(bombID); // Bomb out of bounds
        return;
      }

      squares[bombIndex].classList.add("bomb");

      // Bomb hits the shooter
      if (squares[bombIndex].classList.contains("shooter")) {
        squares[bombIndex].classList.remove("bomb");

        squares[bombIndex].classList.add("boom"); // Add boom effect
        lives--; // Decrease player's lives
        liveStat.innerHTML = lives;

        if (lives <= 0) {
          // Game over when lives run out
          gameOver = true;
          resultDisplay.innerHTML = `You LOST in ${formatTime(elapsedTime)}!`;
          stopTimer();
          cancelAnimationFrame(globalID);
          optionsMenu.style.display = "block";
          pauseGame();
        } else {
          // Show the shooter again after a brief delay
          setTimeout(() => {
            squares[currentShooterIndex].classList.add("shooter"); // Show the shooter
            squares[bombIndex].classList.remove("boom"); // Remove the boom effect
          }, 500); // Delay for the boom effect (500ms)
        }

        clearInterval(bombID); // Stop the bomb movement
        return;
      }
    }, 300); // Control bomb drop speed

    activeBombs.push(bombID); // Keep track of active bombs
  }
}

bombID = setInterval(dropBomb, dropBombInterval);

// Clear all active bombs (used on reset or game over)
function clearActiveBombs() {
  activeBombs.forEach(clearInterval);
  activeBombs = [];
}

