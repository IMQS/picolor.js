import * as Chroma from 'chroma-js'

////////////////////////////////////////////////////////////////////////////
// Utils
////////////////////////////////////////////////////////////////////////////

function _id(divID: string): HTMLElement {
	return document.getElementById(divID);
}

function _empty(divID: string): void {
	const el = _id(divID);
	if (!el) return;
	while (el.firstChild) {
   		el.removeChild(el.firstChild);
	}
}

function _append(divID: string, html: string): void {
	const el = _id(divID);
	if (!el) return;
	el.innerHTML += html;
}

function _offset(divID: string): { top: number; left: number } {
	const el = _id(divID);
	var rect = el.getBoundingClientRect();
	return {
		top: rect.top + document.body.scrollTop,
		left: rect.left + document.body.scrollLeft
	};
}

// 6 colors of with light and dark variations of each
var _lightSpectrum: Chroma.Color[] = [
	Chroma.hex(Chroma.brewer.Paired[0]),
	Chroma.hex(Chroma.brewer.Paired[2]),
	Chroma.hex(Chroma.brewer.Paired[10]),
	Chroma.hex(Chroma.brewer.Paired[6]),
	Chroma.hex(Chroma.brewer.Paired[4]),
	Chroma.hex(Chroma.brewer.Paired[8])
];

var _darkSpectrum: Chroma.Color[] = [
	Chroma.hex(Chroma.brewer.Paired[1]),
	Chroma.hex(Chroma.brewer.Paired[3]),
	Chroma.hex(Chroma.brewer.Paired[11]),
	Chroma.hex(Chroma.brewer.Paired[7]),
	Chroma.hex(Chroma.brewer.Paired[5]),
	Chroma.hex(Chroma.brewer.Paired[9])
];

var _whiteToBlackInterpolator = Chroma.scale(['white', 'black']).correctLightness(true);

function _lch2rgb(l: number, c: number, h: number): Uint8Array {
	var lab_xyz = function (x: number) {
		if (x > 0.206893034) {
			return x * x * x;
		} else {
			return (x - 4 / 29) / 7.787037;
		}
	};
	var xyz_rgb = function (r: number) {
		return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
	};
	var rgbCap = function (x: number) {
		return Math.max(0, Math.min(255, x));
	};
	var rgb = new Uint8Array(3);
	// convert to Lab		
	var h1 = h * Math.PI / 180;
	var a = Math.cos(h1) * c;
	var b = Math.sin(h1) * c;
	// convert to rgb
	var X = 0.950470;
	var Y = 1;
	var Z = 1.088830;
	var y = (l + 16) / 116;
	var x = y + a / 500;
	var z = y - b / 200;
	x = lab_xyz(x) * X;
	y = lab_xyz(y) * Y;
	z = lab_xyz(z) * Z;
	rgb[0] = rgbCap(xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z));
	rgb[1] = rgbCap(xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z));
	rgb[2] = rgbCap(xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z));
	return rgb;
}

////////////////////////////////////////////////////////////////////////////
// Basic Picker
////////////////////////////////////////////////////////////////////////////

export interface BasicPickerOptions {
	color?: Chroma.Color;
	onChange?: (selectedColor: Chroma.Color) => void;
}

export class BasicPicker {
	private _lch: number[] = _whiteToBlackInterpolator(0.4).lch();
	private _alpha: number = 1;
	private containerDivID: string;
	private colorBandDivID: string;
	private blackToWhiteBandDivID: string;
	private onChange: (selectedColor: Chroma.Color) => void;

	constructor(containerDivID: string, options?: BasicPickerOptions) {
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
			'	<div id="' + this.blackToWhiteBandDivID + '"></div>' +
			'</div>';

		_empty(this.containerDivID);
		_append(this.containerDivID, content);

		this.draw();
	}

	private setOptions(options: BasicPickerOptions) {
		// change private members, editing public members causes premature redraw
		if (options.color) {
			this._lch = options.color.lch();
			this._alpha = <any>(options.color.alpha());
		}
		// trigger event
		if (options.onChange)
			this.onChange = options.onChange;
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
		return Chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
	}

