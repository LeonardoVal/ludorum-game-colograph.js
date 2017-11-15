(function (init) { "use strict";
			this["ludorum-game-colograph"] = init(this.base,this.Sermat,this.ludorum);
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
		for (var i = 0, len = this.edges.length; i < len; i++) {
			if (!colours.hasOwnProperty(i)) {
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
			move = moves[activePlayer] |0;
		raiseIf(move < 0 || move >= this.edges.length,
			'Invalid move: node ', move, ' does not exist in ', this, '.');
		raiseIf(this.colours.hasOwnProperty(move),
			'Invalid move: node ', move, ' has already been coloured in ', this, '.');
		var newColours = Object.assign(obj(move, activePlayer), this.colours);
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

	// ## Graph generation. ########################################################################

	/** One of the nice features of this game is the variety that comes from chaning the graph on
	which the game is played. `randomGraph` can be used to generate graphs to experiment with.
	*/
	'static randomGraph': function randomGraph(nodeCount, edgeCount, random) {
		nodeCount = Math.max(2, +nodeCount >> 0);
		edgeCount = Math.max(nodeCount - 1, +edgeCount >> 0);
		var edges = Iterable.range(nodeCount - 1).map(function (i) {
			return random.split(1, Iterable.range(i + 1, nodeCount).toArray());
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
	'static randomGame': function randomGame(params) {
		params = base.initialize({}, params)
			.object('random', { defaultValue: base.Randomness.DEFAULT })
			.integer('nodeCount', { defaultValue: 8, coerce: true })
			.integer('edgeCount', { defaultValue: 11, coerce: true })
			.integer('shapeCount', { defaultValue: 4, coerce: true, minimum: 1, maximum: 4 })
			.array('shapes', { defaultValue: ['circle', 'triangle', 'square', 'star'] })
			.subject;
		return new this({
			edges: this.randomGraph(params.nodeCount, params.edgeCount, params.random),
			shapes: params.random.randoms(params.nodeCount, 0, params.shapeCount).map(function (r) {
				return params.shapes[r|0];
			}),
			scoreSameShape: 1
		});
	}
}); // declare Colograph.

/** Adding Colograph to `ludorum.games`.
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

Object.assign(Colograph.prototype, {

/** Nodes in the `Colograph` object do not have a defined position. Yet they must be given one if
the board is going to be rendered properly. This _arrangement_ methods calculate an array of
positions for every node in the game, follwing different criteria:

	+ `circularArrangement` puts all nodes in a circle of a given `radius`.
*/
	circularArrangement: function circularArrangement(radius) {
		radius = radius || 200;
		var angle = 2 * Math.PI / this.edges.length;
		return this.edges.map(function (adjs, n) {
			return [Math.round(radius * Math.cos(angle * n)),
				Math.round(radius * Math.sin(angle * n))];
		});
	},

/**	+ `gridArrangement` puts nodes in the vertices of a grid with given numbers of `rows` and
	`columns`.
 */
 	gridArrangement: function gridArrangement(height, width, rows, columns) {
		height = height || 400;
		width = width || 400;
		var count = this.edges.length;
		if (!columns) {
			if (!rows) {
				rows = Math.ceil(Math.sqrt(count));
			}
			columns = Math.ceil(count / rows);
		}
		var rowHeight = height / (rows - 1),
			colWidth = width / (columns - 1);
		return this.edges.map(function (adjs, n) {
			return [
				(n % columns) * colWidth - width / 2,
				Math.floor(n / columns) * rowHeight - height / 2
			];
		});
	},

	//TODO More arrangement options.

/** Each player in the game represents a `playerColour`. If the game state has a `playerColours`
property defined, it is assumed it maps players with CSS colour names. Else the players' names in
lowercase are used as CSS colour names.
*/
	playerColour: function (player, playerColours) {
		playerColours = playerColours || this.playerColours;
		return playerColours && playerColours[player] ||
			player && (player +'').toLowerCase() || '';
	},

/** ## SVG #########################################################################################

These function implement the generation of Colograph game interfaces based on [Scalable Vector
Graphics (a.k.a. SVG)](https://www.w3.org/TR/SVG/).
*/

/** The _envelope_ of the SVG definitions include the processing instruction (`<?xml ... ?>`), the
SVG's DOCTYPE and the root element `svg`. The `xlink` namespace is used in the `use` elements.
*/
	__svgEnvelope__: function __svgEnvelope__(width, height, source) {
		return '<?xml version="1.0" standalone="no"?>\n'+
			'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" '+
				'"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'+
			'<svg height="'+ height +'px" width="'+ width +'px" version="1.1"\n'+
				'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n'+
			(Array.isArray(source) ? source.join('\n\t') : source) +
			'\n</svg>';
	},

/** The generated SVG for a Colograph game uses CSS styles as much as possible. Two style are
defined for each player and the blank state, one for edges and one for nodes.
*/
	__svgStyles__: function __svgStyles__(playerColours) {
		var game = this;
		return '<style type="text/css" ><![CDATA[\n'+
			'\t.blank-node { stroke:black; stroke-width:2px; fill:white; }\n'+
			'\t.blank-node:hover { stroke-width:4px; }\n'+
			'\t.blank-edge { stroke:black; stroke-width:2px; }\n'+
			this.players.map(function (p) { // Embedded CSS Styles
				var colour = game.playerColour(p, playerColours);
				return '\t.'+ colour +'-node { stroke:black; stroke-width:2px; fill:'+ colour +
					'}\n\t.'+	colour +'-edge { stroke:'+ colour +'; stroke-width:2px }';
			}).join('\n') +
			'\t]]>\n\t</style>\n';
	},

/** All possible node shapes are defined in a `defs` element, so they can be reused. A translate
transform is used to put each node in its corresponding possition. Still, `nodeSize` has to be
provided, since scaling may lead to weird results.
*/
	__svgDefs__: function __svgDefs__(nodeSize) {
		nodeSize = nodeSize || 30;
		return ['<defs>',
			this.__svgDefCircle__(nodeSize),
			this.__svgDefSquare__(nodeSize),
			this.__svgDefStar__(nodeSize),
			this.__svgDefTriangle__(nodeSize),
			this.__svgDefPentagon__(nodeSize),
			this.__svgDefHexagon__(nodeSize),
			'</defs>'
		].join('\n');
	},

/** Some of the available shapes are defined as polygons, given the `points` of their vertices.
These points are multiplied by `nodeSize`, hence the shape they defined must be centered at (0,0)
and must have a size of 1.
*/
	__svgDefPolygon__: function __svgDefPolygon__(name, points, nodeSize) {
		points = points.map(function (p) {
			return [p[0] * nodeSize, p[1] * nodeSize];
		});
		return '\t<polygon id="'+ name +'-node" points="'+ points.join(' ') +'"/>';
	},

/** Available shapes are:
	+ `circle`,
*/
	__svgDefCircle__: function __svgDefCircle__(nodeSize) {
		return '\t<circle id="circle-node" r="'+ (nodeSize / 2) +'px" cx="0" cy="0"/>';
	},

/** + `square`,
*/
	__svgDefSquare__: function __svgDefSquare__(nodeSize) {
		return '\t<rect id="square-node" width="'+ nodeSize +'px" height="'+ nodeSize +'px"'+
			' x="-'+ (nodeSize / 2) +'" y="-'+ (nodeSize / 2) +'"/>';
	},

/** + `triangle` (equilateral),
*/
	__svgDefTriangle__: function __svgDefTriangle__(nodeSize) {
		return this.__svgDefPolygon__('triangle', [
				[-0.50,+0.44], [+0.00,-0.44], [+0.50,+0.44]
			], nodeSize);
	},

/** + `star` (five points),
*/
	__svgDefStar__: function __svgDefStar__(nodeSize) {
		return this.__svgDefPolygon__('star', [
				[+0.00,-0.48], [+0.12,-0.10], [+0.50,-0.10], [+0.20,+0.10], [+0.30,+0.48],
				[+0.00,+0.26], [-0.30,+0.48], [-0.20,+0.10], [-0.50,-0.10], [-0.12,-0.10]
			], nodeSize);
	},

/** + `pentagon` (regular),
*/
	__svgDefPentagon__: function __svgDefPentagon__(nodeSize) {
		return this.__svgDefPolygon__('pentagon', [
				[+0.00,-0.48], [+0.50,-0.10], [+0.30,+0.48], [-0.30,+0.48], [-0.50,-0.10]
			], nodeSize);
	},

/** + `hexagon` (regular),
*/
	__svgDefHexagon__: function __svgDefHexagon__(nodeSize) {
		return this.__svgDefPolygon__('pentagon', [
				[+0.00,-0.50], [+0.42,-0.24], [+0.42,+0.24], [+0.00,+0.50], [-0.42,+0.24],
				[-0.42,-0.24]
			], nodeSize);
	},

/** The method `toSVG` generates the SVG representation of a Colograph game state.
*/
	toSVG: function toSVG(width, height, nodeSize, positions) {
		width = width || 400;
		height = height || 400;
		//positions = positions || this.circularArrangement(Math.max(width, height) / 2.4);
		positions = positions || this.gridArrangement(width * 0.8, height * 0.8);
		var game = this,
			colours = this.colours,
		 	svg = [
				this.__svgStyles__(),
				this.__svgDefs__(nodeSize),
				'\t<g id="colograph" transform="translate('+ (width / 2) +','+ (height / 2) +')">'
			];
		/** Edges are drawn before the nodes, so they do not appear in front of them.
		*/
		this.edges.forEach(function (n2s, n1) {
			var pos1 = positions[n1];
			n2s.forEach(function (n2) {
				var pos2 = positions[n2],
					colour = colours[n1 +','+ n2],
					cssClass = (game.playerColour(colour) || 'blank') +'-edge';
				svg.push('\t<line class="'+ cssClass +'" x1="'+ pos1[0] +'" y1="'+ pos1[1] +
					'" x2="'+ pos2[0] +'" y2="'+ pos2[1] +'"/>');
			});
		});
		/** Node shapes reuse the definitions generated before, and are put in place with a
		translation transform.
		*/
		var shapes = this.shapes;
		this.edges.forEach(function (adjs, n) {
			var pos = positions[n],
				colour = colours[n],
				cssClass = (game.playerColour(colour) || 'blank') +'-node';
			svg.push('<use id="node'+ n +'" xlink:href="#'+ shapes[n] +'-node" '+
				'transform="translate('+ pos.join(',') +')" class="'+ cssClass +'" '+
				'data-ludorum-move="'+ n +'"/>');
		});
		svg.push('\t</g>');
		return this.__svgEnvelope__(width, height, svg);
	} // Colograph.toSVG
}); //


// # AI for Colograph.

// ## Heuristics ###################################################################################

/** `heuristics` is a namespace for heuristic evaluation functions to be used with artificial
intelligence methods such as Minimax.
*/
Colograph.heuristics = {
	/** `scoreDifference(game, player)` is a simple heuristic that uses the current score.
	*/
	scoreDifference: function scoreDifference(game, player) {
		var score = game.score(),
			result = 0;
		for (var p in score) {
			result += p === player ? score[p] : -score[p];
		}
		return result / game.edges.length / 2;
	}
}; // Colograph.heuristics


// See __prologue__.js
	return exports;
}
);
//# sourceMappingURL=ludorum-game-colograph-tag.js.map