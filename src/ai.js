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