	get color(): Chroma.Color {
		var color = Chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
		color.alpha(this._alpha)
		return color;
	}
	set color(val: Chroma.Color) {
		this._lch = val.lch();
		this._alpha = <any>(val.alpha());
		this.draw();
	}

	draw() {
		// TODO: rather use canvas to draw blocks and add checkerbox to indicate transparency
		// TODO: add scaling based on container size rather than harcoded size

		var colorDiff = (col1: Chroma.Color, col2: Chroma.Color) => {
			// ignore alpha matching
			var rgb1 = col1.rgb();
			var rgb2 = col2.rgb();
			var rDiff = rgb1[0] - rgb2[0];
			var gDiff = rgb1[1] - rgb2[1];
			var bDiff = rgb1[2] - rgb2[2];
			return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
		}

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
				if (colorDiff(this.color, spectrum[i]) < 1)
					content += ' border: 2px solid black;';
				else
					content += ' border: 2px solid #E0E0E0;';
				content += '">';
				content += '	<div style="height: 24px; background-color:' + spectrum[i].css() + '"></div>';
				content += '</div>';
			}

			_empty(containerID);
			_append(containerID, content);

			// attach event handlers
			for (var i = 0; i < spectrum.length; i++) {
				const divID = containerID + '-' + i;
				const el = _id(divID);
				const newColor = spectrum[i];
				el.addEventListener('click', (ev: MouseEvent) => {
					this.lch = newColor.lch();
					if (this.onChange)
						this.onChange(this.color);
				});

				el.addEventListener('mouseenter', (ev: MouseEvent) => {
					if (colorDiff(this.color, newColor) >= 1)
						el.style.border = '2px solid gray';
				});
				el.addEventListener('mouseleave', (ev: MouseEvent) => {
					if (colorDiff(this.color, newColor) >= 1)
						el.style.border = '2px solid #E0E0E0';
				});
			}
		}

		var blackWhiteSpectrum = [];
		var step = 0.2
		for (var i = 0; i < 6; i++)
			blackWhiteSpectrum.push(_whiteToBlackInterpolator(i * step));

		genSpectrumContent(_lightSpectrum, this.colorBandDivID + '-0');
		genSpectrumContent(_darkSpectrum, this.colorBandDivID + '-1');
		genSpectrumContent(blackWhiteSpectrum, this.blackToWhiteBandDivID);
	}
}

////////////////////////////////////////////////////////////////////////////
// Palette Picker
////////////////////////////////////////////////////////////////////////////

export interface PaletteOptions {
	categoryCount?: number;
	onChange?: (selectedColors: Chroma.Color[]) => void;
}

export class Palette {
	private _categoryCount: number = 3;
	private _alpha: number = 1;

	// sequential palette ranges
	private blueRange = [Chroma.hex('#deebf7'), Chroma.hex('#08306b')];
	private orangeRange = [Chroma.hex('#fee6ce'), Chroma.hex('#7f2704')];
	private greenRange = [Chroma.hex('#e5f5e0'), Chroma.hex('#00441b')];
	private grayRange = [Chroma.hex('#d9d9d9'), Chroma.hex('#000000')];

	// divergent palette ranges
	//  brown-white-seagreen
	private brownWhiteRange = [Chroma.hex('#543005'), Chroma.hex('#f5f5f5')];
	private whiteSeagreenRange = [Chroma.hex('#f5f5f5'), Chroma.hex('#003c30')];
	//	red-yellow-purple
	private redYellowRange = [Chroma.hex('#a50026'), Chroma.hex('#ffffbf')];
	private yellowPurpleRange = [Chroma.hex('#ffffbf'), Chroma.hex('#313695')];

