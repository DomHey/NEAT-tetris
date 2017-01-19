var R = require('./tetris/ml/recurrent.js');
var N = require('./tetris/ml/neat.js');

var WIDTH = 15;
var HEIGHT = 20;

var bestScore = 0
var generation = 1

var genomesCount = 0

var FIGURES = [
	[
		[0,1,0],
		[0,1,0],
		[1,1,0]
	],[
		[false,1,0],
		[false,1,0],
		[false,1,1]
	],[
		[1,1,0],
		[0,1,1],
		[0,0,0]
	],[
		[0,1,1],
		[1,1,0],
		[0,0,0]
	],[
		[0,0,0,0],
		[1,1,1,1],
		[0,0,0,0],
		[0,0,0,0]
	],[
		[1,1],
		[1,1]
	],[
		[0,1,0],
		[1,1,1],
		[0,0,0]
	]
];

var dwArray = []
var penaltyConnectionFactor = 0.03;
var learnRate = 0.01;

for (var i = 0; i < 300; i++) {
	dwArray.push(0)
};

var fitnessFunc = function(genome, _backpropMode, _nCycles) {
	var genomeScore = startGame(genome)
	if(genomeScore > bestScore) {
		bestScore = genomeScore
	}
	genomesCount++
	console.log("generation: " + generation + " population: " + genomesCount + " scored: " + genomeScore)
	return genomeScore
}

var initModel = function() {
  // setup NEAT universe:
  N.init({nInput: 300, nOutput: 4, // 2 inputs (x, y) coordinate, one output (class)
    initConfig: "all", // initially, each input is connected to each output when "all" is used
    activations : "default", // [SIGMOID, TANH, RELU, GAUSSIAN, SIN, ABS, MULT, SQUARE, ADD] for "default"
  });
  // setup NEAT trainer with the hyper parameters for GA.
  trainer = new N.NEATTrainer({
    new_node_rate : 0.2, // probability of a new node created for each genome during each evolution cycle
    new_connection_rate : 0.5, // probability of a new connection created for each genome during each evolution cycle, if it can be created
    num_populations: 2, // cluster the population into 5 sub populations that are similar using k-medoids
    sub_population_size : 20, // each sub population has 20 members, so 100 genomes in total
    init_weight_magnitude : 0.25, // randomise initial weights to be gaussians with zero mean, and this stdev.
    mutation_rate : 0.2, // probability of mutation for weights (for this example i made it large)
    mutation_size : 0.005, // if weights are mutated, how much we mutate them by in stdev? (I made it very small for this example)
    extinction_rate : 0.5, // probably that the worst performing sub population goes extinct at each evolution cycle
  }); // the initial population of genomes is randomly created after N.NEATTrainer constructor is called.
  trainer.applyFitnessFunc(fitnessFunc); // this would calculate the fitness for each genome in the population, and clusters them into the 5 sub populations
};

initModel();

while(true) {
	trainer.evolve();
	genomesCount = 0
	generation++
	trainer.applyFitnessFunc(fitnessFunc)
}


