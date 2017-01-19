var R = require('./tetris/ml/recurrent.js');
var N = require('./tetris/ml/neat.js');

var WIDTH = 7;
var HEIGHT = 10;

var bestScore = 0
var generation = 1

var genomesCount = 0

var BLOCK = 1

var dwArray = []

for (var i = 0; i < WIDTH*HEIGHT; i++) {
	dwArray.push(0)
};

var fitnessFunc = function(genome, _backpropMode, _nCycles) {
	var genomeScore = startGame(genome)
	if(genomeScore > bestScore) {
		bestScore = genomeScore
	}
	genomesCount++
	console.log("generation: " + generation + " population: " + genomesCount + " scored: " + genomeScore)
	return -(1 - genomeScore/1000)
}


var initModel = function() {
  // setup NEAT universe:
  N.init({nInput: WIDTH*HEIGHT, nOutput: 3, // 2 inputs (x, y) coordinate, one output (class)
    initConfig: "all", // initially, each input is connected to each output when "all" is used
    activations : "default", // [SIGMOID, TANH, RELU, GAUSSIAN, SIN, ABS, MULT, SQUARE, ADD] for "default"
  });
  // setup NEAT trainer with the hyper parameters for GA.
  trainer = new N.NEATTrainer({
    new_node_rate : 0.5, // probability of a new node created for each genome during each evolution cycle
    new_connection_rate : 0.5, // probability of a new connection created for each genome during each evolution cycle, if it can be created
    num_populations: 5, // cluster the population into 5 sub populations that are similar using k-medoids
    sub_population_size : 10, // each sub population has 20 members, so 100 genomes in total
    init_weight_magnitude : 0.25, // randomise initial weights to be gaussians with zero mean, and this stdev.
    mutation_rate : 0.5, // probability of mutation for weights (for this example i made it large)
    mutation_size : 0.5, // if weights are mutated, how much we mutate them by in stdev? (I made it very small for this example)
    extinction_rate : 0.2, // probably that the worst performing sub population goes extinct at each evolution cycle
  }); // the initial population of genomes is randomly created after N.NEATTrainer constructor is called.
  trainer.applyFitnessFunc(fitnessFunc); // this would calculate the fitness for each genome in the population, and clusters them into the 5 sub populations
};

initModel();

while(true) {
	var gen = trainer.getBestGenome()
	console.log("fitness: " + gen.fitness.toPrecision(3) + ", nodes: "+gen.getNodesInUse().length+", connections: "+gen.connections.length)
	trainer.evolve();
	genomesCount = 0
	generation++
	trainer.applyFitnessFunc(fitnessFunc)
}


function startGame(gnome){
	var gn = gnome
	var R = require('./tetris/ml/recurrent.js');
	var N = require('./tetris/ml/neat.js');

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
		var model = {n:1, d:WIDTH*HEIGHT, w: new Float32Array(inputdata), dw: new Float32Array(dwArray)}

		gn.setupModel(1)
	    gn.setInput(model); // put the input data into the network
	    var G = new R.Graph(true); // setup the recurrent.js graph. if no backprop, faster.
	    gn.forward(G); // propagates the network forward.
	    var output = gn.getOutput();
	    results = []
	    results.push(G.sigmoid(output[0]).w[0])
	    results.push(G.sigmoid(output[1]).w[0])
	    results.push(G.sigmoid(output[2]).w[0])

	    var key = indexOfMax(results)

	    if(key == 0) {
	    	moveFigure(-1, 0);
	    } else if(key == 1) {
	    	moveFigure(1, 0);
	    } else if(key = 2) {
	    	moveFigure(0, 1)
	    }
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

	function gameLoop() {	
		var bordRow = []
		while(true) {
		
			calculateInput(gn) // calculate the input accordingly to genome
			var canMove = moveFigure(0,1)
			if(!canMove && (y<=0)) { // if top of gamefield is reached the game ends for that genome
				break;
			}
			if(!canMove) { // if the figure cannot move down check for lines and select new figure
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

		return score + filledFields
	}

	function printBoard() {
		for (var i = 0; i < HEIGHT; i++) {
			for (var j = 0; j < WIDTH; j++) {
				bordRow.push(board[i][j])
			}
			console.log(bordRow)
			bordRow = []

		}
		console.log("----------------------")
	}



	selectFigure();
	return gameLoop() // if the game ends return score to fitnessfunction

}