var _ = require('lodash');
var sleep = require('system-sleep');
var clivas = require('clivas');

var NOCOLLISION = 0
var TILECOLLISION = 1
var GAMEEND = 2

var O_SHAPE = 1
var I_SHAPE = 2
var L_SHAPE = 3
var Z_SHAPE = 4
var S_SHAPE = 5
var J_SHAPE = 6
var T_SHAPE = 7


var WIDTH = 10;
var HEIGHT = 20;
var blockSize = 1

var bestScore = 0
var generation = 1
var genomesCount = 0
var BLOCK = 1
var population = []
var finishedPopulation = []

var extinctionRate = 0.1
var mutationRate = 0.2
var weightMutationRate = 0.3
var weightMaxMutationAmount = 0.1
var popCounter = 1
var initialPopulationSize = 200
var bestGenome
var tileSequence = []

createPopulation(initialPopulationSize)

while(true) {
	var bestPopulationScore = 0
	console.log("Population: " + popCounter + " size: " + population.length)
	finishedPopulation = []
	if(population.length == 0) {
		break;
	}
	if(popCounter == 100) {
		setTimeout(showBestGenome, 5000)
		break;
	}

	for (var i = 0; i < population.length; i++) {
		var genomeScore = startGame(population[i])
		
		if(genomeScore > bestScore) {
			bestScore = genomeScore
			bestGenome = _.cloneDeep(population[i])

		}
		console.log("generation: " + popCounter + " population: " + i + " scored: " + genomeScore)
		finishedPopulation.push({"pop":population[i], "score":genomeScore})
	}

	console.log("best score: " + bestScore)

	decimatePopulation()
	mutatePopulation()
	popCounter++
}

function showBestGenome() {
	startGame(bestGenome,true)
}

function decimatePopulation() {
	for (var i = finishedPopulation.length - 1; i >= 0; i--) {
		if((finishedPopulation[i]).score != bestScore) {
			var deathProb = ((finishedPopulation[i]).score) / bestScore
			if(Math.random() > deathProb) {
				population.splice(i,1)
			}
		}
	}
}

function mutatePopulation() {
	for (var i = 0; i < finishedPopulation.length; i++) {
		if(Math.random() <= mutationRate) {
			var newNetwork = ((finishedPopulation[i]).pop).cloneNetwork()
			newNetwork.mutateWeights()
			population.push(newNetwork)
		}
	}
}

function createPopulation(amount) {

	for (var i = 100000; i >= 0; i--) {
		tileSequence.push(getRandomInt(1,7))
	}

	for (var i = amount - 1; i >= 0; i--) {
		population.push(new createNeuronalNet(WIDTH * HEIGHT, getRandomInt(10,40) , 4))
	}
}