function startGame(gnome){
	var gn = gnome
	var R = require('./tetris/ml/recurrent.js');
	var N = require('./tetris/ml/neat.js');

	var nextFigure = (Math.random()*FIGURES.length)|0;
	var nextColor = 1+((Math.random()*5)|0);

	var board = [];
	var x = 0;
	var y = 0;
	var figure;
	var score = 0;
	var speed = 50;
	var results = [0,0,0,0]

	for (var i = 0; i < HEIGHT; i++) {
		board[i] = [];
		for (var j = 0; j < WIDTH; j++) {
			board[i][j] = 0;
		}
	}

	var selectFigure = function() {
		score ++
		figure = FIGURES[nextFigure];
		nextFigure = (Math.random()*FIGURES.length)|0;
		for (var i = 0; i < figure.length; i++) {
			for (var j = 0; j < figure.length; j++) {
				figure[i][j] = figure[i][j] && nextColor;
			}
		}
		nextColor = 1+((Math.random()*5)|0);
		y = -figure.length;
		x = ((WIDTH / 2) - (figure.length / 2)) | 0;

		var btm = figure.length-1;

		while (allEmpty(figure[btm])) {
			y++;
			btm--;
		}
	};

	var rotateFigureMutation = function(dir) {
		var result = [];
		for (var i = 0; i < figure.length; i++) {
			for (var j = 0; j < figure[i].length; j++) {
				var y = dir === 1 ? j : figure.length-j-1;
				var x = dir === 1 ? figure.length-1-i : i;
				result[y] = result[y] || [];
				result[y][x] = figure[i][j];
			}
		}
		figure = result;
	};
	var addFigureMutation = function(draw) {
		for (var i = 0; i < figure.length; i++) {
			for (var j = 0; j < figure[i].length; j++) {
				var py = y+i;
				var px = x+j;
				if (figure[i][j] && (px < 0 || px >= WIDTH)) return false;
				if (py < 0) continue;
				if (!figure[i][j]) continue;
				if (!board[py] || board[py][px] || board[py][px] === undefined) return false;
				if (!draw) continue;
				board[py][px] = figure[i][j] || board[py][px];
			}
		}
		return draw ? true : addFigureMutation(true);
	};
	var removeFigureMutation = function() {
		for (var i = 0; i < figure.length; i++) {
			for (var j = 0; j < figure[i].length; j++) {
				var py = y+i;
				var px = x+j;
				if (px < 0) continue;
				if (!figure[i][j] || !board[py] || board[py][px] === undefined) continue;
				board[py][px] = 0;
			}
		}
	};

	var line = function() {
		var arr = [];
		for (var i = 0; i < WIDTH; i++) {
			arr[i] = 0;
		}
		return arr;
	};
	var allEmpty = function(arr) {
		return !arr.some(function(val) {
			return val;
		});
	};
	var hasEmpty = function(arr) {
		return arr.some(function(val) {
			return !val;
		});
	};
	var moveFigure = function(dx,dy) {
		removeFigureMutation();
		x += dx;
		y += dy;
		if (addFigureMutation()) return true;
		x -= dx;
		y -= dy;
		addFigureMutation();
		draw();
	};

	var draw = function() {
		return true;
	}

	var rotateFigure = function(dir) {
		removeFigureMutation();
		rotateFigureMutation(dir);
		if (addFigureMutation()) return true;
		rotateFigureMutation(-dir);
		addFigureMutation();
	};
	var removeLines = function() {
		var modifier = 0;
		for (var i = 0; i < board.length; i++) {
			if (hasEmpty(board[i])) continue;
			board.splice(i,1);
			board.unshift(line());
			if (!modifier) {
				modifier += 150;
			}
			modifier *= 2;
			speed += 10;
		}
		score += modifier;
	};

	function calculateInput(gn) {
		var inputdata = []
		inputdata = [].concat.apply([], board)

		var model = {n:1, d:300, w: new Float32Array(inputdata), dw: new Float32Array(dwArray)}

		gn.setupModel(1)
	    gn.setInput(model); // put the input data into the network
	    var G = new R.Graph(false); // setup the recurrent.js graph. if no backprop, faster.
	    gn.forward(G); // propagates the network forward.
	    var output = gn.getOutput();
	    results = []
	    results.push(output[0].w[0])
	    results.push(output[1].w[0])
	    results.push(output[2].w[0])
	    results.push(output[3].w[0])

	    var key = indexOfMax(results)



	    if(key == 0) {
	    	moveFigure(-1, 0); // move left
	    } else if(key == 1) {
			if (moveFigure(0, 1)) { // move down
				score++
			}
	    } else if (key == 2){
			moveFigure(1, 0); // move right
	    } else if (key == 3){
	    	rotateFigure(1); // rotate
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
		while(true) {
			calculateInput(gn) // calculate the input accordingly to genome
			var canMove = moveFigure(0,1)
			if(!canMove && (y<0)) { // if top of gamefield is reached the game ends for that genome
				break;
			}
			if(!canMove) { // if the figure cannot move down check for lines and select new figure
				removeLines();
				selectFigure();
			}
		}
		return score
	}



	selectFigure();
	addFigureMutation();
	return gameLoop() // if the game ends return score to fitnessfunction

}