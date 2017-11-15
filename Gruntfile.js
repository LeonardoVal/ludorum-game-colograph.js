/** Gruntfile for [ludorum-game-colograph.js](http://github.com/LeonardoVal/ludorum-game-colograph.js).
*/
module.exports = function (grunt) {
	var FB_APP_PATH = 'apps/colograph-creatartis.firebaseapp.com/';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		copy: {
			'firebase-app': {
				files: [
					{ src: 'node_modules/requirejs/require.js', nonull: true,
						dest: FB_APP_PATH +'public/js/require.js' },
					{ src: 'node_modules/creatartis-base/build/creatartis-base.min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/creatartis-base.js' },
					{ src: 'node_modules/sermat/build/sermat-umd-min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/sermat.js' },
					{ src: 'node_modules/ludorum/build/ludorum.min.js', nonull: true,
						dest: FB_APP_PATH +'public/js/ludorum.js' },
					{ src: 'build/ludorum-game-colograph.js', nonull: true,
						dest: FB_APP_PATH +'public/js/ludorum-game-colograph.js' },
				]
			}
		}
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

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.registerTask('default', ['build']);
	grunt.registerTask('firebase', ['build', 'copy:firebase-app']);
};
