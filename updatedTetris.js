const _ = require('lodash')
const sleep = require('system-sleep')
const clivas = require('clivas')

const NOCOLLISION = 0
const TILECOLLISION = 1
const GAMEEND = 2

const O_SHAPE = 3
const I_SHAPE = 4
const L_SHAPE = 5
const Z_SHAPE = 6
const S_SHAPE = 7
const J_SHAPE = 8
const T_SHAPE = 9

const INPUT = 0
const HIDDEN = 1
const OUTPUT = 2

const maxGenerations = 100
const weightMutationRate = 0.3
const weightMaxMutationAmount = 0.3
const populationAmount = 200
const maxMutationCycles = 5
const mutationRate = 0.2


const WIDTH = 10
const HEIGHT = 20

let population = []
let tileSequence = []
let bestGenome = null
let bestGenomeScore = 0

class NodeConnection{
	construnctor() {
		this.weights = []
		this.backwardNodes = []
	}

	getBackNodes() {
		return this.backwardNodes
	}

	getWeights() {
		return this.weight
	}

	setBackNodes(bn) {
		this.backwardNodes = bn.slice()
	}

	setWeights(w) {
		this.weight = w.slice()
	}

}

class NetworkNode{
	constructor(type) {
		this.nodeType = type
		this.backwardsConnections = null
		this.nodeValue = 0
	}

	setConnections(con) {
		this.backwardsConnections = con
	}

	setNodeValue(val) {
		this.nodeValue = val
	}

	getCalculatedNodeValue() {
		return this.nodeValue
	}

	getBackConnections() {
		return this.backwardsConnections
	}

	activate() {
		if(this.nodeType != INPUT) {
			let sum = 0
			let backwardNodes = this.backwardsConnections.getBackNodes()
			let backwardsWeights = this.backwardsConnections.getWeights()
			for (var i = backwardNodes.length - 1; i >= 0; i--) {
				sum += backwardNodes[i].getCalculatedNodeValue() * backwardsWeights[i]
			}

			this.nodeValue = sigmoid(sum)
		}
		return this.nodeValue
	}
}

class NeuronalNetwork{
	constructor(amountInputNodes, hiddenLayersSize, amountHiddenNodes, amountOutputNodes) {
		this.hiddenLayers = []
		this.inputNodes = []
		this.outputNodes = []

		for (var i = amountInputNodes - 1; i >= 0; i--) {
			this.inputNodes.push(new NetworkNode(INPUT))
		}

		for (var i = amountOutputNodes - 1; i >= 0; i--) {
			this.outputNodes.push(new NetworkNode(OUTPUT))
		}

		for (var k = hiddenLayersSize - 1; k >= 0; k--) {
			let hiddenNodes = []
			for (var i = amountHiddenNodes - 1; i >= 0; i--) {
				hiddenNodes.push(new NetworkNode(HIDDEN))
			}
			this.hiddenLayers.push(hiddenNodes)
		}

		for (var k = this.hiddenLayers[0].length - 1; k >= 0; k--) {
			let weights = []
			for (var i = this.inputNodes.length - 1; i >= 0; i--) {
				weights.push(Math.random() - 0.5)
			}
			let link = new NodeConnection()
			link.setWeights(weights)
			link.setBackNodes(this.inputNodes)
			this.hiddenLayers[0][k].setConnections(link)
		}

		if(this.hiddenLayers.length > 1) {
			for (var i = this.hiddenLayers.length - 1; i >= 1; i--) {
				let layer = this.hiddenLayers[i]
				let beforeLayer = this.hiddenLayers[i-1]

				for (var k = layer.length - 1; k >= 0; k--) {
					let node = layer[k]
					let weights = []
					for (var j = beforeLayer.length - 1; j >= 0; j--) {
						weights.push(Math.random() - 0.5)
					}
					let link = new NodeConnection()
					link.setWeights(weights)
					link.setBackNodes(beforeLayer)
					node.setConnections(link)
				}
			}
		}

		for (var k = this.outputNodes.length - 1; k >= 0; k--) {
			let weights = []
			let lastHiddenlayer = this.hiddenLayers[this.hiddenLayers.length - 1]
			for (var i = lastHiddenlayer.length - 1; i >= 0; i--) {
				weights.push(Math.random() - 0.5)
			}
			let link = new NodeConnection()
			link.setWeights(weights)
			link.setBackNodes(lastHiddenlayer)
			this.outputNodes[k].setConnections(link)
		}
		
	}

	setInput(val) {
		if(this.inputNodes.length != val.length) {
			console.log("input vals not same length as input nodes")
			return
		}

		for (var i = 0; i < val.length; i++) {
			this.inputNodes[i].setNodeValue(val[i])
		}
	}