function startGame(gnome, showBoard){
	var gn = gnome
	var nextFigure = 0
	var board = [];
	var x = 0;
	var y = 0;
	var tileSeqIndex = 0

	var figure;
	var score = 0;
	var speed = 50;
	var results = [0,0,0,0]
	var keysPressed = []
	var emptyLine = []


	for (var i = 0; i < HEIGHT; i++) {
		board[i] = [];
		for (var j = 0; j < WIDTH; j++) {
			board[i][j] = 0;
		}
	}

	for (var j = 0; j < WIDTH; j++) {
		emptyLine.push(0);
	}

	var selectFigure = function() {
		y = -1
		x = Math.floor(WIDTH/2)
		figure = new shapeKonstruktor(board, x, y, tileSequence[tileSeqIndex])
		tileSeqIndex++
	};

	var moveFigure = function(dx,dy) {
		if(y == -1) {
			if(board[y+1][x] == 1) {
				return false
			}
			y++;
			return true;
		}

		if(dx < 0) {
			// moveLeft
			if(x > 0) {
				// can move left because not on border
				if(board[y][x+dx] == 0){
					//move left when no stone is blocking it
					board[y][x] = 0
					x+=dx
					board[y][x] = 1
				}
			}
		} else if(dx > 0) {
			// move right
			if(x < WIDTH - 1) {
				// can move right because not on border
				if(board[y][x+dx] == 0){
					board[y][x] = 0
					x+=dx
					board[y][x] = 1
				}
			}

		} else if(dx == 0) {
			//move down
			if(y < HEIGHT - 1) {
				if(board[y+1][x] == 0) {
					board[y][x] = 0
					y++;
					board[y][x] = 1
				} else {
					return false
				}
			} else {
				return false
			}
		}
		return true
	}


	function calculateInput(gn) {
		var inputdata = []
		inputdata = [].concat.apply([], board)
	    gn.setInput(inputdata)
	    var output = gn.activate()

	    results = []
	    results.push(output[0])
	    results.push(output[1])
	    results.push(output[2])
	    results.push(output[3])

	    var key = indexOfMax(results)

	    return key
	}


	function gameLoop() {	
		var bordRow = []
		while(true) {
			if(showBoard) {
				printBoard()
			}

			if(score > 200) {
				break
			}
		
			var move = calculateInput(gn) // calculate the input accordingly to genome
			var canMove
			if(move == 0) {
				figure.moveLeft()
	    		canMove = figure.moveDown()
	    	} else if(move == 1) {
	    		figure.moveRight()
	    		canMove = figure.moveDown()
	    	} else if(move == 2) {
	    		canMove = figure.moveDown()
	    	} else if(move == 3) {
	    		figure.rotate()
	    		canMove = figure.moveDown()
	    	}
			
			if(!canMove.possible && canMove.reason == 2) { // if top of gamefield is reached the game ends for that genome
				break;
			}
			if(!canMove.possible) { // if the figure cannot move down check for lines and select new figure
				checkForLine();
				selectFigure();
			}
		}

		var filledFields = 0
		for (var i = 0; i < HEIGHT; i++) {
			for (var j = 0; j < WIDTH; j++) {
				if(board[i][j] != 0) {
					filledFields++;
				}
			}

		}
		if(showBoard) {
			console.log("SCORE" + score)
			console.log("FF" + filledFields)
		}
		//return score
		return (score + filledFields)
	}

	function checkForLine() {
		var bordRow = []
		var lines = 0
		
		for (var i = HEIGHT-1; i >= 0; i--) {
			var line = true
			for (var j = 0; j < WIDTH; j++) {
				if(board[i][j] == 0) {
					line = false
					break
				}
			}
			if(line) {
				board.splice(i,1)
				lines++
				score+=10
			}

		}

		for (var i = 0; i < lines; i++) {
			board.unshift(emptyLine.slice())
		}
	}

	function printBoard() {
		var lines = []
		for (var i = 0; i < HEIGHT; i++) {
			var boardLine = ""
			for (var j = 0; j < WIDTH; j++) {
				if(board[i][j] != 0) {
					boardLine+='{'+returnFigureColor(board[i][j])+'+inverse:  }'
				} else	{
					boardLine+='{black+inverse:  }'
				}
			}
			lines.push(boardLine)
		}
		clivas.clear()
		for (var i = 0; i < lines.length; i++) {
			clivas.line(lines[i])
		}
		sleep(200)
	}

	selectFigure();
	return gameLoop() // if the game ends return score to fitnessfunction

}

function returnFigureColor(f) {
	if(f == 1) {
		return 'white'
	} else if(f == 2) {
		return 'red'
	} else if(f == 3) {
		return 'green'
	} else if(f == 4) {
		return 'yellow'
	} else if(f == 5) {
		return 'blue'
	} else if(f == 6) {
		return 'magenta'
	} else if(f == 7) {
		return 'cyan'
	}
}

function checkTilePoints(baseArray, point) {
	var match = false
	for (var i = baseArray.length - 1; i >= 0; i--) {
		var bAP = baseArray[i]
		var firstcheck = false
		for (var j = bAP.length - 1; j >= 0; j--) {
			var coord1 = bAP[j]
			var coord2 = point[j]
			if(coord1 == coord2) {
				if(firstcheck) {
					match = true
					break
				} else {
					firstcheck = true
				}
			}
		}
		if(match) {
			break
		}
	}
	return match
}