	// qualitative palette ranges
	private qualitativePaletteCount = 1;
	private brewerPairedRanges = [
		[Chroma.hex(Chroma.brewer.Paired[0]), Chroma.hex(Chroma.brewer.Paired[1])],
		[Chroma.hex(Chroma.brewer.Paired[2]), Chroma.hex(Chroma.brewer.Paired[3])],
		[Chroma.hex(Chroma.brewer.Paired[4]), Chroma.hex(Chroma.brewer.Paired[5])],
		[Chroma.hex(Chroma.brewer.Paired[6]), Chroma.hex(Chroma.brewer.Paired[7])],
		[Chroma.hex(Chroma.brewer.Paired[8]), Chroma.hex(Chroma.brewer.Paired[9])],
		[Chroma.hex(Chroma.brewer.Paired[10]), Chroma.hex(Chroma.brewer.Paired[11])]
	];

	private paletteCanvasDivID: string;
	private offset: { top: number; left: number };
	private margin: number = 10;
	private pad: number = 10;
	private h: number = 33;
	private w: number = 33;

	private hoverPalIdx: number = -1;
	private selectedPalIdx: number = 0;

	private isDraggingLightness: boolean = false;
	private onChange: (selectedColors: Chroma.Color[]) => void;

	constructor(public containerDivID: string, options?: PaletteOptions) {
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
		_empty(this.containerDivID);
		_append(this.containerDivID, content);

		// attach event handler
		const el = _id(this.paletteCanvasDivID);
		el.addEventListener('click', this.setPalette.bind(this));

		// attach hovering functionality
		el.addEventListener('mousemove', (ev) => {
			this.onHover(ev, 'gray');
		});
		el.addEventListener('mouseleave', (ev) => {
			this.onHover(ev, '#E0E0E0');
		});

		this.draw();
	}

	private onHover(ev: MouseEvent, hoverColor: string) {
		var hoverIdx = this.resolvePaletteIndex(ev.clientX, ev.clientY);
		if (this.hoverPalIdx === hoverIdx)
			return;
		this.hoverPalIdx = hoverIdx;
		var el = <HTMLCanvasElement>document.getElementById(this.paletteCanvasDivID);
		for (var k = 0; k < 7; k++) {
			if (this.selectedPalIdx !== k)
				this.drawPaletteBorder(k, el.getContext('2d'), '#E0E0E0');
		}	
		if (this.selectedPalIdx !== this.hoverPalIdx)	
			this.drawPaletteBorder(this.hoverPalIdx, el.getContext('2d'), hoverColor);
	}

	get alpha(): number {
		return this._alpha;
	}
	set alpha(val: number) {
		this._alpha = val;
		this.draw();
	}

	private generateScale(range: Chroma.Color[]): Chroma.Scale {
		return Chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
	}

	private get sequentialPalettes(): Chroma.Scale[] {

		var bluePalette = this.generateScale(this.blueRange);
		var orangePalette = this.generateScale(this.orangeRange);
		var greenPalette = this.generateScale(this.greenRange);
		var grayPalette = this.generateScale(this.grayRange);

		return [
			grayPalette,
			bluePalette,
			greenPalette,
			orangePalette
		];
	}

	private get divergentPalettes(): Chroma.Scale[][] {
		var scale = (range: Chroma.Color[]) => {
			return Chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
		}

		var brownWhiteSeagreenPalette1: Chroma.Scale = Chroma.scale([this.brownWhiteRange[0].hex(), this.brownWhiteRange[1].hex()]).correctLightness(true);
		var brownWhiteSeagreenPalette2: Chroma.Scale = Chroma.scale([this.whiteSeagreenRange[0].hex(), this.whiteSeagreenRange[1].hex()]).correctLightness(true);
		var redYellowPurplePalette1: Chroma.Scale = Chroma.scale([this.redYellowRange[0].hex(), this.redYellowRange[1].hex()]).correctLightness(true);
		var redYellowPurplePalette2: Chroma.Scale = Chroma.scale([this.yellowPurpleRange[0].hex(), this.yellowPurpleRange[1].hex()]).correctLightness(true);

		return [
			[this.generateScale(this.brownWhiteRange), this.generateScale(this.whiteSeagreenRange)],
			[this.generateScale(this.redYellowRange), this.generateScale(this.yellowPurpleRange)]
		];
	}

