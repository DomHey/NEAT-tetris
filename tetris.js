var _ = require('lodash');
var sleep = require('system-sleep');

var WIDTH = 7;
var HEIGHT = 10;
var bestScore = 0
var generation = 1
var genomesCount = 0
var BLOCK = 1
var dwArray = []
var population = []
var finishedPopulation = []

var extinctionRate = 0.1
var mutationRate = 0.2
var weightMutationRate = 0.3
var weightMaxMutationAmount = 0.1
var popCounter = 1
var initialPopulationSize = 100
var bestGenome

createPopulation(initialPopulationSize)

while(true) {
	console.log("Population: " + popCounter + " size: " + population.length)
	finishedPopulation = []
	if(population.length == 0) {
		break;
	}
	if(popCounter == 2) {
		setTimeout(showBestGenome, 1000)
		break;
	}

	for (var i = 0; i < population.length; i++) {
		var genomeScore = startGame(population[i])
		if(genomeScore > bestScore) {
			bestScore = genomeScore
			bestGenome = _.cloneDeep(population[i])
		}
		finishedPopulation.push({"pop":population[i], "score":genomeScore})
	}
	console.log("best score: " + bestScore)
	if(population.length > 2*initialPopulationSize) {
		extinctionRate = 0.4
	} else {
		extinctionRate = 0.1
	}
	decimatePopulation()
	mutatePopulation()
	popCounter++
}

function breedPopulations(g1, g2) {

}

function showBestGenome() {

	startGame(bestGenome,true)
	
}

function decimatePopulation() {
	var populationCopy = []
	for (var i = 0; i < finishedPopulation.length; i++) {
		if((finishedPopulation[i]).score == bestScore) {
			populationCopy.push((finishedPopulation[i]).pop)
		} else {
			if(Math.random() > extinctionRate) {
				populationCopy.push((finishedPopulation[i]).pop)
			}
		}
	}

	population = populationCopy
}

function mutatePopulation() {
	var populationCopy = []
	for (var i = population.length - 1; i >= 0; i--) {
		if(Math.random() <= mutationRate) {
			var mutatedPop = _.cloneDeep(population[i])
			//get the three output nodes
			var outputN = mutatedPop.getOutputNodes()
			for (var j = 0; j < outputN.length; j++) {
				var oN = outputN[j]
				var weights = oN.getConnection().getWeight()
				var newWeights = []
				for (var k = 0; k < weights.length; k++) {
					if(Math.random() < weightMutationRate) {
						if(getRandomInt(0,1) == 0) {
							newWeights.push(weights[k] - weightMaxMutationAmount)
						} else {
							newWeights.push(weights[k] + weightMaxMutationAmount)
						}
					} else {
						newWeights.push(weights[k])
					}
				}
				oN.getConnection().setWeight(newWeights)
			}

			//mutateHiddenWeights

			var hiddenN = mutatedPop.getHiddenNodes()
			for (var j = 0; j < hiddenN.length; j++) {
				var hN = hiddenN[j]
				var weights = hN.getConnection().getWeight()
				var newWeights = []
				for (var k = 0; k < weights.length; k++) {
					if(Math.random() < weightMutationRate) {
						if(getRandomInt(0,1) == 0) {
							newWeights.push(weights[k] - weightMaxMutationAmount)
						} else {
							newWeights.push(weights[k] + weightMaxMutationAmount)
						}
					} else {
						newWeights.push(weights[k])
					}
				}
				hN.getConnection().setWeight(newWeights)
			}


			populationCopy.push(mutatedPop)
		}
			populationCopy.push(population[i])
	}
	population = populationCopy
}




function createPopulation(amount) {
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
	    		moveFigure(-1, 0);
	    		canMove = moveFigure(0,1)
	    	} else if(move == 1) {
	    		moveFigure(1, 0);
	    		canMove = moveFigure(0,1)
	    	} else if(move = 2) {
	    		canMove = moveFigure(0, 1)
	    	}
			
			if(!canMove && (y<=0)) { // if top of gamefield is reached the game ends for that genome
				break;
			}
			if(!canMove) { // if the figure cannot move down check for lines and select new figure
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

		return score + filledFields
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
	 	this.weight = w
	},
	this.setBackNodes = function(bn) {
		this.backNodes = bn
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