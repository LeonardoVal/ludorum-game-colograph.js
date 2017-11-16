/* jshint esversion:6 */
document.addEventListener('DOMContentLoaded', function () {
	var CONTAINER = document.getElementById('container'),
		FOOTER = document.getElementsByTagName('footer')[0],
		BOARD = document.getElementById('board'),
		INPUT_PLAYER_RED = document.getElementById('input-player-red'),
		INPUT_PLAYER_BLUE = document.getElementById('input-player-blue'),
		BTN_START_GAME = document.getElementById('button-startgame');

	function newMatch() {
		var playerRed = INPUT_PLAYER_RED.value,
			playerBlue = INPUT_PLAYER_BLUE.value;
		while (!playerRed) {
			playerRed = prompt("Who will be the first player?");
		}
		INPUT_PLAYER_RED.value = playerRed;
		while (!playerBlue) {
			playerBlue = prompt("Who will be the second player?");
		}
		INPUT_PLAYER_BLUE.value = playerBlue;

		var game = this.GAMES.shift(); // Cycle games.
		this.GAMES.push(game);

		var match = this.MATCH = new this.ludorum.Match(game.clone(), [
			new this.ludorum.players.UserInterfacePlayer(playerRed),
			new this.ludorum.players.UserInterfacePlayer(playerBlue)
		]);
		this.UI.show(match);

		var record = {
			user: this.USER,
			playerRed: playerRed,
			playerBlue: playerBlue,
			moves: [],
			results: null,
			whenStarted: (new Date()).toISOString(),
			game: this.Sermat.ser(game)
		};
		match.events.on('begin', function (game) {
			FOOTER.innerHTML = "Turn "+ game.activePlayer() +".";
		});
		match.events.on('move', function (game, moves) {
			record.moves.push(moves);
		});
		match.events.on('next', function (game, next) {
			FOOTER.innerHTML = "Turn "+ next.activePlayer() +".";
		});
		match.events.on('end', function (game, results) {
			var winner = game.players.filter(function (p) {
				return results[p] > 0;
			});
			record.results = results;
			record.whenFinished = (new Date()).toISOString();
			saveMatchRecord(record);
			FOOTER.innerHTML = (winner.length < 1 ? "Drawed game." : winner[0] +" wins.") +
				" Please start a new game.";
		});
		console.log("Starting match...");
		match.run();
		return match;
	}

	function saveMatchRecord(record) {
		console.log("Saving record: ", record);
		firebase.database().ref('/matches/colograph/').push().set(record).then(function () {
			console.log("Record saved.");
		}, function (err) {
			console.error(err);
		});
	}

	function main(user) {
		console.log('Loading libraries using RequireJS ...');
		return new Promise(function (resolve, reject) {
			require.config({
				'baseUrl' : '/js/'
				/*{
					"ludorum-game-colograph": "/js/ludorum-game-colograph",
					"creatartis-base": "/js/creatartis-base",
					"sermat": "/js/sermat",
					"ludorum": "/js/ludorum"
				}*/
			});
			require(['creatartis-base', 'sermat', 'ludorum', 'ludorum-game-colograph'],
			function (base, Sermat, ludorum, ludorum_game_colograph) {
				var global = base.global;
				global.base = base;
				global.Sermat = Sermat;
				global.ludorum = ludorum;
				global.ludorum_game_colograph = ludorum_game_colograph;
				console.log('Loaded: base, Sermat, ludorum, ludorum_game_colograph.');

				var BasicHTMLInterface = ludorum.players.UserInterface.BasicHTMLInterface,
					ColographHTMLInterface = window.ColographHTMLInterface = base.declare(BasicHTMLInterface, {
					constructor: function ColographHTMLInterface() {
						BasicHTMLInterface.call(this, {
							document: document,
							container: BOARD
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
				global.UI = new ColographHTMLInterface();
				global.GAMES = base.Randomness.DEFAULT.shuffle([
					new ludorum_game_colograph.Colograph({ // Balanced
					          edges: [
					               [1,4,5], [2,5],   [6,3],      [6,7],
					               [5,8],   [10],    [7,9],      [11],
					               [9,12],  [12,13], [11,14,15], [15],
					               [13],    [14],    [15],       []
					          ],
					          shapes: ['circle','circle','circle','circle','circle',
								'square','square','circle','circle','square','square',
								'circle','circle','circle','circle','circle'],
					          scoreSameShape: +1,
					          scoreDifferentShape: -1
					     }),
					new ludorum_game_colograph.Colograph({ // Very biased for blue.
					          edges: [
					               [1,4,5], [2,5],   [6,3],      [6,7],
					               [5,8],   [9,10],    [7,9,11],      [11],
					               [9,12],  [10,12,13], [11,14], [],
					               [13],    [],    []
					          ],
					          shapes: ['circle','circle','circle','circle','circle',
								'square','square','circle','circle','square','square',
								'circle','circle','circle','circle','circle'],
					          scoreSameShape: +1,
					          scoreDifferentShape: -1
					     }),
					new ludorum_game_colograph.Colograph({ // Biased for red.
					          edges:[
					               [9],[6],[3,9],[7],
								[5,8,10],[6,9,12],[8,11],[11],
								[9,12,14],[13],[11,13,14],[14],
								[],[],[],
					          ],
					          shapes: ['circle','square','circle','circle',
								 'square','circle','circle','circle',
								 'square','square','square','square',
								 'square','square','square'
							],
					          scoreSameShape: +1,
					          scoreDifferentShape: -1
					     })
				]);
				BTN_START_GAME.onclick = newMatch.bind(global);
				CONTAINER.hidden = false;
				FOOTER.innerHTML = 'Please input who is playing and start the game.';
				console.log('Ready.');
				resolve(global.UI);
			}, function (err) {
				console.error(err);
				reject(err);
			}); // require
		});
	} // main

// Firebase initialization /////////////////////////////////////////////////////////////////////////

	try {
		var app = window.FIREBASE_APP = firebase.app();
		firebase.auth().getRedirectResult().then(function(result) {
			if (result.credential) {
				window.USER = result.user.email;
				return main();
			} else { // User is not logged.
				FOOTER.innerHTML = "Checking user's login...";
				var provider = new firebase.auth.GoogleAuthProvider(),
					auth = firebase.auth();
				auth.useDeviceLanguage();
				auth.signInWithRedirect(provider);

			}
		}).catch(function(err) {
			console.log(err);
			FOOTER.innerHTML = "User authentication failed!";
		});
	} catch (err) {
		console.error(err);
		FOOTER.innerHTML = "Application initialization failed!";
	}
}); // 'DOMContentLoaded'