	activate() {
		for (var j = 0; j < this.hiddenLayers.length; j++) {
			let hiddenNodes = this.hiddenLayers[j]
			for (var i = 0; i < hiddenNodes.length; i++) {
				hiddenNodes[i].activate()
			}
		}

		let result = []
		for (var i = 0; i < this.outputNodes.length; i++) {
			result.push(this.outputNodes[i].activate())
		}

		return result
	}

	getOutputNodes(){
		return this.outputNodes
	}

	getHiddenLayers(){
		return this.hiddenLayers
	}
	getInputNodes(){
		return this.inputNodes
	}

	setHiddenLayers(hl) {
		this.hiddenLayers = hl.slice()
	}

	setOutputNodes(on) {
		this.outputNodes = on.slice()
	}

	setInputNodes(iN) {
		this.inputNodes = iN.slice()
	}

	cloneNetwork() {
		return _.cloneDeep(this)
	}

	mutateWeights() {
		for (var i = 0; i < this.outputNodes.length; i++) {
			let weights = (this.outputNodes[i]).getBackConnections().getWeights()
			let newWeights = []
			for (var j = 0; j < weights.length; j++) {
				if(Math.random() < weightMutationRate) {
					let w = weights[j]
					if(getRandomInt(0,1) == 0) {
						newWeights.push(w - (Math.random() / (1/weightMaxMutationAmount)))
					} else {
						newWeights.push(w + (Math.random() / (1/weightMaxMutationAmount)))
					}
				} else {
					let w = weights[j]
					newWeights.push(w)
				}
			}
			(this.outputNodes[i]).getBackConnections().setWeights(newWeights)
		}

		for (var k = 0; k <= this.hiddenLayers.length - 1; k++) {
			var hiddenNodes = this.hiddenLayers[k]
			for (var i = 0; i < hiddenNodes.length; i++) {
				var weights = (hiddenNodes[i]).getBackConnections().getWeights()
				var newWeights = []
				for (var j = 0; j < weights.length; j++) {
					if(Math.random() < weightMutationRate) {
						if(getRandomInt(0,1) == 0) {
							newWeights.push(weights[j] - (Math.random() / (1/weightMaxMutationAmount)))
						} else {
							newWeights.push(weights[j] + (Math.random() / (1/weightMaxMutationAmount)))
						}
					} else {
						newWeights.push(weights[j])
					}
				}
				(hiddenNodes[i]).getBackConnections().setWeights(newWeights)
			}
		}
	}
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function sigmoid(t) {
    return 1/(1+Math.pow(Math.E, -t));
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

init()

function init() {
	let currentGeneration = 1

	for (var i = populationAmount - 1; i >= 0; i--) {
		population.push(new NeuronalNetwork(WIDTH*HEIGHT+1 , getRandomInt(1,10), getRandomInt(10,50), 4))
	}

	for (var i = 100000; i >= 0; i--) {
		//tileSequence.push(getRandomInt(3,9))
		tileSequence.push(4)
	}

	while(true) {
		let finishedPopulations = []
		if(currentGeneration > maxGenerations) {
			break
		}
		for (var i = population.length - 1; i >= 0; i--) {
			let pop = population[i]
			let score = startGame(pop, false)
			if(score > bestGenomeScore) {
				bestGenomeScore = score
				bestGenome = pop.cloneNetwork()
			}
			finishedPopulations.push({'pop': pop, 'score': score})
		}
		console.log(`generation ${currentGeneration} score: ${bestGenomeScore}`)
		currentGeneration++

		decimatePopulation(finishedPopulations)
		let mutatedPop = mutatePopulation(finishedPopulations)
		population = joinPopulations(finishedPopulations, mutatedPop)
		console.log(population.length)

		if(bestGenomeScore > 10000) {
			break
		}

	}

	startGame(bestGenome, true)
}

function decimatePopulation(finishedPopulations) {
	for (var i = finishedPopulations.length - 1; i >= 0; i--) {
		let popscore = (finishedPopulations[i]).score
		if(popscore != bestGenomeScore) {
			let deathProb = popscore / bestGenomeScore
			if(Math.random() > deathProb) {
				finishedPopulations.splice(i,1)
			}
		}
	}
}

function mutatePopulation(finishedPopulations) {
	let newPopulation = []
	let mRate = 0

	if(finishedPopulations.length * 2 < populationAmount) {
		mRate = 1
	} else {
		mRate = mutationRate
	}

	for (var i = finishedPopulations.length - 1; i >= 0; i--) {
		if(Math.random() <= mRate) {
			let mutateNetwork = (finishedPopulations[i]).pop.cloneNetwork()
			let rounds = getRandomInt(1, maxMutationCycles)
			for (var k = rounds - 1; k >= 0; k--) {
				mutateNetwork.mutateWeights()
			}
			newPopulation.push(mutateNetwork)
		}
	}

	return newPopulation
}

function joinPopulations(finishedPopulations, mutatedPop) {
	let newPopulation = []
	for (var i = mutatedPop.length - 1; i >= 0; i--) {
		newPopulation.push(mutatedPop[i].cloneNetwork())
	}
	for (var i = finishedPopulations.length - 1; i >= 0; i--) {
		newPopulation.push((finishedPopulations[i]).pop.cloneNetwork())
	}
	return newPopulation
}


//----------------------------------------------------------------------

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
	


	for (var i = 0; i < HEIGHT; i++) {
		board[i] = [];
		for (var j = 0; j < WIDTH; j++) {
			board[i][j] = new boardTile();
		}
	}
	

	var selectFigure = function() {
		y = -1
		x = Math.floor(WIDTH/2)
		figure = new shapeKonstruktor(board, x, y, tileSequence[tileSeqIndex])
		tileSeqIndex++
	};

	function calculateInput(gn) {
		var inputTiles = []
		var inputData = []
		inputTiles = [].concat.apply([], board)
		for (var i = 0; i < inputTiles.length; i++) {
			var tv = inputTiles[i].getTileValue()
			inputData.push(tv)
		}
		inputData.push(tileSequence[tileSeqIndex])
	    gn.setInput(inputData)
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

			if(score > 10000) {
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
				var ff = []

				if(isBoardCellEmpty(board, j, i)) {
					continue
				}

				ff.push(!isBoardCellEmpty(board, j-1, i))
				ff.push(!isBoardCellEmpty(board, j+1, i))
				ff.push(!isBoardCellEmpty(board, j-1, i-1))
				ff.push(!isBoardCellEmpty(board, j+1, i-1))
				ff.push(!isBoardCellEmpty(board, j-1, i+1))
				ff.push(!isBoardCellEmpty(board, j+1, i+1))
				ff.push(!isBoardCellEmpty(board, j, i+1))
				ff.push(!isBoardCellEmpty(board, j, i-1))

				if(ff.indexOf(false) == -1) {
					filledFields++
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
				if((board[i][j]).getTileValue() == 0) {
					line = false
					break
				}
			}
			if(line) {
				board.splice(i,1)
				lines++
				score+=100
			}

		}

		for (var i = 0; i < lines; i++) {
			var emptyLine = []
			for (var j = 0; j < WIDTH; j++) {
				emptyLine.push(new boardTile());
			}
			board.unshift(emptyLine)
		}
	}

	function printBoard() {
		var lines = []
		for (var i = 0; i < HEIGHT; i++) {
			var boardLine = ""
			for (var j = 0; j < WIDTH; j++) {
				if((board[i][j]).getTileValue() != 0) {
					boardLine+='{'+returnFigureColor((board[i][j]).getColor())+'+inverse:  }'
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
		sleep(20)
	}

	selectFigure();
	return gameLoop() // if the game ends return score to fitnessfunction

}

function returnFigureColor(f) {
	if(f == 3) {
		return 'white'
	} else if(f == 4) {
		return 'red'
	} else if(f == 5) {
		return 'green'
	} else if(f == 6) {
		return 'yellow'
	} else if(f == 7) {
		return 'blue'
	} else if(f == 8) {
		return 'magenta'
	} else if(f == 9) {
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
			if((board[t[1]][t[0]-1]).getTileValue() != 0) {
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
			if(t[0] == board[0].length - 1) {
				canMoveRight = false
				break
			}
			if(t[1] < 0) {
				continue
			}
			//check if blocked on the right side by itself or another shape
			if((board[t[1]][t[0]+1]).getTileValue() != 0) {
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
			if((board[t[1]+1][t[0]]).getTileValue() != 0) {
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
	return (0 == (board[y][x]).getTileValue())
}

function removeTileFromBoard(board, tileArray) {
	for (var i = tileArray.length - 1; i >= 0; i--) {
		var t = tileArray[i]
		if(t[1] < 0) {
			continue
		}
		var bt = board[t[1]][t[0]]
		bt.setTileValue(0)
		bt.setColor(0)
	}
}

function updateTilePositionOnBoard(board, tileArray, shape) {
	for (var i = tileArray.length - 1; i >= 0; i--) {
		var t = tileArray[i]
		if(t[1] < 0) {
			continue
		}
		var bt = board[t[1]][t[0]]
		bt.setTileValue(1)
		bt.setColor(shape)
	}
}

function boardTile() {
	var color = 0
	var tileValue = 0

	this.setTileValue = function(v) {
		tileValue = v
	},
	this.setColor = function(c) {
		color = c
	},
	this.getTileValue = function() {
		return tileValue
	},
	this.getColor = function() {
		return color
	}
}



