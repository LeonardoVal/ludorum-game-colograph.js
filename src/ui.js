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

	//TODO More arrangement options.

/**
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

	__svgStyles__: function __svgStyles__() {
		return '<style type="text/css" ><![CDATA[\n'+
			'\t.blank-node { stroke:black; stroke-width:2px; fill:white; }\n'+
			'\t.blank-node:hover { stroke-width:4px; }\n'+
			'\t.blank-edge { stroke:black; stroke-width:2px; }\n'+
			this.players.map(function (p) { // Embedded CSS Styles
				var colour = p.toLowerCase();
				return '\t.'+ colour +'-node { stroke:black; stroke-width:2px; fill:'+ colour +
					'}\n\t.'+	colour +'-edge { stroke:'+ colour +'; stroke-width:2px }';
			}).join('\n') +
			'\t]]>\n\t</style>\n';
	},

	__svgDefs__: function __svgDefs__(nodeSize) {
		nodeSize = nodeSize || 25;
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

	__svgDefCircle__: function __svgDefCircle__(nodeSize) {
		return '\t<circle id="circle-node" r="'+ (nodeSize / 2) +'px" cx="0" cy="0"/>';
	},

	__svgDefSquare__: function __svgDefSquare__(nodeSize) {
		return '\t<rect id="square-node" width="'+ nodeSize +'px" height="'+ nodeSize +'px"'+
			' x="-'+ (nodeSize / 2) +'" y="-'+ (nodeSize / 2) +'"/>';
	},

	__svgDefPolygon__: function __svgDefPolygon__(name, points, nodeSize) {
		points = points.map(function (p) {
			return [p[0] * nodeSize, p[1] * nodeSize];
		});
		return '\t<polygon id="'+ name +'-node" points="'+ points.join(' ') +'"/>';
	},

	__svgDefTriangle__: function __svgDefTriangle__(nodeSize) {
		return this.__svgDefPolygon__('triangle', [
				[-0.50,+0.44], [+0.00,-0.44], [+0.50,+0.44]
			], nodeSize);
	},

	__svgDefStar__: function __svgDefStar__(nodeSize) {
		return this.__svgDefPolygon__('star', [
				[+0.00,-0.48], [+0.12,-0.10], [+0.50,-0.10], [+0.20,+0.10], [+0.30,+0.48],
				[+0.00,+0.26], [-0.30,+0.48], [-0.20,+0.10], [-0.50,-0.10], [-0.12,-0.10]
			], nodeSize);
	},

	__svgDefPentagon__: function __svgDefPentagon__(nodeSize) {
		return this.__svgDefPolygon__('pentagon', [
				[+0.00,-0.48], [+0.50,-0.10], [+0.30,+0.48], [-0.30,+0.48], [-0.50,-0.10]
			], nodeSize);
	},

	__svgDefHexagon__: function __svgDefHexagon__(nodeSize) {
		return this.__svgDefPolygon__('pentagon', [
				[+0.00,-0.50], [+0.42,-0.24], [+0.42,+0.24], [+0.00,+0.50], [-0.42,+0.24],
				[-0.42,-0.24]
			], nodeSize);
	},

	toSVG: function toSVG(width, height, nodeSize, positions) {
		width = width || 400;
		height = height || 400;
		nodeSize = nodeSize || 30;
		positions = positions || this.circularArrangement(Math.max(width, height) / 2.5);
		var svg = [
			this.__svgStyles__(),
			this.__svgDefs__(nodeSize),
			'\t<g id="colograph" transform="translate('+ (width/2) +','+ (height/2) +')">'
		];
		var colours = this.colours;
		this.edges.forEach(function (n2s, n1) { // Draw edges.
			var pos1 = positions[n1];
			n2s.forEach(function (n2) {
				var pos2 = positions[n2],
					colour = colours[n1 +','+ n2],
					cssClass = colour ? colour.toLowerCase() +'-edge' : 'blank-edge';
				svg.push('\t<line class="'+ cssClass +'" x1="'+ pos1[0] +'" y1="'+ pos1[1] +
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
		svg.push('\t</g>');
		return this.__svgEnvelope__(width, height, svg);
	} // Colograph.toSVG
}); //
