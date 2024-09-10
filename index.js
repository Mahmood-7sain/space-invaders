const grid = document.querySelector('.grid')
const resultDisplay = document.querySelector('.results')

const width = 15
const aliensRemoved = []
let currentShooterIndex = 202
let alienMoveInterval = 500 // Time between invader movements in milliseconds
let lastAlienMoveTime = 0
let isGoingRight = true
let direction = 1
let gameOver = false // To track game state
let score = 0

// Create the grid
for (let i = 0; i < width * width; i++) {
    const square = document.createElement('div')
    // square.id = i
    grid.appendChild(square)
}

const squares = Array.from(document.querySelectorAll('.grid div'))

const alienInvaders = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39
]

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
        squares[alienInvaders[i]].classList.remove('invader')
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
// Move the invaders
function moveInvaders(timestamp) {
    if (gameOver) return // Stop updating the game if game is over


    if(aliensRemoved.length === alienInvaders.length){
        resultDisplay.innerHTML = "You Win"
        gameOver = true // Set game over flag
        cancelAnimationFrame(globalID) // Stop the animation frame
        return
    }

    // Check for collision before updating invader positions
    if (squares[currentShooterIndex].classList.contains('invader')) {
        resultDisplay.innerHTML = 'Game Over'
        gameOver = true // Set game over flag
        cancelAnimationFrame(globalID) // Stop the animation frame
        return
    }

    if (timestamp - lastAlienMoveTime > alienMoveInterval) {
        const leftEdge = alienInvaders[0] % width === 0
        const rightEdge = alienInvaders[alienInvaders.length - 1] % width === width - 1

        remove()

        if (rightEdge && isGoingRight) {
            for (let i = 0; i < alienInvaders.length; i++) {
                alienInvaders[i] += width + 1
                direction = -1
                isGoingRight = false
            }
        }

        if (leftEdge && !isGoingRight) {
            for (let i = 0; i < alienInvaders.length; i++) {
                alienInvaders[i] += width - 1
                direction = 1
                isGoingRight = true
            }
        }

        for (let i = 0; i < alienInvaders.length; i++) {
            alienInvaders[i] += direction
        }

        draw()
        lastAlienMoveTime = timestamp // Update last move time
    }

    // Continue the animation loop
    globalID = requestAnimationFrame(moveInvaders)
}

globalID = requestAnimationFrame(moveInvaders)


function shoot(e){
    let laserID
    let currentLaserIndex = currentShooterIndex


    function moveLaser(){
        if (!gameOver){
            squares[currentLaserIndex].classList.remove('laser')
            currentLaserIndex -= width
            squares[currentLaserIndex].classList.add('laser')
    
            if(squares[currentLaserIndex].classList.contains('invader')){
                squares[currentLaserIndex].classList.remove('laser')
                squares[currentLaserIndex].classList.remove('laser')
                squares[currentLaserIndex].classList.add('boom')
    
                setTimeout(()=> squares[currentLaserIndex].classList.remove('boom'),300)
                clearInterval(laserID)
    
                const alienRemoved = alienInvaders.indexOf(currentLaserIndex)
                aliensRemoved.push(alienRemoved)
                score++
                resultDisplay.innerHTML = score
            }
        }
        }

    if (e.key === 'ArrowUp')
        laserID = setInterval(moveLaser, 100)
}


document.addEventListener('keydown', shoot)