function shapeKonstruktor(b, startX, startY, type) {
	var x = startX
	var y = startY
	var tiles
	var rotation = 0
	var shape = type

	if(type == O_SHAPE) {
		tiles = [[x, y], [x+1, y], [x, y+1], [x+1, y+1]]
	} else if(type == I_SHAPE) {
		tiles = [[x, y], [x, y-1], [x, y-2], [x, y-3]]
	} else if(type == L_SHAPE) {
		tiles = [[x,y], [x+1,y], [x,y-1], [x,y-2]]
	} else if(type == J_SHAPE) {
		tiles = [[x,y], [x+1,y], [x+1,y-1], [x+1,y-2]]
	} else if(type == Z_SHAPE) {
		tiles = [[x-1,y-1], [x,y-1], [x,y], [x+1,y]]
	} else if(type == S_SHAPE) {
		tiles = [[x-1,y], [x,y], [x,y-1], [x+1,y-1]]
	} else if(type == T_SHAPE) {
		tiles = [[x-1,y-1], [x,y-1], [x+1,y-1], [x,y]]
	}

	var board = b

	this.moveLeft = function() {
		var canMoveLeft = true
		for (var i = tiles.length - 1; i >= 0; i--) {
			var t = tiles[i]
			//tile on the left corner
			if(t[0] == 0) {
				canMoveLeft = false
				break
			}
			if(t[1] < 0) {
				continue
			}
			//check if blocked on the left side by itself or another shape
			if(board[t[1]][t[0]-1] != 0) {
				var collisionPoint = [t[0]-1, t[1]]
				if(!checkTilePoints(tiles, collisionPoint)){
					canMoveLeft = false
				}
			}
			if(!canMoveLeft) {
				break
			}
		}

		if(canMoveLeft) {
			// update board and tile positions
			removeTileFromBoard(board, tiles)
			for (var i = tiles.length - 1; i >= 0; i--) {
				var t = tiles[i]
				var sx = t[0]
				var sy = t[1]
				tiles[i][0] = sx - 1
			}
			updateTilePositionOnBoard(board, tiles, shape)
		}

		return canMoveLeft
	},
	this.moveRight = function() {
		var canMoveRight = true
		for (var i = tiles.length - 1; i >= 0; i--) {
			var t = tiles[i]
			//tile on the right corner
			if(t[0] == board[0].length) {
				canMoveRight = false
				break
			}
			if(t[1] < 0) {
				continue
			}
			//check if blocked on the right side by itself or another shape
			if(board[t[1]][t[0]+1] != 0) {
				var collisionPoint = [t[0]+1, t[1]]
				if(!checkTilePoints(tiles, collisionPoint)){
					canMoveRight = false
				}
			}
			if(!canMoveRight) {
				break
			}
		}

		if(canMoveRight) {
		// update board and tile positions
		removeTileFromBoard(board, tiles)
			for (var i = tiles.length - 1; i >= 0; i--) {
				var t = tiles[i]
				var sx = t[0]
				var sy = t[1]
				tiles[i][0] = sx + 1
			}
			updateTilePositionOnBoard(board, tiles, shape)
		}

		return canMoveRight
	},
	this.moveDown = function() {
		var canMoveDown = true
		var res = 0
		for (var i = tiles.length - 1; i >= 0; i--) {
			var t = tiles[i]
			//tile on the bottom border
			if(t[1] == board.length - 1) {
				canMoveDown = false
				break
			}
			if(t[1] < -1) {
				continue
			}

			//check if blocked on the bottom side by itself or another shape
			if(board[t[1]+1][t[0]] != 0) {
				var collisionPoint = [t[0], t[1]+1]
				if(!checkTilePoints(tiles, collisionPoint)){
					canMoveDown = false
				}
			}
			if(!canMoveDown) {
				//check for gameend
				res = 1
				for (var j = tiles.length - 1; j >= 0; j--) {
					var t2 = tiles[j]
					if(t2[1] < 0) {
						res = 2
						break
					}
				}
				break
			}
		}
		if(canMoveDown) {
		// update board and tile positions
		removeTileFromBoard(board, tiles)
			for (var i = tiles.length - 1; i >= 0; i--) {
				var t = tiles[i]
				var sx = t[0]
				var sy = t[1]
				tiles[i][1] = sy + 1
			}
			updateTilePositionOnBoard(board, tiles, shape)
		}
		return {"possible" : canMoveDown, "reason" : res}
	},

	this.rotate_T_SHAPE = function(board, tiles) {
		var checktileX
		var checktileY
		if(rotation == 0) {
			checktileX = tiles[1][0] 
			checktileY = tiles[1][1] - 1
		} else if(rotation == 90) {
			checktileX = tiles[1][0] - 1
			checktileY = tiles[1][1] 
		} else if(rotation == 180) {
			checktileX = tiles[1][0] 
			checktileY = tiles[1][1] + 1
		} else if(rotation == 270) {
			checktileX = tiles[1][0] + 1
			checktileY = tiles[1][1]
		}

		if(isBoardCellEmpty(board, checktileX, checktileY)) {
			removeTileFromBoard(board, tiles)
			var x0 = tiles[3][0]
			var y0 = tiles[3][1]

			var x3 = tiles[2][0]
			var y3 = tiles[2][1]

			tiles[0] = [x0,y0]
			tiles[3] = [x3,y3]
			tiles[2] = [checktileX, checktileY]
			rotation += 90
			if(rotation == 360) {
				rotation = 0
			}
		}
	},
	this.rotate_I_SHAPE = function(board, tiles) {
		var c0x 
		var c0y
		var c2x
		var c2y
		var c3x
		var c3y
		if(rotation == 0) {
			c0x = tiles[1][0] + 1
			c0y = tiles[1][1]
			c2x = tiles[1][0] - 1
			c2y = tiles[1][1]
			c3x = tiles[1][0] - 2
			c3y = tiles[1][1]

		} else if(rotation == 180) {
			c0x = tiles[1][0]
			c0y = tiles[1][1] + 1
			c2x = tiles[1][0]
			c2y = tiles[1][1] - 1
			c3x = tiles[1][0]
			c3y = tiles[1][1] - 2
		}

		if((isBoardCellEmpty(board, c0x, c0y)) && (isBoardCellEmpty(board, c2x, c2y)) && (isBoardCellEmpty(board, c3x, c3y))) {
			removeTileFromBoard(board, tiles)
			tiles[0][0] = c0x
			tiles[0][1] = c0y
			tiles[2][0] = c2x
			tiles[2][1] = c2y
			tiles[3][0] = c3x
			tiles[3][1] = c3y
			rotation += 180
			if(rotation == 360) {
				rotation = 0
			}
		}


	},
	this.rotate_L_SHAPE = function(board, tiles) {
		var shouldRotate = false
		var c0x 
		var c0y
		var c1x
		var c1y
		var c2x
		var c2y
		var c3x
		var c3y
		if(rotation == 0) {
			c0x = tiles[0][0] + 2
			c0y = tiles[0][1]
			c1x = tiles[1][0] + 1
			c1y = tiles[1][1] - 1
			c2x = tiles[2][0] + 1
			c2y = tiles[2][1] + 1
			c3x = tiles[3][0] 
			c3y = tiles[3][1] + 2
		} else if(rotation == 90) {
			c0x = tiles[0][0]
			c0y = tiles[0][1] - 2
			c1x = tiles[1][0] - 1
			c1y = tiles[1][1] - 1
			c2x = tiles[2][0] + 1
			c2y = tiles[2][1] - 1
			c3x = tiles[3][0] + 2
			c3y = tiles[3][1]
		} else if(rotation == 180) {
			c0x = tiles[0][0] - 2
			c0y = tiles[0][1]
			c1x = tiles[1][0] - 1
			c1y = tiles[1][1] + 1
			c2x = tiles[2][0] - 1
			c2y = tiles[2][1] - 1
			c3x = tiles[3][0]
			c3y = tiles[3][1] - 2
		} else if(rotation == 270) {
			c0x = tiles[0][0]
			c0y = tiles[0][1] + 2
			c1x = tiles[1][0] + 1
			c1y = tiles[1][1] + 1
			c2x = tiles[2][0] - 1
			c2y = tiles[2][1] + 1
			c3x = tiles[3][0] - 2
			c3y = tiles[3][1]
		}
		if(isBoardCellEmpty(board, c0x, c0y) && isBoardCellEmpty(board, c1x, c1y)) {
			removeTileFromBoard(board, tiles)
			tiles[0][0] = c0x
			tiles[0][1] = c0y
			tiles[1][0] = c1x
			tiles[1][1] = c1y
			tiles[2][0] = c2x
			tiles[2][1] = c2y
			tiles[3][0] = c3x
			tiles[3][1] = c3y

			rotation += 90
			if(rotation == 360) {
				rotation = 0
			}
		}
	},
	this.rotate_J_SHAPE = function(board, tiles) {
		var c0x 
		var c0y
		var c1x
		var c1y
		var c2x
		var c2y
		var c3x
		var c3y
		if(rotation == 0) {
			c0x = tiles[0][0] + 1
			c0y = tiles[0][1] - 1
			c1x = tiles[1][0]
			c1y = tiles[1][1] - 2
			c2x = tiles[2][0] - 1
			c2y = tiles[2][1] - 1
			c3x = tiles[3][0] - 2
			c3y = tiles[3][1]
		} else if(rotation == 90) {
			c0x = tiles[0][0] - 1
			c0y = tiles[0][1] - 1
			c1x = tiles[1][0] - 2
			c1y = tiles[1][1]
			c2x = tiles[2][0] - 1
			c2y = tiles[2][1] + 1
			c3x = tiles[3][0]
			c3y = tiles[3][1] + 2
		} else if(rotation == 180) {
			c0x = tiles[0][0] - 1
			c0y = tiles[0][1] + 1
			c1x = tiles[1][0]
			c1y = tiles[1][1] + 2
			c2x = tiles[2][0] + 1
			c2y = tiles[2][1] + 1
			c3x = tiles[3][0] + 2
			c3y = tiles[3][1]
		} else if(rotation == 270) {
			c0x = tiles[0][0] + 1
			c0y = tiles[0][1] + 1
			c1x = tiles[1][0] + 2
			c1y = tiles[1][1]
			c2x = tiles[2][0] + 1
			c2y = tiles[2][1] - 1
			c3x = tiles[3][0]
			c3y = tiles[3][1] - 2
		}
		if(isBoardCellEmpty(board, c2x, c2y) && isBoardCellEmpty(board, c3x, c3y)) {
			removeTileFromBoard(board, tiles)
			tiles[0][0] = c0x
			tiles[0][1] = c0y
			tiles[1][0] = c1x
			tiles[1][1] = c1y
			tiles[2][0] = c2x
			tiles[2][1] = c2y
			tiles[3][0] = c3x
			tiles[3][1] = c3y

			rotation += 90
			if(rotation == 360) {
				rotation = 0
			}
		}
	},
	this.rotate_Z_SHAPE = function(board, tiles) {
		var c0x 
		var c0y
		var c1x
		var c1y
		var c3x
		var c3y
		if(rotation == 0) {
			c0x = tiles[0][0]
			c0y = tiles[0][1] + 2
			c1x = tiles[1][0] - 1
			c1y = tiles[1][1] + 1
			c3x = tiles[3][0] - 1
			c3y = tiles[3][1] - 1
			if(isBoardCellEmpty(board, c0x, c0y) && isBoardCellEmpty(board, c1x, c1y)) {
				removeTileFromBoard(board, tiles)
				tiles[0][0] = c0x
				tiles[0][1] = c0y
				tiles[1][0] = c1x
				tiles[1][1] = c1y
				tiles[3][0] = c3x
				tiles[3][1] = c3y
				rotation = 180
			}
		} else if(rotation == 180) {
			c0x = tiles[0][0]
			c0y = tiles[0][1] - 2
			c1x = tiles[1][0] + 1
			c1y = tiles[1][1] - 1
			c3x = tiles[3][0] + 1
			c3y = tiles[3][1] + 1
			if(isBoardCellEmpty(board, c0x, c0y) && isBoardCellEmpty(board, c3x, c3y)) {
				removeTileFromBoard(board, tiles)
				tiles[0][0] = c0x
				tiles[0][1] = c0y
				tiles[1][0] = c1x
				tiles[1][1] = c1y
				tiles[3][0] = c3x
				tiles[3][1] = c3y
				rotation = 0
			}
		}
	},
	this.rotate_S_SHAPE = function(board, tiles) {
		var c0x 
		var c0y
		var c2x
		var c2y
		var c3x
		var c3y
		if(rotation == 0) {
			c0x = tiles[0][0] + 1
			c0y = tiles[0][1] + 1
			c2x = tiles[2][0] - 1
			c2y = tiles[2][1] + 1
			c3x = tiles[3][0] - 2
			c3y = tiles[3][1]
			if(isBoardCellEmpty(board, c0x, c0y) && isBoardCellEmpty(board, c3x, c3y)) {
				removeTileFromBoard(board, tiles)
				tiles[0][0] = c0x
				tiles[0][1] = c0y
				tiles[2][0] = c2x
				tiles[2][1] = c2y
				tiles[3][0] = c3x
				tiles[3][1] = c3y
				rotation = 180
			}
		} else if(rotation == 180) {
			c0x = tiles[0][0] - 1
			c0y = tiles[0][1] - 1
			c2x = tiles[2][0] + 1
			c2y = tiles[2][1] - 1
			c3x = tiles[3][0] + 2
			c3y = tiles[3][1]
			if(isBoardCellEmpty(board, c2x, c2y) && isBoardCellEmpty(board, c3x, c3y)) {
				removeTileFromBoard(board, tiles)
				tiles[0][0] = c0x
				tiles[0][1] = c0y
				tiles[2][0] = c2x
				tiles[2][1] = c2y
				tiles[3][0] = c3x
				tiles[3][1] = c3y
				rotation = 0
			}
		}
	},
	this.rotate = function() {
		if(type == O_SHAPE) {
			return
		} else if(type == I_SHAPE) {
			this.rotate_I_SHAPE(board, tiles)
		} else if(type == L_SHAPE) {
			this.rotate_L_SHAPE(board, tiles)
		} else if(type == J_SHAPE) {
			this.rotate_J_SHAPE(board, tiles)
		} else if(type == Z_SHAPE) {
			this.rotate_Z_SHAPE(board, tiles)
		} else if(type == S_SHAPE) {
			this.rotate_S_SHAPE(board, tiles)
		} else if(type == T_SHAPE) {
			this.rotate_T_SHAPE(board, tiles)
		}
		updateTilePositionOnBoard(board, tiles, shape)
	}
}

