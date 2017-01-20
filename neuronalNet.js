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
	}
}