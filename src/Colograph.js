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
		var newColours = Object.assign({}, this.colours);
		newColours[move] = activePlayer;
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

/** Adding Mancala to `ludorum.games`.
*/
ludorum.games.Colograph = Colograph;

/** Sermat serialization.
*/
Colograph.__SERMAT__.identifier = exports.__package__ +'.'+ Colograph.__SERMAT__.identifier;
exports.__SERMAT__.include.push(Colograph);
Sermat.include(exports);