function isBoardCellEmpty(board, x, y) {
	if(x < 0) return false;
	if(x > WIDTH-1) return false;
	if(y < 0) return true;
	if(y > HEIGHT-1) return false;
	return (0 == board[y][x])
}

function removeTileFromBoard(board, tileArray) {
	for (var i = tileArray.length - 1; i >= 0; i--) {
		var t = tileArray[i]
		if(t[1] < 0) {
			continue
		}
		board[t[1]][t[0]] = 0
	}
}

function updateTilePositionOnBoard(board, tileArray, shape) {
	for (var i = tileArray.length - 1; i >= 0; i--) {
		var t = tileArray[i]
		if(t[1] < 0) {
			continue
		}
		board[t[1]][t[0]] = shape
	}
}

var INPUT = 0
var HIDDEN = 1
var OUTPUT = 2

function sigmoid(t) {
    return 1/(1+Math.pow(Math.E, -t));
}

function nodeKonstruktor(t)
{
	var nodeType = t;
	var backWardsConnections = [];
	var nodeValue = 0;
	var calculatedNodeValue = 0;
	this.setConnections = function(con) {
		this.backWardsConnections = con
	},
	this.setNodeValue = function(val) {
		this.nodeValue = val
	}
	this.getCalculatedNodeValue = function() {
		return this.nodeValue
	},
	this.activate = function() {
		var sum = 0
		var backN = this.backWardsConnections.getBackNodes()
		for (var i = backN.length - 1; i >= 0; i--) {
			sum += backN[i].getCalculatedNodeValue() * this.backWardsConnections.getWeight()[i]
		}

		this.nodeValue = sigmoid(sum)
		return this.nodeValue
	},
	this.getConnection = function() {
		return this.backWardsConnections
	}
}

