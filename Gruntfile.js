/** Gruntfile for [ludorum-game-connect4.js](http://github.com/LeonardoVal/ludorum-game-connect4.js).
*/
module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
	});

	require('creatartis-grunt').config(grunt, {
		sourceNames: ['__prologue__', 'Colograph', 'ui', 'ai', '__epilogue__'],
		deps: [
			{ id: 'creatartis-base', name: 'base' },
			{ id: 'sermat', name: 'Sermat',
		 		path: 'node_modules/sermat/build/sermat-umd-min.js' },
			{ id: 'ludorum' },
			{ id: 'playtester', dev: true, module: false,
		 		path: 'node_modules/ludorum/build/playtester-common.js' }
		],
		targets: {
			build_umd: {
				fileName: 'build/ludorum-game-colograph',
				wrapper: 'umd'
			},
			build_raw: {
				fileName: 'build/ludorum-game-colograph-tag',
				wrapper: 'tag'
			}
		}
	});

	grunt.registerTask('default', ['build']);
};
