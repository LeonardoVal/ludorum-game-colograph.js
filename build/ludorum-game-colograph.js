(function (init) { "use strict";
			if (typeof define === 'function' && define.amd) {
				define(["creatartis-base","sermat","ludorum"], init); // AMD module.
			} else if (typeof exports === 'object' && module.exports) {
				module.exports = init(require("creatartis-base"),require("sermat"),require("ludorum")); // CommonJS module.
			} else {
				this["ludorum-game-colograph"] = init(this.base,this.Sermat,this.ludorum); // Browser.
			}
		}).call(this,/** Package wrapper and layout.
*/
function __init__(base, Sermat, ludorum) { "use strict";
// Import synonyms. ////////////////////////////////////////////////////////////////////////////////
	var declare = base.declare,
		obj = base.obj,
		copy = base.copy,
		raise = base.raise,
		raiseIf = base.raiseIf,
		Iterable = base.Iterable,
		iterable = base.iterable,
		Game = ludorum.Game,
		UserInterface = ludorum.players.UserInterface;

// Library layout. /////////////////////////////////////////////////////////////////////////////////
	var exports = {
		__package__: 'ludorum-game-colograph',
		__name__: 'ludorum_game_colograph',
		__init__: __init__,
		__dependencies__: [base, Sermat, ludorum],
		__SERMAT__: { include: [base, ludorum] }
	};


/** # Colograph

Implementation of the game Colograph, a competitive version of the classic [graph colouring problem](http://en.wikipedia.org/wiki/Graph_coloring).
*/
var Colograph = exports.Colograph = declare(Game, {
	name: 'Colograph',

	/** The constructor takes the following arguments:
	*/
	constructor: function Colograph(args) {
		/** + `activePlayer`: There is only one active player per turn, and it is the first player
			by default.
		*/
		Game.call(this, args ? args.activePlayer : undefined);
		base.initialize(this, args)
		/** + `colours`: The colour of each node in the graph is given by an array of integers, each
			being the node's player index in the players array, or -1 for uncoloured nodes. By
			default all nodes are not coloured, which is the initial game state.
		*/
			.object('colours', { defaultValue: {} })
		/** + `edges`: The edges of the graph are represented by an array of arrays of integers,
			acting as an adjacency list.
		*/
			.array('edges', { defaultValue: [[1,3],[2],[3],[]] })
		/** + `shapes`: Each of the graph's nodes can have a certain shape. This is specified by an
			array of strings, one for each node.
		*/
			.array('shapes', { defaultValue: ['circle', 'triangle', 'square', 'star'] })
		/** + `scoreSameShape=-1`: Score added by each coloured edge that binds two nodes of the
			same shape.
		*/
			.number('scoreSameShape', { defaultValue: -1, coerce: true })
		/** + `scoreDifferentShape=-1`: Score added by each coloured edge that binds two nodes of
			different shapes.
		*/
			.number('scoreDifferentShape', { defaultValue: -1, coerce: true });
	},

	/** There are two roles in this game: Red and Blue.
	*/
	players: ['Red', 'Blue'],

	/** Scores are calculated for each player with the edges of their colour. An edge connecting two
	nodes of the same colour is considered to be of that colour.
	*/
	score: function score() {
		var points = {},
			shapes = this.shapes,
			colours = this.colours,
			scoreSameShape = this.scoreSameShape,
			scoreDifferentShape = this.scoreDifferentShape,
			startingPoints = this.edges.length;
		this.players.forEach(function (player) {
			points[player] = startingPoints;
		});
		iterable(this.edges).forEach(function (n1_edges, n1) {
			n1_edges.forEach(function (n2) {
				var k = n1 +','+ n2;
				if (colours.hasOwnProperty(k)) {
					points[colours[k]] += shapes[n1] === shapes[n2] ? scoreSameShape : scoreDifferentShape;
				}
			});
		});
		return points;
	},

	/** The game ends when the active player has no moves, i.e. when all nodes in the graph have
	been coloured. The match is won by the player with the greatest score.
	*/
	result: function result() {
		if (!this.moves()) { // If the active player cannot move, the game is over.
			var points = this.score(),
				players = this.players;
			return this.zerosumResult(points[players[0]] - points[players[1]], players[0]);
		} else {
			return null; // The game continues.
		}
	},

	/** Every non coloured node is a possible move for the active player.
	*/
	moves: function moves() {
		var colours = this.colours,
			uncoloured = [];
		for (var i = 0; i < this.edges.length; i++) {
			if (!this.colours.hasOwnProperty(i)) {
				uncoloured.push(i);
			}
		}
		return uncoloured.length < 1 ? null : obj(this.activePlayer(), uncoloured);
	},

	/** The result of any move is the colouring of one previously uncoloured node with the active
	players's colour.
	*/
	next: function next(moves, haps, update) {
		raiseIf(haps, 'Haps are not required (given ', haps, ')!');
		var activePlayer = this.activePlayer(),
			move = +moves[activePlayer] >> 0;
		raiseIf(move < 0 || move >= this.colours.length,
			'Invalid move: node ', move, ' does not exist in ', this, '.');
		raiseIf(this.colours[move] >= 0,
			'Invalid move: node ', move, ' has already been coloured in ', this, '.');
		var newColours = copy(obj(move, activePlayer), this.colours);
		this.edges[move].forEach(function (n2) { // Colour edges from the one coloured in this move.
			if (newColours[n2] === activePlayer) {
				newColours[move +','+ n2] = activePlayer;
			}
		});
		this.edges.forEach(function (adjs, n1) { // Colour edges to the one coloured in this move.
			if (n1 !== move && adjs.indexOf(move) >= 0 && newColours[n1] === activePlayer) {
				newColours[n1 +','+ move] = activePlayer;
			}
		});
		var args = {
			activePlayer: this.opponent(activePlayer),
			colours: newColours,
			edges: this.edges,
			shapes: this.shapes,
			scoreSameShape: this.scoreSameShape,
			scoreDifferentShape: this.scoreDifferentShape
		};
		if (update) {
			this.constructor(args);
			return this;
		} else {
			return new this.constructor(args);
		}
	},

	// ## Utility methods ##########################################################################

	/** Serialization is used in the `toString()` method, but it is also vital for sending the game
	state across a network or the marshalling between the rendering thread and a webworker.
	*/
	'static __SERMAT__': {
		identifier: 'Colograph',
		serializer: function serialize_Colograph(obj) {
			return [{
				activePlayer: obj.activePlayer(),
				colours: obj.colours,
				edges: obj.edges,
				shapes: obj.shapes,
				scoreSameShape: obj.scoreSameShape,
				scoreDifferentShape: obj.scoreDifferentShape
			}];
		}
	},

	// ## Game properties. #########################################################################

	/** `edgeColour(node1, node2)` returns a colour (player index) if the nodes are joined by an
	edge, and both have that same colour.
	*/
	edgeColour: function edgeColour(node1, node2) {
		var connected = this.edges[node1].indexOf(node2) >= 0 || this.edges[node2].indexOf(node1) >= 0,
			colour1 = this.colours[node1],
			colour2 = this.colours[node2];
		return connected && colour1 >= 0 && colour1 === colour2 ? colour1 : -1;
	},

	// ## Heuristics. ##############################################################################

	/** `heuristics` is a namespace for heuristic evaluation functions to be used with artificial
	intelligence methods such as Minimax.
	*/
	'static heuristics': {
		/** + `scoreDifference(game, player)` is a simple heuristic that uses the current score.
		*/
		scoreDifference: function scoreDifference(game, player) {
			var score = game.score(),
				result = 0;
			for (var p in score) {
				result += p === player ? score[p] : -score[p];
			}
			return result / game.edges.length / 2;
		}
	},

	// ## Graph generation. ########################################################################

	/** One of the nice features of this game is the variety that comes from chaning the graph on
	which the game is played. `randomGraph` can be used to generate graphs to experiment with.
	*/
	'static randomGraph': function randomGraph(nodeCount, edgeCount, random) {
		nodeCount = Math.max(2, +nodeCount >> 0);
		edgeCount = Math.max(nodeCount - 1, +edgeCount >> 0);
		var edges = basis.iterables.range(nodeCount - 1).map(function (i) {
			return random.split(1, basis.iterables.range(i + 1, nodeCount).toArray());
		}).toArray();
		for (var n = edgeCount - (nodeCount - 1), pair, pair2; n > 0; n--) {
			pair = random.choice(edges);
			if (pair[1].length > 0) {
				pair2 = random.split(1, pair[1]);
				pair[0].push(pair2[0][0]);
				pair[1] = pair2[1];
				n--;
			}
		}
		edges = edges.map(function (pair) {
			return pair[0];
		});
		edges.push([]); // Last node has no edges.
		return edges;
	},

	/** `randomGame(params)` will generates a random Colograph game with a random graph.
	*/
	'static randomGame': function randomGame(args) {
		params = base.initialize({}, params)
			.object('random', { defaultValue: randomness.DEFAULT })
			.integer('nodeCount', { defaultValue: 8, coerce: true })
			.integer('edgeCount', { defaultValue: 11, coerce: true })
			.integer('shapeCount', { defaultValue: 4, coerce: true, minimum: 1, maximum: 4 })
			.subject;
		var SHAPES = ['circle', 'triangle', 'square', 'star'];
		return new Colograph({
			edges: this.randomGraph(params.nodeCount, params.edgeCount, params.random),
			shapes: params.random.randoms(params.nodeCount, 0, params.shapeCount).map(function (r) {
				return SHAPES[r|0];
			}),
			scoreSameShape: 1
		});
	},

	// ## Human interface based on KineticJS. ######################################################

	/** This legacy code is an implementation of a UI for Colograph using
	[KineticJS](http://kineticjs.com/). Not entirely compatible yet.
	*/
	'static KineticUI': declare(UserInterface, {
		constructor: function KineticUI(args) {
			UserInterface.call(this, args);
			initialize(this, args)
				.string("container", { defaultValue: "colograph-container" })
				.object("Kinetic", { defaultValue: window.Kinetic })
				.integer('canvasRadius', { defaultValue: NaN, coerce: true })
				.integer('nodeRadius', { defaultValue: 15, coerce: true })
				.array('playerColours', { defaultValue: ['red', 'blue'] });
			if (isNaN(this.canvasRadius)) {
				this.canvasRadius = (Math.min(screen.width, screen.height) * 0.6) >> 1;
			}
			var stage = this.stage = new Kinetic.Stage({
					container: this.container,
					width: this.canvasRadius * 2,
					height: this.canvasRadius * 2
				}),
				layer = this.layer = new Kinetic.Layer({
					clearBeforeDraw: true,
					offsetX: -this.canvasRadius,
					offsetY: -this.canvasRadius
				}),
				game = this.match.state();
			stage.add(layer);
			setInterval(stage.draw.bind(stage), 1000 / 30);
			layer.destroyChildren();
			this.edges = {};
			this.nodes = {};
			this.drawEdges(game);
			this.drawNodes(game);
		},

		drawEdges: function drawEdges(game) {
			var angle = 2 * Math.PI / game.edges.length,
				radius = this.canvasRadius - this.nodeRadius * 2,
				ui = this;
			game.edges.forEach(function (n2s, n1) { // Create lines.
				n2s.forEach(function (n2) {
					var line = new ui.Kinetic.Line({
						points: [radius * Math.cos(angle * n1), radius * Math.sin(angle * n1),
								radius * Math.cos(angle * n2), radius * Math.sin(angle * n2)],
						stroke: "black", strokeWidth: 2
					});
					ui.edges[n1+','+n2] = line;
					ui.layer.add(line);
				});
			});
		},

		drawNodes: function drawNodes(game) {
			var angle = 2 * Math.PI / game.edges.length,
				radius = this.canvasRadius - this.nodeRadius * 2,
				ui = this;
			game.edges.forEach(function (adjs, n) {
				var shape,
					x = radius * Math.cos(angle * n),
					y = radius * Math.sin(angle * n);
				switch (game.shapes[n]) {
					case 'square':
						shape = ui.drawSquare(x, y, ui.nodeRadius, n); break;
					case 'triangle':
						shape = ui.drawTriangle(x, y, ui.nodeRadius, n); break;
					case 'star':
						shape = ui.drawStar(x, y, ui.nodeRadius, n); break;
					default:
						shape = ui.drawCircle(x, y, ui.nodeRadius, n);
				}
				shape.on('mouseover', function () {
					shape.setScale(1.2);
				});
				shape.on('mouseout', function () {
					shape.setScale(1);
				});
				shape.on('click tap', function () {
					ui.perform(n);
				});
				shape.setRotation(Math.random() * 2 * Math.PI);//FIXME
				ui.nodes[n] = shape;
				ui.layer.add(shape);
			});
		},

		drawCircle: function drawCircle(x, y, r, n) {
			return new this.Kinetic.Circle({
				x: x, y: y, radius: r,
				fill: "white", stroke: "black", strokeWidth: 2
			});
		},

		drawSquare: function drawSquare(x, y, r, n) {
			return new this.Kinetic.Rect({
				x: x, y: y, width: r * 2, height: r * 2,
				offsetX: r, offsetY: r,
				fill: "white", stroke: "black", strokeWidth: 2
			});
		},

		drawStar: function drawStar(x, y, r, n) {
			return new Kinetic.Star({ numPoints: 5,
				x: x, y: y, innerRadius: r * 0.6, outerRadius: r * 1.5,
				fill: 'white', stroke: 'black', strokeWidth: 2
			});
		},

		drawTriangle: function drawTriangle(x, y, r, n) {
			return new Kinetic.RegularPolygon({ sides: 3,
				x: x, y: y, radius: r * 1.25,
				fill: 'white', stroke: 'black', strokeWidth: 2
			});
		},

		display: function display(game) {
			this.updateEdges(game);
			this.updateNodes(game);
		},

		updateEdges: function updateEdges(game) {
			var ui = this;
			game.edges.forEach(function (n2s, n1) {
				n2s.forEach(function (n2) {
					var k = n1+','+n2;
					ui.edges[k].setStroke(game.colours[k] || "black");
				});
			});
		},

		updateNodes: function updateNodes(game) {
			var ui = this;
			game.edges.forEach(function (adjs, n) {
				var colour = game.colours[n];
				if (colour) {
					ui.nodes[n].setFill(colour);
					ui.nodes[n].off('mouseover mouseout click tap');
				}
			});
		}
	}) // KineticJSCircleUI.

}); // declare Colograph.

/** Adding Mancala to `ludorum.games`.
*/
ludorum.games.Colograph = Colograph;

/** Sermat serialization.
*/
Colograph.__SERMAT__.identifier = exports.__package__ +'.'+ Colograph.__SERMAT__.identifier;
exports.__SERMAT__.include.push(Colograph);
Sermat.include(exports);


/** # User interface

The user interface for playtesters is based on [SVG](https://www.w3.org/TR/SVG/).
*/

/** Nodes in the `Colograph` object do not have a defined position. Yet they must be given one if
the board is going to be rendered properly. This _arrangement_ methods calculate an array of
positions for every node in the game, follwing different criteria:

+ `circularArrangement` puts all nodes in a circle of a given `radius`.
*/
Colograph.prototype.circularArrangement = function circularArrangement(radius) {
	radius = radius || 200;
	var angle = 2 * Math.PI / this.edges.length;
	return this.edges.map(function (adjs, n) {
		return [radius * Math.cos(angle * n), radius * Math.sin(angle * n)];
	});
};

//TODO More arrangement options.

/**
*/
var SVG = exports.SVG = {
	HEADER: '<?xml version="1.0" standalone="no"?>\n'+
		'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" '+
			'"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
	SHAPES: {
		circle: '<circle id="circle-node" r="25px" cx="0" cy="0"/>',
		square: '<rect id="square-node" width="50" height="50" x="-25" y="-25"/>',
		star: '<polygon id="star-node" points="0,-24 6,-5 25,-5 10,5 15,24 0,13 -15,24 -10,5 -25,-5 -6,-5"/>',
		triangle: '<polygon id="triangle-node" points="-25,22 0,-22 25,22"/>',
		pentagon: '<polygon id="pentagon-node" points="0,-24 25,-5 15,24 -15,24 -25,-5"/>',
		hexagon: '<polygon id="hexagon-node" points="0,-25 21,-12 21,12 0,25 -21,12 -21,-12"/>',
	}
};

Colograph.prototype.toSVG = function toSVG(width, height, positions) {
	width = width || 500;
	height = height || 500;
	positions = positions || this.circularArrangement(Math.max(width, height) / 3);
	var svg = [SVG.HEADER,
		'<svg height="'+ height +'px" width="'+ width +'px" version="1.1"',
		'\txmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
		'\t<style type="text/css" ><![CDATA[',
		'\t\t.blank-node { stroke:black; stroke-width:2px; fill:white; }',
		'\t\t.blank-node:hover { stroke-width:4px; }',
		'\t\t.blank-edge { stroke:black; stroke-width:2px; }'
	];
	this.players.forEach(function (p) { // Embedded CSS Styles
		var colour = p.toLowerCase();
		svg.push(
			'\t\t.'+ colour +'-node { stroke:black; stroke-width:2px; fill:'+ colour +'}',
			'\t\t.'+ colour +'-edge { stroke:'+ colour +'; stroke-width:2px }'
		);
	});
	svg.push('\t]]></style>\n');
	svg.push('\t<defs>\n'); // Shape library.
	for (var shape in SVG.SHAPES) {
		svg.push('\t\t'+ SVG.SHAPES[shape]);
	}
	svg.push('\t</defs>\n');
	this.edges.forEach(function (n2s, n1) { // Draw edges.
		var pos1 = positions[n1];
		n2s.forEach(function (n2) {
			var pos2 = positions[n2];
			svg.push('\t<line class="blank-arc" data-edge="'+ JSON.stringify([pos1,pos2]) +
				'" x1="'+ pos1[0] +'" y1="'+ pos1[1] +
				'" x2="'+ pos2[0] +'" y2="'+ pos2[1] +'"/>');
		});
	});
	var shapes = this.shapes;
	this.edges.forEach(function (adjs, n) { // Draw nodes.
		var pos = positions[n];
		svg.push('<use id="node'+ n +'" xlink:href="#'+ shapes[n] +'-node" '+
			'transform="translate('+ pos.join(',') +')" class="blank-node"/>');
	});
	svg.push('</svg>');
	return svg.join('\n');
}; // Colograph.toSVG

Colograph.prototype.ui = {




}; // ui


// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-game-colograph.js.map