function linkKonstruktor()
{
	var weight = 0;
	var backNodes = [];
	this.getBackNodes = function() {
		return this.backNodes
	},
	this.getWeight = function () {
		return this.weight
	},
	this.setWeight = function(w) {
	 	this.weight = w.slice()
	},
	this.setBackNodes = function(bn) {
		this.backNodes = bn.slice()
	}
} 

function createNeuronalNet(inputLayer, hiddenLayer, outputLayer) {
	var inputNodes = []
	for (var i = inputLayer - 1; i >= 0; i--) {
		inputNodes.push(new nodeKonstruktor(INPUT))
	}

	var hiddenNodes = []
	for (var i = hiddenLayer - 1; i >= 0; i--) {
		hiddenNodes.push(new nodeKonstruktor(HIDDEN))
	}

	var outputNodes = []
	for (var i = outputLayer - 1; i >= 0; i--) {
		outputNodes.push(new nodeKonstruktor(OUTPUT))
	}

	for (var i = hiddenNodes.length - 1; i >= 0; i--) {
		var weights = []
		for (var j = inputNodes.length - 1; j >= 0; j--) {
			weights.push(Math.random() - 0.5)
		}
		var link = new linkKonstruktor()
		link.setWeight(weights)
		link.setBackNodes(inputNodes)
		hiddenNodes[i].setConnections(link)
	}

	for (var i = outputNodes.length - 1; i >= 0; i--) {
		var weights = []
		for (var j = hiddenNodes.length - 1; j >= 0; j--) {
			weights.push(Math.random() - 0.5)
		}
		var link = new linkKonstruktor()
		link.setWeight(weights)
		link.setBackNodes(hiddenNodes)
		outputNodes[i].setConnections(link)
	}

	this.setInput = function(vals) {
		if(inputNodes.length != vals.length) {
			console.log("input vals not same length as input nodes")
			return
		}

		for (var i = 0; i < vals.length; i++) {
			inputNodes[i].setNodeValue(vals[i])
		}
	},

	this.activate = function() {
		for (var i = 0; i < hiddenNodes.length; i++) {
			hiddenNodes[i].activate()
		}

		var result = []
		for (var i = 0; i < outputNodes.length; i++) {
			result.push(outputNodes[i].activate())
		}

		return result
	},

	this.getOutputNodes = function(){
		return outputNodes
	},

	this.getHiddenNodes = function(){
		return hiddenNodes
	},
	this.getInputNodes = function(){
		return inputNodes
	},

	this.setHiddenNodes = function(hn) {
		hiddenNodes = hn.slice()
	},
	this.setOutputNodes = function(on) {
		outputNodes = on.slice()
	},
	this.setInputNodes = function(iN) {
		inputNodes = iN.slice()
	}
	this.cloneNetwork = function() {


		var newInputNodes = []
		for (var i = 0; i <= inputNodes.length - 1; i++) {
			newInputNodes.push(new nodeKonstruktor(INPUT))
		}


		var newHiddenNodes = []
		var newOutputNodes = []

		for (var i = 0; i <= hiddenNodes.length - 1; i++) {
			var link = new linkKonstruktor()
			var hNode = new nodeKonstruktor(HIDDEN)
			var w = ((hiddenNodes[i]).getConnection().getWeight()).slice()
			link.setWeight(w)
			link.setBackNodes(newInputNodes)
			hNode.setConnections(link)
			newHiddenNodes.push(hNode)
		}

		for (var i = 0; i <= outputNodes.length - 1; i++) {
			var link = new linkKonstruktor()
			var oNode = new nodeKonstruktor(OUTPUT)
			var w = ((outputNodes[i]).getConnection().getWeight()).slice()
			link.setWeight(w)
			link.setBackNodes(newHiddenNodes)
			oNode.setConnections(link)
			newOutputNodes.push(oNode)
		}

		var newNetwork = new createNeuronalNet(WIDTH * HEIGHT, 1 , 3)
		newNetwork.setInputNodes(newInputNodes)
		newNetwork.setHiddenNodes(newHiddenNodes)
		newNetwork.setOutputNodes(newOutputNodes)
		return newNetwork

	},

	this.mutateWeights = function() {
		for (var i = 0; i < outputNodes.length; i++) {
			var weights = (outputNodes[i]).getConnection().getWeight()
			var newWeights = []
			for (var j = 0; j < weights.length; j++) {
				if(Math.random() < weightMutationRate) {
					var w = weights[j]
					if(getRandomInt(0,1) == 0) {
						newWeights.push(w - weightMaxMutationAmount)
					} else {
						newWeights.push(w + weightMaxMutationAmount)
					}
				} else {
					var w = weights[j]
					newWeights.push(w)
				}
			}
			(outputNodes[i]).getConnection().setWeight(newWeights)
		}

		//mutateHiddenWeights


		for (var i = 0; i < hiddenNodes.length; i++) {
			var weights = (hiddenNodes[i]).getConnection().getWeight()
			var newWeights = []
			for (var j = 0; j < weights.length; j++) {
				if(Math.random() < weightMutationRate) {
					if(getRandomInt(0,1) == 0) {
						newWeights.push(weights[j] - weightMaxMutationAmount)
					} else {
						newWeights.push(weights[j] + weightMaxMutationAmount)
					}
				} else {
					newWeights.push(weights[j])
				}
			}
			(hiddenNodes[i]).getConnection().setWeight(newWeights)
		}
		return this
	}
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function indexOfMax(arr) { 
  if (arr.length === 0) { 
      return -1; 
  } 

  var max = arr[0]; 
  var maxIndex = 0; 

  for (var i = 1; i < arr.length; i++) { 
      if (arr[i] > max) { 
          maxIndex = i; 
          max = arr[i]; 
      } 
  } 

  return maxIndex; 
} 