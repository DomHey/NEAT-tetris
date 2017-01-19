var INPUT = 0
var HIDDEN = 1
var OUTPUT = 2


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

		sum += this.nodeValue
		this.nodeValue = sum
		return sum
	}
}

function linkKonstruktor(w, bn)
{
	var weight = w;
	var backNodes = bn;
	this.getBackNodes = function() {
		return backNodes
	},
	this.getWeight = function () {
		return weight
	}

} 


var node1 = new nodeKonstruktor(INPUT)
node1.setNodeValue(1)

var node2 = new nodeKonstruktor(HIDDEN)
node2.setNodeValue(2)

var node3 = new nodeKonstruktor(HIDDEN)
node3.setNodeValue(2)

var node4 = new nodeKonstruktor(OUTPUT)
node4.setNodeValue(0)

var connection = new linkKonstruktor([1,1], [node2, node3])
node4.setConnections(connection)

var connection2 = new linkKonstruktor([1], [node1])
var connection3 = new linkKonstruktor([1], [node1])

node2.setConnections(connection2)
node3.setConnections(connection3)

console.log(node2.activate())
console.log(node3.activate())
console.log(node4.activate())