/** # Evaluation of Colograph games.
*/
"use strict";
// Imports /////////////////////////////////////////////////////////////////////////////////////////
var fs = require('fs'),
     base = require('creatartis-base'),
     Sermat = require('sermat'),
     ludorum = require('ludorum'),
     ludorum_game_colograph = require('../build/ludorum-game-colograph');

// Games ///////////////////////////////////////////////////////////////////////////////////////////
function randomGame() {
     return ludorum_game_colograph.Colograph.randomGame({
          nodeCount: 15, edgeCount: 30, shapeCount: 2
     });
}
function shapesFromString(str) {
     return str.split('').map(function (chr) {
          return chr === '#' ? 'square' : chr === '*' ? 'star' : chr === '0' ? 'circle' : '?';
     })
}

var GAME_01 = new ludorum_game_colograph.Colograph({ // Balanced
          edges: [
               [1,4,5], [2,5],   [6,3],      [6,7],
               [5,8],   [10],    [7,9],      [11],
               [9,12],  [12,13], [11,14,15], [15],
               [13],    [14],    [15],       []
          ],
          shapes: shapesFromString('00000##00##00000'),
          scoreSameShape: 1
     }),
     GAME_02 = new ludorum_game_colograph.Colograph({ // ??
          edges: [
               [1,4,5], [2,5],   [6,3],      [6,7],
               [5,8],   [9,10],    [7,9,11],      [11],
               [9,12],  [10,12,13], [11,14], [],
               [13],    [],    []
          ],
          shapes: shapesFromString('00000##00##0000'),
          scoreSameShape: +1,
          scoreDifferentShape: -1
     }),
     GAME_03 = new ludorum_game_colograph.Colograph({ // ??
          edges:[
               [10],[7,2],[6],[12,9],
               [11,13],[11],[11],[8,10,13],
               [13,9],[14,11,10],[12],[12],
               [14],[14],[]
          ],
          shapes:["triangle","circle","circle","triangle","triangle","circle","circle","triangle",
               "triangle","triangle","circle","triangle","circle","triangle","triangle"],
          scoreSameShape: +1,
          scoreDifferentShape: -1
     });

// Initialization //////////////////////////////////////////////////////////////////////////////////
var game = GAME_03,
     players = [
          //new ludorum.players.RandomPlayer({ name: 'Random' }),
          //new ludorum.players.MonteCarloPlayer({ name: 'MCTS(10)', simulationCount: 10, timeCap: Infinity }),
          new ludorum.players.MonteCarloPlayer({ name: 'MCTS(50)', simulationCount: 50, timeCap: Infinity }),
          new ludorum.players.MonteCarloPlayer({ name: 'MCTS(50)', simulationCount: 50, timeCap: Infinity }),
          //new ludorum.players.AlphaBetaPlayer({ name: 'MMAB(4)', horizon: 3 }),
          //new ludorum.players.AlphaBetaPlayer({ name: 'MMAB(6)', horizon: 5 })
     ],
     tournament = new ludorum.tournaments.RoundRobin(game, players, 10);

// Logging /////////////////////////////////////////////////////////////////////////////////////////
var logger = base.Logger.ROOT,
     logName = base.Text.formatDate(null, '"'+ __dirname +'/logs/colograph-evaluation-"yyyymmdd-hhnnss');
logger.appendToConsole();
logger.appendToFile(logName +'.log');
logger.info('Evaluating game: '+ Sermat.ser(game));
fs.writeFileSync(logName +'.svg', game.toSVG());

// Run evaluation tournament ///////////////////////////////////////////////////////////////////////
tournament.events.on('afterMatch', (function () {
     var i = 0;
     return function (match) {
          logger.info('Match '+ i +': '+ JSON.stringify(match.result()) +'.');
          i++;
     };
})());
tournament.run().then(function () {
     var stats = tournament.statistics;
     logger.info(stats.toString());
     var winsRed = stats.count({ key: 'victories', role: 'Red' }),
          winsBlue = stats.count({ key: 'victories', role: 'Blue' }),
          count = stats.count({ key: 'length' }) / 2;
     logger.info('Final evaluation: '+ (winsRed - winsBlue) / count);
}); // tournament.run