	private get brewerPairedScales(): Chroma.Scale[] {
		var brewerPairedScales = [];

		for (var i = 0; i < this.brewerPairedRanges.length; i++) {
			var scale = this.generateScale(this.brewerPairedRanges[i]);
			brewerPairedScales.push(scale);
		}

		return brewerPairedScales;
	}

	private resolvePaletteIndex(mousex: number, mousey: number): number {
		var x = mousex - this.offset.left;
		var y = mousey - this.offset.top;

		var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePaletteCount;
		var totWidth = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);

		return Math.floor(x / (totWidth / numPals));
	}

	private setPalette(ev: MouseEvent) {
		this.selectedPalIdx = this.resolvePaletteIndex(ev.clientX, ev.clientY);
		// trigger event
		if (this.onChange)
			this.onChange(this.palette);
		this.draw();
	}

	private setOptions(options: PaletteOptions) {
		if (options.categoryCount && options.categoryCount > 1) {
			this._categoryCount = options.categoryCount;
		}

		if (options.onChange)
			this.onChange = options.onChange;
	}

	get palette(): Chroma.Color[] {
		var result = [];
		var pal = this.paletteMatrix()[this.selectedPalIdx];
		for (var i = 0; i < pal.length; i++) {
			result.push(pal[i]);
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

	private paletteMatrix(): Chroma.Color[][] {
		var m = [];
		var numCats = this.categoryCount;

		// sequential palettes
		for (var i = 0; i < this.sequentialPalettes.length; i++) {
			var palArr: Chroma.Color[] = [];
			var pal = this.sequentialPalettes[i];
			for (var j = 0; j < numCats; j++) {
				var idx = j / (numCats - 1);
				palArr.push(pal(idx));
			}
			m.push(palArr);
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
			m.push(palArr);
		}

		// qualitative palettes (only paired brewer at the moment)
		var palArr: Chroma.Color[] = [];
		var interpolationsPerScale = 2; // default
		if (this.brewerPairedScales.length * 2 < numCats) {
			interpolationsPerScale = Math.ceil(numCats / this.brewerPairedScales.length);
		}

		for (var i = 0; i < this.brewerPairedScales.length && palArr.length < numCats; i++) {
			var pair = this.brewerPairedScales[i];
			for (var j = 0; j < interpolationsPerScale && palArr.length < numCats; j++) {
				palArr.push(pair(j / (interpolationsPerScale - 1)));
			}
		}
		m.push(palArr);

		return m;
	}

	private drawCheckerboxAndTransparencySlider(el: HTMLCanvasElement, context: CanvasRenderingContext2D, palMatrix: Chroma.Color[][]) {

		var b = 0;

		var imageData = context.createImageData(el.width, el.height);
		var pixels = imageData.data;
		var i = 0;
		for (var y = 0; y < el.height; y++) {
			for (var x = 0; x < el.width; x++, i += 4) {
				if (y < this.margin || y > (el.height - this.margin - b - 1)) continue;

				if (x < this.margin || x > (el.width - this.margin - 1)) continue;
				if ((x - this.margin) % (this.w + this.pad) >= this.w) continue;
				var horz = (Math.floor(x / 5) % 2 == 0);
				var vert = (Math.floor(y / 5) % 2 == 0);
				var val = (horz && !vert) || (!horz && vert) ? 250 : 200;
				pixels[i] = val;
				pixels[i + 1] = val;
				pixels[i + 2] = val;
				pixels[i + 3] = 255;
			}
		}

		var i = 0;
		for (var y = 0; y < el.height; y++) {
			for (var x = 0; x < el.width; x++, i += 4) {
				if (y < el.height - this.margin - 14) continue;
				if (y > el.height - this.margin - 1) continue;
				if (x < this.margin || x > (el.width - this.margin - 1)) continue;

				// background checkerbox
				var horz = (Math.floor(x / 5) % 2 == 0);
				var vert = (Math.floor(y / 5) % 2 == 0);
				var val = (horz && !vert) || (!horz && vert) ? 250 : 200;
				var b_r = val;
				var b_g = val;
				var b_b = val;

				// foreground alpha
				var rgb = palMatrix[this.selectedPalIdx][this.categoryCount - 1].rgb(); // pick last value in palette
				var f_a = 1 - (x - this.margin) / (el.width - 2 * this.margin);
				var f_r = rgb[0];
				var f_g = rgb[1];
				var f_b = rgb[2];

				// blend foreground and background
				pixels[i] = (f_r * f_a) + (b_r * (1 - f_a));
				pixels[i + 1] = (f_g * f_a) + (b_g * (1 - f_a));
				pixels[i + 2] = (f_b * f_a) + (b_b * (1 - f_a));
				pixels[i + 3] = 255;
			}
		}
		context.putImageData(imageData, 0, 0);
	}

	private drawPalettes(context: CanvasRenderingContext2D, palMatrix: Chroma.Color[][]) {
		context.globalAlpha = this.alpha;
		for (var i = 0; i < palMatrix.length; i++) {
			var palArr = palMatrix[i];
			for (var j = 0; j < palArr.length; j++) {
				context.fillStyle = palArr[j].css();
				context.fillRect(this.margin + i * (this.w + this.pad), this.margin + j * this.h, this.w, this.h);
			}
		}
	}

	private drawPaletteBorder(palIdx: number, context: CanvasRenderingContext2D, strokeStyle: any) {
		context.globalAlpha = 1;
		context.strokeStyle = strokeStyle;
		context.lineWidth = 1.5;
		context.strokeRect(this.margin - 2 + palIdx * (this.w + this.pad), this.margin - 2, this.w + 4, this.h * this.categoryCount + 4);
	}

	private drawTransparencySelection(context: CanvasRenderingContext2D) {

	}

	private drawLightnessSelection(context: CanvasRenderingContext2D) {

	}

	draw() {
		this.offset = _offset(this.paletteCanvasDivID);

		var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.paletteCanvasDivID);
		var context = el.getContext('2d');

		var numCats = this.categoryCount;
		var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePaletteCount;

		var b = 0;
		el.width = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);
		el.height = this.margin * 2 + this.h * numCats + b;

		var palMatrix = this.paletteMatrix();
		// this.drawCheckerboxAndTransparencySlider(el, context, palMatrix);
		this.drawPalettes(context, palMatrix);

		// draw selections
		this.drawPaletteBorder(this.selectedPalIdx, context, 'black');
		this.drawTransparencySelection(context);
		this.drawLightnessSelection(context);
	}
}

