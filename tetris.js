var _ = require('lodash');
var sleep = require('system-sleep');

var NOCOLLISION = 0
var TILECOLLISION = 1
var GAMEEND = 2

var O_SHAPE = 0
var I_SHAPE = 1


var WIDTH = 16;
var HEIGHT = 20;
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
var initialPopulationSize = 10
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
	if(popCounter == 50) {
		setTimeout(showBestGenome, 10000)
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
		tileSequence.push(getRandomInt(0,1))
	}

	for (var i = amount - 1; i >= 0; i--) {
		population.push(new createNeuronalNet(WIDTH * HEIGHT, getRandomInt(1,40) , 3))
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


	for (var i = 0; i < HEIGHT; i++) {
		board[i] = [];
		for (var j = 0; j < WIDTH; j++) {
			board[i][j] = 0;
		}
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
	    	} else if(move = 2) {
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
				if(board[i][j] == 1) {
					filledFields++;
				}
			}

		}
		if(showBoard) {
			console.log("SCORE" + score)
			console.log("FF" + filledFields)
		}

		return (score + filledFields)
	}

	function checkForLine() {
		var bordRow = []

		for (var j = 0; j < WIDTH; j++) {
			bordRow.push(board[HEIGHT-1][j])
		}
					
		if(bordRow.indexOf(0) == (-1)) {
			for (var j = 0; j < WIDTH; j++) {
				board[HEIGHT-1][j] = 0
			}

			score += 10
			var newBoard = []
			for (var i = 0; i < HEIGHT; i++) {
				newBoard[i] = [];
				for (var j = 0; j < WIDTH; j++) {
					newBoard[i][j] = 0;
				}
			}

			for (var i = 1; i < HEIGHT; i++) {
				for (var j = 0; j < WIDTH; j++) {
					newBoard[i][j] = board[i-1][j];
				}
			}
			board = newBoard


		}
		bordRow = []
	}

	function printBoard() {
		sleep(20)
		var bordRow = []
		var lines = process.stdout.getWindowSize()[1];
		for(var i = 0; i < lines; i++) {
		    console.log('\r\n');
		}
		for (var i = 0; i < HEIGHT; i++) {
			for (var j = 0; j < WIDTH; j++) {
				bordRow.push(board[i][j])
			}
			console.log(bordRow)
			bordRow = []

		}
	}

	selectFigure();
	return gameLoop() // if the game ends return score to fitnessfunction

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

	if(type == O_SHAPE) {
		tiles = [[x, y], [x+1, y], [x, y+1], [x+1, y+1]]
	} else if(type == I_SHAPE) {
		tiles = [[x, y], [x, y-1], [x, y-2], [x, y-3]]
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
			updateTilePositionOnBoard(board, tiles)
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
			updateTilePositionOnBoard(board, tiles)
		}

		return canMoveRight
	},
	this.rotate = function() {

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
			updateTilePositionOnBoard(board, tiles)
		}
		return {"possible" : canMoveDown, "reason" : res}
	}
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

function updateTilePositionOnBoard(board, tileArray) {
	for (var i = tileArray.length - 1; i >= 0; i--) {
		var t = tileArray[i]
		if(t[1] < 0) {
			continue
		}
		board[t[1]][t[0]] = 1
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