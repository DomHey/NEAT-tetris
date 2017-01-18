#!/usr/bin/env node

var clivas = require('./clivas');
var keypress = require('./keypress');
var R = require('./tetris/ml/recurrent.js');
var N = require('./tetris/ml/neat.js');

var WIDTH = 15;
var HEIGHT = 20;

// settings
var penaltyConnectionFactor = 0.03;
var learnRate = 0.01;
var genome; // keep one genome around for good use.
var mutatedGenome
var bestFitness = 0
var key
var generation = 1
var results = [0,0,0,0]

var dwArray = []

for (var i = 0; i < 300; i++) {
	dwArray.push(0)
};


clivas.alias('box-color', 'inverse+cyan');
clivas.alias('full-width', 2*WIDTH+4);
clivas.flush(false);
clivas.cursor(false);

'black white blue yellow green magenta'.split(' ').forEach(function(color, i) {
	clivas.alias('color-'+i, '2+inverse+'+color);
});

var NUMBERS = [
	[
		'xxx',
		'x x',
		'x x',
		'x x',
		'xxx'
	],[
		'  x',
		'  x',
		'  x',
		'  x',
		'  x'
	],[
		'xxx',
		'  x',
		'xxx',
		'x  ',
		'xxx'
	],[
		'xxx',
		'  x',
		'xxx',
		'  x',
		'xxx'
	],[
		'x x',
		'x x',
		'xxx',
		'  x',
		'  x'
	],[
		'xxx',
		'x  ',
		'xxx',
		'  x',
		'xxx'
	],[
		'xxx',
		'x  ',
		'xxx',
		'x x',
		'xxx'
	],[
		'xxx',
		'  x',
		'  x',
		'  x',
		'  x'
	],[
		'xxx',
		'x x',
		'xxx',
		'x x',
		'xxx'
	],[
		'xxx',
		'x x',
		'xxx',
		'  x',
		'  x'
	]
]
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


var fitnessFunc = function(genome, _backpropMode, _nCycles) {
	return score
}

function reset() {

	if(score >= bestFitness) {
		genome = mutatedGenome
	}

	for (var i = 0; i < HEIGHT; i++) {
		board[i] = [];
		for (var j = 0; j < WIDTH; j++) {
			board[i][j] = 0;
		}
	}

	trainer.applyFitnessFunc(fitnessFunc)
	trainer.evolve();
	mutatedGenome = trainer.getBestGenome();
	generation ++ 
	speed = 50
	score = 0
	setTimeout(loop, speed);
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
    num_populations: 5, // cluster the population into 5 sub populations that are similar using k-medoids
    sub_population_size : 20, // each sub population has 20 members, so 100 genomes in total
    init_weight_magnitude : 0.25, // randomise initial weights to be gaussians with zero mean, and this stdev.
    mutation_rate : 0.2, // probability of mutation for weights (for this example i made it large)
    mutation_size : 0.005, // if weights are mutated, how much we mutate them by in stdev? (I made it very small for this example)
    extinction_rate : 0.5, // probably that the worst performing sub population goes extinct at each evolution cycle
  }); // the initial population of genomes is randomly created after N.NEATTrainer constructor is called.
  trainer.applyFitnessFunc(fitnessFunc); // this would calculate the fitness for each genome in the population, and clusters them into the 5 sub populations
};

initModel();
genome = trainer.getBestGenome();
mutatedGenome = trainer.getBestGenome()


var nextFigure = (Math.random()*FIGURES.length)|0;
var nextColor = 1+((Math.random()*5)|0);;

var selectFigure = function() {
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
var getScore = function() {
	var color = 1+(((score / 100)|0)%5);

	return ('00000'.substring(score.toString().length)+score.toString()).split('').map(function(d) {
		var num = NUMBERS[d];
		return num;
	}).reduce(function(result, value) {
		value.forEach(function(line, i) {
			result[i] = (result[i] ? result[i] + ' ' : '');
			result[i] += ' '+line.replace(/x/g, '{2+color-'+color+'}').replace(/ /g, '  ');
		});
		return result;
	}, []);
};

var board = [];
var x = 0;
var y = 0;
var figure;
var score = 0;

for (var i = 0; i < HEIGHT; i++) {
	board[i] = [];
	for (var j = 0; j < WIDTH; j++) {
		board[i][j] = 0;
	}
}

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
	if (addFigureMutation()) return draw();
	x -= dx;
	y -= dy;
	addFigureMutation();
	draw();
};
var rotateFigure = function(dir) {
	removeFigureMutation();
	rotateFigureMutation(dir);
	if (addFigureMutation()) return draw();
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

var draw = function() {
	clivas.clear();

	var scoreDraw = getScore();

	clivas.line('');
	clivas.line(' {full-width+box-color}');

	for (var i = 0; i < HEIGHT; i++) {
		var line = '{color-'+board[i].join('}{color-')+'}';
		var padding = '              ';

		if (i > 3 && scoreDraw[i-4]) {
			padding = '  '+scoreDraw[i-4];
		}
		if (i > 10 && FIGURES[nextFigure][i-11]) {
			padding = '   '+FIGURES[nextFigure][i-11].join('').replace(/false/g, '').replace(/0/g, '  ').replace(/[1-9]/g, '{2+color-'+nextColor+'}')+'    ';
		}

		clivas.line(' {2+box-color}'+line+'{2+box-color}'+padding);
	}
	clivas.line(' {full-width+box-color} {green:g} {bold: '+generation+'}{bold: l:' + results[0].toFixed(2)+' d:' + results[1].toFixed(2)+' r:' + results[2].toFixed(2)+' u:' + results[3].toFixed(2)+'}');
	clivas.line('');


	return true;
};

function calculateInput() {
	var inputdata = []
	inputdata = [].concat.apply([], board)

	var model = {n:1, d:300, w: new Float32Array(inputdata), dw: new Float32Array(dwArray)}

	mutatedGenome.setupModel(1)
    mutatedGenome.setInput(model); // put the input data into the network
    var G = new R.Graph(false); // setup the recurrent.js graph. if no backprop, faster.
    mutatedGenome.forward(G); // propagates the network forward.
    var output = mutatedGenome.getOutput();
    results = []
    results.push(output[0].w[0])
    results.push(output[1].w[0])
    results.push(output[2].w[0])
    results.push(output[3].w[0])

    key = indexOfMax(results)

    if(key == 0) {
    	moveFigure(-1, 0);
    } else if(key == 1) {
		if (moveFigure(0, 1)) {
			score++
		}
    } else if (key == 2){
		moveFigure(1, 0);
    } else if (key == 3){
    	rotateFigure(1);
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

var loop = function() {
	calculateInput()
	if (moveFigure(0,1)) return setTimeout(loop, speed);
	removeLines();
	if (y < 0) {
		reset()
	}
	selectFigure();
	setTimeout(loop, speed);
};

var speed = 50;

setTimeout(loop, speed);

selectFigure();
addFigureMutation();
draw();

keypress(process.stdin);
process.stdin.on('keypress', function(ch, key) {
	if (key.name === 'c' && key.ctrl) return process.exit(0);
});
process.stdin.resume();

try {
	process.stdin.setRawMode(true);
} catch (err) {
	require('tty').setRawMode(true);
}