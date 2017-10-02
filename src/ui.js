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
		return [Math.round(radius * Math.cos(angle * n)),
			Math.round(radius * Math.sin(angle * n))];
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
	positions = positions || this.circularArrangement(Math.max(width, height) / 2.5);
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
	svg.push('\t]]></style>');
	svg.push('\t<defs>'); // Shape library.
	for (var shape in SVG.SHAPES) {
		svg.push('\t\t'+ SVG.SHAPES[shape]);
	}
	svg.push('\t</defs>',
		'\t<g id="colograph" transform="translate('+ (width/2) +','+ (height/2) +')">');
	var colours = this.colours;
	this.edges.forEach(function (n2s, n1) { // Draw edges.
		var pos1 = positions[n1];
		n2s.forEach(function (n2) {
			var pos2 = positions[n2],
				colour = colours[n1 +','+ n2],
				cssClass = colour ? colour.toLowerCase() +'-edge' : 'blank-edge';
			svg.push('\t<line class="'+ cssClass +'" data-edge="'+ JSON.stringify([pos1,pos2]) +
				'" x1="'+ pos1[0] +'" y1="'+ pos1[1] +
				'" x2="'+ pos2[0] +'" y2="'+ pos2[1] +'"/>');
		});
	});
	var shapes = this.shapes;
	this.edges.forEach(function (adjs, n) { // Draw nodes.
		var pos = positions[n],
			colour = colours[n],
			cssClass = colour ? colour.toLowerCase() +'-node' : 'blank-node';
		svg.push('<use id="node'+ n +'" xlink:href="#'+ shapes[n] +'-node" '+
			'transform="translate('+ pos.join(',') +')" class="'+ cssClass +'" '+
			'data-ludorum-move="'+ n +'"/>');
	});
	svg.push('\t</g>', '</svg>');
	return svg.join('\n');
}; // Colograph.toSVG

Colograph.prototype.ui = {




}; // ui