////////////////////////////////////////////////////////////////////////////
// Wheel Picker
////////////////////////////////////////////////////////////////////////////

export interface ColorWheelOptions {
	color?: Chroma.Color;
	onChange?: (selectedColor: Chroma.Color) => void;
}

export class ColorWheel {
	private _lch: number[] = _whiteToBlackInterpolator(0.4).lch();
	private _alpha: number = 1;
	private dirty: boolean = true;
	private containerDivID: string;
	private colorWheelDivID: string;
	private isDraggingLightness: boolean;
	private isDraggingColor: boolean;
	private isDraggingAlpha: boolean;

	private stopDraggingHandler: (ev: MouseEvent) => void;
	private mouseMoveHandler: (ev: MouseEvent) => void;
	private animationLoopHandlerRef: number;

	private imageDataCache: ImageData;

	private picked_x: number;
	private picked_y: number;

	private width: number = 298;
	private height: number = 298;
	private cx: number;
	private cy: number;
	private radius: number = 119;
	private offset: { top: number; left: number };
	private onChange: (selectedColor: Chroma.Color) => void;
	private onChangeTimeout: number;

	constructor(containerDivID: string, options?: ColorWheelOptions) {
		// defaults
		this.cx = this.width / 2;
		this.cy = this.height / 2;

		if (options)
			this.setOptions(options);

		// set div IDs
		this.containerDivID = containerDivID;
		this.colorWheelDivID = this.containerDivID + '-colorwheel';

		// add DOM structure 
		var content =
			'<div style="background-color: #E0E0E0; padding 5px">' +
			'	<canvas id="' + this.colorWheelDivID + '"></canvas>'
			'</div>';

		_empty(this.containerDivID);
		_append(this.containerDivID, content);

		const createCanvas = (divID: string): ImageData => {
			var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(divID);
			el.width = this.width;
			el.height = this.height;
			var context = el.getContext('2d');
			return context.createImageData(this.width, this.height)
		};
		this.imageDataCache = createCanvas(this.colorWheelDivID);

		this.addEventListeners();		
	}

