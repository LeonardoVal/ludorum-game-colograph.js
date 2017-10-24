require(['require-config'], function (init) { "use strict";
init(['creatartis-base', 'sermat', 'ludorum', 'playtester', 'ludorum-game-colograph'],
	function (base, Sermat, ludorum, PlayTesterApp, ludorum_game_colograph) {

	var BasicHTMLInterface = ludorum.players.UserInterface.BasicHTMLInterface;

	/** Custom HTML interface for Othello.
	*/
	var ColographHTMLInterface = window.ColographHTMLInterface = base.declare(BasicHTMLInterface, {
		constructor: function ColographHTMLInterface() {
			BasicHTMLInterface.call(this, {
				document: document,
				container: document.getElementById('board')
			});
		},

		display: function display(game) {
			var ui = this,
				activePlayer = game.activePlayer();
			this.container.innerHTML = game.toSVG();
			var nodes = this.container.children[0]
				.querySelectorAll('.blank-node[data-ludorum-move]');
			Array.prototype.slice.call(nodes).map(function (node) {
					var move = +node.getAttribute('data-ludorum-move');
					node.onclick = ui.perform.bind(ui, move, activePlayer);
				});
			return ui;
		}
	});

	/** PlayTesterApp initialization.
	*/
	base.global.APP = new PlayTesterApp(
		new ludorum_game_colograph.Colograph(),
		new ColographHTMLInterface(),
		{ bar: document.getElementsByTagName('footer')[0] },
		[ludorum_game_colograph]
	);
	APP.change = function change() {
		try {
			this.game = ludorum_game_colograph.Colograph.randomGame({
				nodeCount: 15, edgeCount: 30
			});
			this.reset();
		} catch (err) {
			console.error(err);
		}
	};
	APP.playerUI("You")
		.playerRandom()
		.playerMonteCarlo("", true, 10)
		.playerMonteCarlo("", true, 100)
		.playerUCT("", true, 10)
		.playerUCT("", true, 100)
		.playerAlfaBeta("MiniMax-\u03b1\u03b2 (4 plies)", true, 3)
		.playerAlfaBeta("MiniMax-\u03b1\u03b2 (6 plies)", true, 5)
		.selects(['player0', 'player1'])
		.button('resetButton', document.getElementById('reset'), APP.reset.bind(APP))
		.button('changeButton', document.getElementById('change'), APP.change.bind(APP))
		.change();
}); // init()
}); // require().
