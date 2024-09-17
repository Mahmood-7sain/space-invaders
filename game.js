const grid = document.querySelector('.grid')
const resultDisplay = document.querySelector('.results')

const width = 15
const aliensRemoved = []
let currentShooterIndex = 202
let alienMoveInterval = 250 // Time between invader movements in milliseconds
let lastAlienMoveTime = 0
let isGoingRight = true
let direction = 1
let gameOver = false // To track game state
let score = 0
let lives = 3    
let isResetting = false // Flag to indicate that the game is reseting 
let level = 1;

// Create the grid
for (let i = 0; i < width * width; i++) {
    const square = document.createElement('div')
    square.id = i
    grid.appendChild(square)
}

const squares = Array.from(document.querySelectorAll('.grid div'))

let alienInvaders = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39
]

//Indicate the squares that the invaders should not reach
let killSquares = [195,196,197,198,199,200,201,202,203,204,205,206,207,208,209]

// Function to draw the aliens on the grid
function draw() {
    for (let i = 0; i < alienInvaders.length; i++) {
        if (!aliensRemoved.includes(i)) {
            squares[alienInvaders[i]].classList.add('invader')
        }
    }
}

draw()

squares[currentShooterIndex].classList.add('shooter')

// Function to remove aliens from the grid
function remove() {
    for (let i = 0; i < alienInvaders.length; i++) {
        if (alienInvaders[i] !== -1) {
            squares[alienInvaders[i]].classList.remove('invader')
        }
    }
}

// Move the shooter
function moveShooter(e) {
    if (gameOver) return // Stop the shooter movement after game over
    squares[currentShooterIndex].classList.remove('shooter')

    switch (e.key) {
        case 'ArrowLeft':
            if (currentShooterIndex % width !== 0) currentShooterIndex -= 1
            break
        case 'ArrowRight':
            if (currentShooterIndex % width < width - 1) currentShooterIndex += 1
            break
    }

    squares[currentShooterIndex].classList.add('shooter')
}

document.addEventListener('keydown', moveShooter)

let globalID


function resetGame() {
    // Reset game state but keep track of lives
    gameOver = false
    currentShooterIndex = 202
    aliensRemoved.length = 0  // Reset the removed aliens array

    for (let i = 0; i <= 224; i++){
        if (squares[i] !== -1 && squares[i].classList.contains("shooter")) {
            squares[i].classList.remove("shooter")
        }
        if (squares[i] !== -1 && squares[i].classList.contains("laser")) {
          squares[i].classList.remove("laser");
        }
    }

    remove() // Clear the current invader positions from the grid
    
    // Reset alien positions to the initial layout
    alienInvaders = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
        30, 31, 32, 33, 34, 35, 36, 37, 38, 39
    ]

    
    draw()   // Redraw the invaders in their starting positions
    squares[currentShooterIndex].classList.add('shooter') // Reposition shooter


    isResetting = false // Re-enable shooting after reset
    globalID = requestAnimationFrame(moveInvaders) // Resume the game loop
}



// Move the invaders
function moveInvaders(timestamp) {
    if (gameOver) return // Stop updating the game if game is over

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
        level++;
        setTimeout(resetGame, 1000);
    }

    let invaderCrossed = false;
    killSquares.forEach(id => {
        if (squares[id].classList.contains("invader")) {
            invaderCrossed = true
        }
        return invaderCrossed
    });


    // Check for collision before updating invader positions
    if (invaderCrossed) {
        lives-- // Decrease lives when player is hit
        resultDisplay.innerHTML = `Lives: ${lives}`

        if (lives > 0) {
            isResetting = true
            cancelAnimationFrame(globalID)
            squares[currentShooterIndex].classList.remove("shooter");
            for (let i = 0; i <= 224; i++) {
              if (
                squares[i] !== -1 &&
                squares[i].classList.contains("shooter")
              ) {
                squares[i].classList.remove("shooter");
              }
              if (squares[i] !== -1 && squares[i].classList.contains("laser")) {
                squares[i].classList.remove("laser");
              }
            }
            setTimeout(resetGame, 1000) // Reset after a brief delay
        } else {
            resultDisplay.innerHTML = 'Game Over'
            gameOver = true
            cancelAnimationFrame(globalID)
        }
        
        return
    }

    if (timestamp - lastAlienMoveTime > alienMoveInterval) {
        const leftEdge = alienInvaders.some(i => i !== -1 && i % width === 0)
        const rightEdge = alienInvaders.some(i => i !== -1 && i % width === width - 1)

        // Remove previous positions
        alienInvaders.forEach((alien, i) => {
            if (alien !== -1) squares[alien].classList.remove('invader')
        })

        // Update direction based on edge detection
        if (rightEdge && isGoingRight) {
            alienInvaders.forEach((alien, i) => {
                if (alien !== -1) alienInvaders[i] += width + 1
            })
            direction = -1
            isGoingRight = false
        }

        if (leftEdge && !isGoingRight) {
            alienInvaders.forEach((alien, i) => {
                if (alien !== -1) alienInvaders[i] += width - 1
            })
            direction = 1
            isGoingRight = true
        }

        alienInvaders.forEach((alien, i) => {
            if (alien !== -1) alienInvaders[i] += direction
        })

        draw() // Re-draw invaders in new positions
        lastAlienMoveTime = timestamp // Update last move time
    }

    globalID = requestAnimationFrame(moveInvaders) // Continue the animation loop
}


globalID = requestAnimationFrame(moveInvaders)


let lastShotTime = 0; // To store the time of the last shot
const shootThrottle = 50; // Time in milliseconds to throttle between shots (e.g., 500ms)


function shoot(e) {
  const currentTime = Date.now(); // Get the current time
  if (gameOver || isResetting || currentTime - lastShotTime < shootThrottle) {
    return; // If the game is over, resetting, or the time since the last shot is too short, don't shoot
  }

  lastShotTime = currentTime; // Update the last shot time to the current time

  let laserID;
  let currentLaserIndex = currentShooterIndex;

  function moveLaser() {
    if (!gameOver) {
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
          resultDisplay.innerHTML = `Score: ${score} Lives: ${lives}`;
        }
        return;
      }
    }
  }

  if (e.key === " ") laserID = setInterval(moveLaser, 300);
}

document.addEventListener('keydown', shoot)

