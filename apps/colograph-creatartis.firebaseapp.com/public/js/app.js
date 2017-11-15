/* jshint esversion:6 */
document.addEventListener('DOMContentLoaded', function () {
	var FOOTER = document.getElementsByTagName('footer')[0];

	function newMatch(game) {
		var playerRed, playerBlue;
		while (!playerRed) {
			playerRed = prompt("Who will be the first player?");
		}
		while (!playerBlue) {
			playerBlue = prompt("Who will be the second player?");
		}

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
			FOOTER.innerHTML = winner.length < 1 ? 'Drawed game.' : winner[0] +' wins.';
			record.results = results;
			record.whenFinished = (new Date()).toISOString();
			saveMatchRecord(record);
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
				global.UI = new ColographHTMLInterface();
				global.GAME = ludorum_game_colograph.Colograph.randomGame({
					nodeCount: 9, edgeCount: 20
				});
				resolve(newMatch.call(global, global.GAME));
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
				document.getElementById('board').innerHTML = "Please log in.";
				var provider = new firebase.auth.GoogleAuthProvider(),
					auth = firebase.auth();
				auth.useDeviceLanguage();
				auth.signInWithRedirect(provider);

			}
		}).catch(function(err) {
			console.log(err);
			document.getElementById('board').innerHTML = "User authentication failed!";
		});
	} catch (err) {
		console.error(err);
		document.getElementById('board').innerHTML = "Application initialization failed!";
	}
}); // 'DOMContentLoaded'
