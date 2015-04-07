module picolor {

	////////////////////////////////////////////////////////////////////////////////////////////////////
	// BASIC PICKER
	////////////////////////////////////////////////////////////////////////////////////////////////////

	export interface BasicPickerOptions {
		color?: Chroma.Color;
	}

	// 6 colors of with light and dark variations of each
	export var lightSpectrum: Chroma.Color[] = [
		chroma.hex(chroma.brewer.Paired[0]),
		chroma.hex(chroma.brewer.Paired[2]),
		chroma.hex(chroma.brewer.Paired[10]),
		chroma.hex(chroma.brewer.Paired[6]),
		chroma.hex(chroma.brewer.Paired[4]),
		chroma.hex(chroma.brewer.Paired[8])
	];
	export var darkSpectrum: Chroma.Color[] = [
		chroma.hex(chroma.brewer.Paired[1]),
		chroma.hex(chroma.brewer.Paired[3]),
		chroma.hex(chroma.brewer.Paired[11]),
		chroma.hex(chroma.brewer.Paired[7]),
		chroma.hex(chroma.brewer.Paired[5]),
		chroma.hex(chroma.brewer.Paired[9])
	];
	export var whiteToBlackInterpolator = chroma.scale(['white', 'black']).correctLightness(true);

	export class BasicPicker {
		private _lch: number[];
		private _alpha: number;
		private containerDivID: string;
		private colorBandDivID: string;
		private blackToWhiteBandDivID: string;

		constructor(containerDivID: string, options?: BasicPickerOptions) {
			// set defaults
			this._lch = picolor.whiteToBlackInterpolator(0.4).lch();	// default = white
			this._alpha = 1;											// default = opaque

			if (options)
				this.setOptions(options);

			// set div IDs
			this.containerDivID = containerDivID;
			this.colorBandDivID = this.containerDivID + '-colorband';
			this.blackToWhiteBandDivID = this.containerDivID + '-blacktowhiteband';

			// add DOM structure 
			var content =
				'<div>' +
				'	<div id="' + this.colorBandDivID + '-0' + '"></div>' +
				'	<div id="' + this.colorBandDivID + '-1' + '"></div>' +
				'	<div id="' + this.blackToWhiteBandDivID + '" style="margin-top: 6px"></div>' +
				'</div>';

			var container = $('#' + this.containerDivID);
			container.empty();
			container.append(content);
		}

		private setOptions(options: BasicPickerOptions) {
			// change private members, editing public members causes premature redraw
			if (options.color) {
				this._lch = options.color.lch();
				this._alpha = options.color.alpha();
			}
		}

		get lch(): number[] {
			return this._lch;
		}
		set lch(val: number[]) {
			// Constrain hue : 0 <= h < 360
			if (val[2] < 0) val[2] += 360;
			if (val[2] >= 360) val[2] -= 360;
			this._lch = val;

			this.draw(); // redraw control
		}

		get hex(): string {
			return chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
		}

		get color(): Chroma.Color {
			var color = chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
			color.alpha(this._alpha)
			return color;
		}
		set color(val: Chroma.Color) {
			this._lch = val.lch();
			this._alpha = val.alpha();
			this.draw();
		}

		draw() {
			// TODO: rather use canvas to draw blocks and add checkerbox to indicate transparency
			// TODO: add scaling based on container size rather than harcoded size

			// Remove all old click handlers - if you don't do this it destroys performance
			$('#' + this.containerDivID).off('click');

			var genSpectrumContent = (spectrum: Chroma.Color[], containerID: string) => {
				var content = '';
				for (var i = 0; i < spectrum.length; i++) {
					var divID = containerID + '-' + i;
					content += '<div id="' + divID + '" style="width: 38px;' +
					'height: 24px;' +
					'cursor: pointer;' +
					'display: inline-block;' +
					'padding: 1px;' +
					'background-color: #E0E0E0;' +
					'margin: 0px 4px 0px 4px;';
					if (this.color.css() === spectrum[i].css())
						content += ' border: 2px solid black;';
					else
						content += ' border: 2px solid #E0E0E0;';
					content += '">';
					content += '	<div style="height: 24px; background-color:' + spectrum[i].css() + '"></div>';
					content += '</div>';

					$('#' + this.containerDivID).on('click', '#' + divID, spectrum[i], (ev) => {
						this.lch = ev.data.lch();
						$('#' + this.containerDivID).trigger('oncolorchange', [this.color]);
					});
				}
				$('#' + containerID).empty();
				$('#' + containerID).append(content);
			}

			var blackWhiteSpectrum = [];
			var step = 0.2
			for (var i = 0; i < 6; i++)
				blackWhiteSpectrum.push(picolor.whiteToBlackInterpolator(i * step));

			genSpectrumContent(picolor.lightSpectrum, this.colorBandDivID + '-0');
			genSpectrumContent(picolor.darkSpectrum, this.colorBandDivID + '-1');
			genSpectrumContent(blackWhiteSpectrum, this.blackToWhiteBandDivID);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////
	// COLOR WHEEL
	////////////////////////////////////////////////////////////////////////////////////////////////////

	export interface ColorWheelOptions {
		color?: Chroma.Color;
	}

	export class ColorWheel {
		private _lch: number[];
		private _alpha: number;
		private containerDivID: string;
		private colorWheelDivID: string;
		private isDraggingLightness: boolean;
		private isDraggingColor: boolean;
		private isDraggingAlpha: boolean;

		private width: number;
		private height: number;
		private cx: number;
		private cy: number;
		private radius: number;
		private offset: JQueryCoordinates;

		constructor(containerDivID: string, options?: ColorWheelOptions) {
			// set defaults
			this._lch = picolor.whiteToBlackInterpolator(0.4).lch();	// default = white
			this._alpha = 1;											// default = opaque

			// defaults
			this.width = 298;
			this.height = 298;
			this.cx = this.width / 2;
			this.cy = this.height / 2;
			this.radius = 119;

			if (options)
				this.setOptions(options);

			// set div IDs
			this.containerDivID = containerDivID;
			this.colorWheelDivID = this.containerDivID + '-colorwheel';

			// add DOM structure 
			var content =
				'<div style="background-color: #E0E0E0; padding 5px">' +
				'	<canvas id="' + this.colorWheelDivID + '"></canvas>' +
				'</div>';

			var container = $('#' + this.containerDivID);
			container.empty();
			container.append(content);

			// hook up event handlers
			$('#' + this.colorWheelDivID).mouseleave(this.setWheelDragStateOff.bind(this));
			$('#' + this.colorWheelDivID).mouseup(this.setWheelDragStateOff.bind(this));
			$('#' + this.colorWheelDivID).mousedown((ev) => {
				this.setWheelDragStateOn(ev);
				this.setWheelColor(ev);
			});
			$('#' + this.colorWheelDivID).mousemove((ev) => {
				this.setCursor(ev);
				this.setWheelColor(ev);
			});
		}

		private setOptions(options: ColorWheelOptions) {
			// change private members, editing public members causes premature redraw
			if (options.color) {
				this._lch = options.color.lch();
				this._alpha = options.color.alpha();
			}
		}

		private setWheelDragStateOn(ev) {
			var x = ev.pageX - this.offset.left;
			var y = ev.pageY - this.offset.top;

			// check if click is inside wheel
			var rx = x - this.cx;
			var ry = y - this.cy;
			var d = Math.sqrt(rx * rx + ry * ry);
			if (d < this.radius) {
				this.isDraggingColor = true;
			}

			// inside lightness slider
			if (y >= 30 && y <= this.height - 30 && x >= -2 && x <= 24) {
				this.isDraggingLightness = true;
			}

			// inside transparency slider
			if (y >= 30 && y <= this.height - 30 && x >= this.width - 25 && x <= this.width + 1) {
				this.isDraggingAlpha = true;
			}
		}

		private setCursor(ev) {
			// don't change cursor while dragging
			if (this.isDraggingAlpha || this.isDraggingColor || this.isDraggingLightness) return;

			var x = ev.pageX - this.offset.left;
			var y = ev.pageY - this.offset.top;

			// inside color wheel
			var rx = x - this.cx;
			var ry = y - this.cy;
			var d = Math.sqrt(rx * rx + ry * ry);
			if (d < this.radius) {
				$('#' + this.colorWheelDivID).css('cursor', 'crosshair');
				return;
			}

			// inside lightness slider
			if (y >= 30 && y <= this.height - 30 && x >= -2 && x <= 18) {
				$('#' + this.colorWheelDivID).css('cursor', 's-resize');
				return;
			}

			// inside transparency slider
			if (y >= 30 && y <= this.height - 30 && x >= this.width - 19 && x <= this.width + 1) {
				$('#' + this.colorWheelDivID).css('cursor', 's-resize');
				return;
			}

			$('#' + this.colorWheelDivID).css('cursor', 'default');
		}

		private setWheelColor(ev) {
			if (!this.isDraggingAlpha && !this.isDraggingColor && !this.isDraggingLightness) return;

			var x = ev.pageX - this.offset.left;
			var y = ev.pageY - this.offset.top;

			// check if click is inside wheel
			if (this.isDraggingColor) {
				var rx = x - this.cx;
				var ry = y - this.cy;
				var d = Math.min(this.radius, Math.sqrt(rx * rx + ry * ry));

				// keep l constant when we select another color on the wheel
				var h = Math.atan2(ry, rx) * 180 / Math.PI;
				var c = 100 * d / this.radius;
				this.lch = [this.lch[0], c, h];
			}

			// inside lightness slider
			if (this.isDraggingLightness) {
				var l = Math.max(0, Math.min(100, 100 - (y - 30) / (this.height - 60) * 100));
				this.lch = [l, this.lch[1], this.lch[2]];
			}

			// inside transparency slider
			if (this.isDraggingAlpha) {
				this.alpha = Math.max(0, Math.min(1, 1 - (y - 30) / (this.height - 60)));
			}

			// trigger event
			$('#' + this.containerDivID).trigger('oncolorchange', [this.color]);
		}

		private setWheelDragStateOff(ev) {
			this.isDraggingAlpha = false;
			this.isDraggingColor = false;
			this.isDraggingLightness = false;
		}

		get lch(): number[] {
			return this._lch;
		}
		set lch(val: number[]) {
			// Constrain chroma : 0 <= c < 360
			if (val[2] < 0) val[2] += 360;
			if (val[2] >= 360) val[2] -= 360;

			this._lch = val;

			this.draw(); // redraw control
		}

		get hex(): string {
			return chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
		}

		get alpha(): number {
			return this._alpha;
		}
		set alpha(val: number) {
			this._alpha = val;
			this.draw(); // redraw control
		}

		get color(): Chroma.Color {
			var color = chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
			color.alpha(this._alpha);
			return color;
		}
		set color(val: Chroma.Color) {
			this._lch = val.lch();
			this._alpha = val.alpha();
			this.draw();
		}

		draw() {
			// TODO: add scaling based on container size rather than harcoded size

			this.offset = $('#' + this.colorWheelDivID).offset();

			var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.colorWheelDivID);
			var context = el.getContext('2d');

			var picked_x, picked_y: number; // canvas coordinates of picked color
			var picked_dist = Number.MAX_VALUE;

			el.width = this.width;
			el.height = this.height;

			var imageData = context.createImageData(this.width, this.height);
			var pixels = imageData.data;

			// draw wheel
			var i = 0;
			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++, i += 4) {
					var rx = x - this.cx;
					var ry = y - this.cy;
					var d = Math.sqrt(rx * rx + ry * ry);
					if (d < this.radius + 0.5) {

						// get foreground color
						var h = Math.atan2(ry, rx) * 180 / Math.PI;
						if (h < 0) h += 360;
						if (h > 360) h -= 360;
						var c = 100 * d / this.radius;

						var rgb = chroma.lch2rgb(this.lch[0], c, h);

						var dist = Math.sqrt(Math.pow(c - this.lch[1], 2) + Math.pow(h - this.lch[2], 2));
						if (dist < picked_dist) {
							picked_dist = dist;
							picked_x = x;
							picked_y = y;
						}

						var f_a = this.alpha;
						var f_r = rgb[0];
						var f_g = rgb[1];
						var f_b = rgb[2];

						// get background checkerbox to display alpha
						var horz = (Math.floor(x / 5) % 2 == 0);
						var vert = (Math.floor(y / 5) % 2 == 0);
						var val = (horz && !vert) || (!horz && vert) ? 250 : 200;
						var b_r = val;
						var b_g = val;
						var b_b = val;

						// blend foreground and background
						pixels[i] = (f_r * f_a) + (b_r * (1 - f_a));
						pixels[i + 1] = (f_g * f_a) + (b_g * (1 - f_a));
						pixels[i + 2] = (f_b * f_a) + (b_b * (1 - f_a));

						// anti-alias
						pixels[i + 3] = 255 * Math.max(0, this.radius - d);
					}
				}
			}

			// draw lightness slider
			i = 0;
			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++, i += 4) {
					if (y < 30 || y > this.height - 30) continue;
					if (x < 2 || x > 15) continue;

					var l = 100 - 100 * (y - 30) / (this.height - 60);
					var rgb = chroma.lch2rgb(l, this.lch[1], this.lch[2]);
					pixels[i] = rgb[0];
					pixels[i + 1] = rgb[1];
					pixels[i + 2] = rgb[2];
					pixels[i + 3] = 255;
				}
			}

			// draw transparency slider
			i = 0;
			var rgb = chroma.lch2rgb(this.lch[0], this.lch[1], this.lch[2]);
			for (var y = 0; y < this.height; y++) {
				for (var x = 0; x < this.width; x++, i += 4) {
					if (y < 30 || y > this.height - 30) continue;
					if (x < this.width - 16 || x > this.width - 3) continue;

					// foreground alpha
					var f_a = 1 - (y - 30) / (this.height - 60);
					var f_r = rgb[0];
					var f_g = rgb[1];
					var f_b = rgb[2];

					// background checkerbox
					var horz = (Math.floor(x / 5) % 2 == 0);
					var vert = (Math.floor(y / 5) % 2 == 0);
					var val = (horz && !vert) || (!horz && vert) ? 250 : 200;
					var b_r = val;
					var b_g = val;
					var b_b = val;

					// blend foreground and background
					pixels[i] = (f_r * f_a) + (b_r * (1 - f_a));
					pixels[i + 1] = (f_g * f_a) + (b_g * (1 - f_a));
					pixels[i + 2] = (f_b * f_a) + (b_b * (1 - f_a));
					pixels[i + 3] = 255;
				}
			}

			context.putImageData(imageData, 0, 0);

			// draw rectangle around selected color in lightness slider
			context.beginPath();
			context.lineWidth = 1.5;
			if (this.lch[0] > 50)
				context.strokeStyle = '#2f2f2f'; // for dark selector on light background
			else
				context.strokeStyle = '#dfdfdf'; // for light selector on dark background
			var lightnessY = 30 + (100 - this.lch[0]) / 100 * (this.height - 60);
			lightnessY = Math.max(35 + 2, Math.min(this.height - 30 - 6, lightnessY)); // limit position
			context.arc(9, lightnessY, 5, 0, 2 * Math.PI, false);
			context.stroke();

			// draw circle around selected color in wheel
			context.beginPath();
			if (this.alpha < 0.5)
				context.strokeStyle = '#2f2f2f';
			context.arc(picked_x, picked_y, 6, 0, 2 * Math.PI, false);
			context.stroke();

			// draw rectangle around selected tranparency
			context.beginPath();
			var alphaY = Math.min(this.height - 35, 30 + (1 - this.alpha) * (this.height - 60));
			alphaY = Math.max(35 + 2, Math.min(this.height - 30 - 6, alphaY)); // limit position
			context.arc(this.width - 9, alphaY, 5, 0, 2 * Math.PI, false);
			context.stroke();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////
	// PALETTE PICKER
	////////////////////////////////////////////////////////////////////////////////////////////////////

	export interface PaletteOptions {
		categoryCount?: number;
	}

	export class Palette {
		private _categoryCount: number;

		// sequential palettes
		private bluePalette: Chroma.Scale = chroma.scale(['#deebf7', '#08306b']).correctLightness(true);
		private orangePalette: Chroma.Scale = chroma.scale(['#fee6ce', '#7f2704']).correctLightness(true);
		private greenPalette: Chroma.Scale = chroma.scale(['#e5f5e0', '#00441b']).correctLightness(true);
		private grayPalette: Chroma.Scale = chroma.scale(['#d9d9d9', 'black']).correctLightness(true);

		// divergent palettes
		private brownWhiteSeagreenPalette1: Chroma.Scale = chroma.scale(['#543005', '#f5f5f5']).correctLightness(true);
		private brownWhiteSeagreenPalette2: Chroma.Scale = chroma.scale(['#f5f5f5', '#003c30']).correctLightness(true);
		private redYellowPurplePalette1: Chroma.Scale = chroma.scale(['#a50026', '#ffffbf']).correctLightness(true);
		private redYellowPurplePalette2: Chroma.Scale = chroma.scale(['#ffffbf', '#313695']).correctLightness(true);

		private sequentialPalettes: Chroma.Scale[];
		private divergentPalettes: Chroma.Scale[][];
		private qualitativePalettes: string[][];

		private paletteCanvasDivID;
		private offset: JQueryCoordinates;
		private margin: number = 10;
		private pad: number = 10;
		private h: number = 33;
		private w: number = 33;

		private palMatrix: Chroma.Color[][] = [];
		private selectedPalIdx: number = 0;
		private lighten: number = 0;

		constructor(public containerDivID: string, options?: PaletteOptions) {
			this.sequentialPalettes = [
				this.grayPalette,
				this.bluePalette,
				this.greenPalette,
				this.orangePalette
			];

			this.divergentPalettes = [
				[this.brownWhiteSeagreenPalette1, this.brownWhiteSeagreenPalette2],
				[this.redYellowPurplePalette1, this.redYellowPurplePalette2]
			];

			this.qualitativePalettes = [
				chroma.brewer.Paired
			];

			// set div IDs
			this.containerDivID = containerDivID;
			this.paletteCanvasDivID = this.containerDivID + '-canvas';

			if (options)
				this.setOptions(options)

			// add DOM structure 
			var content =
				'<div style="background-color: #E0E0E0; padding 5px; cursor: pointer;">' +
				'	<canvas id="' + this.paletteCanvasDivID + '"></canvas>' +
				'</div>';
			var container = $('#' + this.containerDivID);
			container.empty();
			container.append(content);

			// attach event handler
			$('#' + this.paletteCanvasDivID).click(this.onClick.bind(this));
		}

		private onClick(ev) {
			var x = ev.pageX - this.offset.left;
			var y = ev.pageY - this.offset.top;

			var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePalettes.length;
			var totWidth = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);

			this.selectedPalIdx = Math.floor(x / (totWidth / numPals));
			$('#' + this.containerDivID).trigger('oncolorchange', [this.hexPalette]);
			this.draw();
		}

		private setOptions(options: PaletteOptions) {
			if (options.categoryCount && options.categoryCount > 1) {
				this._categoryCount = options.categoryCount;
			}
		}

		get hexPalette(): string[] {
			var result = [];
			var pal = this.palMatrix[this.selectedPalIdx];
			for (var i = 0; i < pal.length; i++) {
				result.push(pal[i].hex());
			}
			return result;
		}

		get categoryCount(): number {
			return this._categoryCount;
		}
		set categoryCount(val: number) {
			this._categoryCount = val;
			this.draw();
		}

		draw() {
			this.offset = $('#' + this.paletteCanvasDivID).offset();

			var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.paletteCanvasDivID);
			var context = el.getContext('2d');

			var numCats = this.categoryCount;
			var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePalettes.length;

			el.width = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);
			el.height = this.margin * 2 + this.h * numCats;

			// sequential palettes
			for (var i = 0; i < this.sequentialPalettes.length; i++) {
				var palArr: Chroma.Color[] = [];
				var pal = this.sequentialPalettes[i];
				for (var j = 0; j < numCats; j++) {
					var idx = j / (numCats - 1);
					palArr.push(pal(idx));
				}
				this.palMatrix.push(palArr);
			}

			// divergent palettes
			for (var i = 0; i < this.divergentPalettes.length; i++) {
				var palArr: Chroma.Color[] = [];
				var pal1 = this.divergentPalettes[i][0];
				var pal2 = this.divergentPalettes[i][1];
				for (var j = 0; j < numCats; j++) {
					var idx = j / (numCats - 1);
					var col = (idx <= 0.5) ? pal1(idx * 2) : pal2((idx - 0.5) * 2);
					palArr.push(col);
				}
				this.palMatrix.push(palArr);
			}

			// qualitative palettes
			for (var i = 0; i < this.qualitativePalettes.length; i++) {
				var palArr: Chroma.Color[] = [];
				var palStr = this.qualitativePalettes[i];
				// TODO: interpolate colors for numCats > palStr.length
				for (var j = 0; j < palStr.length && j < numCats; j++) {
					palArr.push(chroma.hex(palStr[j]));
				}
				this.palMatrix.push(palArr);
			}

			// draw items from matrix
			for (var i = 0; i < this.palMatrix.length; i++) {
				var palArr = this.palMatrix[i];
				for (var j = 0; j < palArr.length; j++) {
					context.fillStyle = palArr[j];
					context.fillRect(this.margin + i * (this.w + this.pad), this.margin + j * this.h, this.w, this.h);
				}
			}

			// draw selected border
			context.strokeStyle = 'black';
			context.lineWidth = 2;
			context.strokeRect(this.margin - 2 + this.selectedPalIdx * (this.w + this.pad), this.margin - 2, this.w + 4, this.h * numCats + 4);
		}
	}
}