	private addEventListeners() {
		var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.colorWheelDivID);

		this.stopDraggingHandler = this.setWheelDragStateOff.bind(this);
		this.mouseMoveHandler = (ev) => {
			this.setCursor(ev);
			this.setWheelColor(ev);
		}
		window.addEventListener('mouseup', this.stopDraggingHandler);
		window.addEventListener('mousemove', this.mouseMoveHandler);
		el.addEventListener('mousedown', (ev) => {
			this.setWheelDragStateOn(ev);
			this.setWheelColor(ev);
		});

		this.loop();
	}

	private removeEventListeners() {
		window.removeEventListener('mouseup', this.stopDraggingHandler);
		window.removeEventListener('mousemove', this.mouseMoveHandler);
		cancelAnimationFrame(this.animationLoopHandlerRef);
	}

	private setOptions(options: ColorWheelOptions) {
		// change private members, editing public members causes premature redraw
		if (options.color) {
			this._lch = options.color.lch();
			this._alpha = <any>(options.color.alpha());
		}

		if (options.onChange)
			this.onChange = options.onChange;
	}

	private setWheelDragStateOn(ev: MouseEvent) {
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
		if (y >= 30 && y <= this.height - 30 && x >= 0 && x <= 18) {
			this.isDraggingLightness = true;
		}

		// inside transparency slider
		if (y >= 30 && y <= this.height - 30 && x >= this.width - 19 && x <= this.width) {
			this.isDraggingAlpha = true;
		}
	}

	private setCursor(ev: MouseEvent) {
		// don't change cursor while dragging
		if (this.isDraggingAlpha || this.isDraggingColor || this.isDraggingLightness) return;

		var x = ev.pageX - this.offset.left;
		var y = ev.pageY - this.offset.top;

		// inside color wheel
		var rx = x - this.cx;
		var ry = y - this.cy;
		var d = Math.sqrt(rx * rx + ry * ry);
		var el = _id(this.colorWheelDivID);
		if (d < this.radius) {
			el.style.cursor = 'crosshair';
			return;
		}

		// inside lightness slider
		if (y >= 30 && y <= this.height - 30 && x >= 0 && x <= 18) {
			el.style.cursor = 's-resize';
			return;
		}

		// inside transparency slider
		if (y >= 30 && y <= this.height - 30 && x >= this.width - 19 && x <= this.width) {
			el.style.cursor = 's-resize';
			return;
		}

		el.style.cursor = 'default';
	}

	private setWheelColor(ev: MouseEvent) {
		if (!this.isDraggingAlpha && !this.isDraggingColor && !this.isDraggingLightness) return;

		var x = ev.pageX - this.offset.left;
		var y = ev.pageY - this.offset.top;

		// check if click is inside wheel
		if (this.isDraggingColor) {
			var rx = x - this.cx;
			var ry = y - this.cy;

			var d = Math.sqrt(rx * rx + ry * ry);
			this.picked_x = x;
			this.picked_y = y;

			if (d > this.radius) { // cursor is outside wheel, pick closest point inside wheel
				d = this.radius;
				var ry1 = this.radius * ry / Math.sqrt(rx * rx + ry * ry);
				var rx1 = this.radius * rx / Math.sqrt(rx * rx + ry * ry);
				this.picked_y = ry1 + this.cy;
				this.picked_x = rx1 + this.cx;
			}

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
		if (this.onChange) {
			clearTimeout(this.onChangeTimeout);
			setTimeout(() => {
				this.onChange(this.color);
			}, 100);
		}
	}

	private setWheelDragStateOff(ev: MouseEvent) {
		this.isDraggingAlpha = false;
		this.isDraggingColor = false;
		this.isDraggingLightness = false;
	}

	get lch(): number[] {
		return this._lch;
	}
	set lch(val: number[]) {
		if (isNaN(val[2])) val[2] = 0;

		// Constrain Chroma : 0 <= c < 360
		if (val[1] < 0) val[1] += 360;
		if (val[1] >= 360) val[1] -= 360;
		// Constrain Chroma : 0 <= h < 360
		if (val[2] < 0) val[2] += 360;
		if (val[2] >= 360) val[2] -= 360;

		if (this._lch[0] !== val[0] || this._lch[1] !== val[1] || this._lch[2] !== val[2])
			this.dirty = true;
		this._lch = val;
	}

	get hex(): string {
		return Chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
	}

	get alpha(): number {
		return this._alpha;
	}
	set alpha(val: number) {
		if (this._alpha !== val)
			this.dirty = true;
		this._alpha = val;
	}

	get color(): Chroma.Color {
		var color = Chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
		color.alpha(this._alpha);
		return color;
	}
	set color(val: Chroma.Color) {
		var newLch = val.lch();
		var newAlpha = <any>val.alpha();
		if ((this._lch[0] != newLch[0]) || (this._alpha != newAlpha))
			this.dirty = true;
		this._lch = newLch;
		this._alpha = newAlpha;
	}

	loop() {
  		this.draw();
  		this.animationLoopHandlerRef = window.requestAnimationFrame(this.loop.bind(this));
	}

	draw() {
		if (!this.dirty) return;
		
		this.offset = _offset(this.colorWheelDivID);

		var el: HTMLCanvasElement = <HTMLCanvasElement>_id(this.colorWheelDivID);
		var context = el.getContext('2d');
		var pixels = this.imageDataCache.data;

		var i = 0;
		// draw wheel
		var picked_dist = Number.MAX_VALUE;
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
					var rgb = _lch2rgb(this.lch[0], c, h);
					var dist = Math.sqrt(Math.pow(c - this.lch[1], 2) + Math.pow(h - this.lch[2], 2));
					if (dist < picked_dist) {
						picked_dist = dist;
						this.picked_x = x;
						this.picked_y = y;
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
				var rgb = _lch2rgb(l, this.lch[1], this.lch[2]);
				pixels[i] = rgb[0];
				pixels[i + 1] = rgb[1];
				pixels[i + 2] = rgb[2];
				pixels[i + 3] = 255;
			}
		}

		// draw transparency slider
		i = 0;
		var rgb = _lch2rgb(this.lch[0], this.lch[1], this.lch[2]);
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

		context.putImageData(this.imageDataCache, 0, 0);
		context.lineWidth = 1.5;
		if (this.lch[0] > 50)
			context.strokeStyle = '#2f2f2f'; // for dark selector on light background	
		else
			context.strokeStyle = '#dfdfdf'; // for light selector on dark background

		// draw circle around selected color in lightness slider
		context.beginPath();
		var lightnessY = 30 + (100 - this.lch[0]) / 100 * (this.height - 60);
		lightnessY = Math.max(35 + 2, Math.min(this.height - 30 - 6, lightnessY)); // limit position
		context.arc(9, lightnessY, 5, 0, 2 * Math.PI, false);
		context.stroke();

		// draw circle around selected color in wheel
		context.beginPath();
		if (this.alpha < 0.5)
			context.strokeStyle = '#2f2f2f';	
		context.arc(this.picked_x, this.picked_y, 6, 0, 2 * Math.PI, false);
		context.stroke();

		// draw circle around selected tranparency
		context.beginPath();
		var alphaY = Math.min(this.height - 35, 30 + (1 - this.alpha) * (this.height - 60));
		alphaY = Math.max(35 + 2, Math.min(this.height - 30 - 6, alphaY)); // limit position
		context.arc(this.width - 9, alphaY, 5, 0, 2 * Math.PI, false);
		context.stroke();
	}

	// clean up event listeners attached to window DOM element
	destroy() {
		this.removeEventListeners();
	}
}
