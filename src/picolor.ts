module picolor {

	export interface SingleColorOptions {
		color?: Chroma.Color;
		showBasicSelctor?: boolean;
		showColorWheel?: boolean;
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
	export var whiteToBlackInterpolator = chroma.interpolate.bezier(['white', 'black']);

	export class SingleColor {
		private _color: Chroma.Color;
		private _showBasicSelector: boolean;
		private _showColorWheel: boolean;
		private containerDivID: string;
		private colorBandDivID: string;
		private blackToWhiteBandDivID: string;
		private colorWheelDivID: string;

		constructor(containerDivID: string, options?: SingleColorOptions) {
			// set defaults
			this._color = chroma.hex('#ffffff');	// default = white
			this._showBasicSelector = true;			// default = show basic selector
			this._showColorWheel = true;			// default = hide color wheel

			if (options)
				this.setOptions(options);

			// set div IDs
			this.containerDivID = containerDivID;
			this.colorBandDivID = this.containerDivID + '-colorband';
			this.blackToWhiteBandDivID = this.containerDivID + '-blacktowhiteband';
			this.colorWheelDivID = this.containerDivID + '-colorwheel';
		}

		private setOptions(options: SingleColorOptions) {
			// change private members, editing public members causes premature redraw
			if (options.color)
				this._color = options.color;
			this._showColorWheel = !!options.showColorWheel;
			this._showBasicSelector = !!options.showColorWheel;
		}

		get color(): Chroma.Color {
			return this._color;
		}
		set color(val: Chroma.Color) {
			this._color = val;
			this.draw(); // redraw control if other color is selected via UI or programatically
		}

		get showColorWheel(): boolean {
			return this._showColorWheel;
		}
		set showColorWheel(val: boolean) {
			this._showColorWheel = val;
			this.draw();
		}

		get showBasicSelector(): boolean {
			return this._showBasicSelector;
		}
		set showBasicSelector(val: boolean) {
			this._showBasicSelector = val;
			this.draw();
		}

		draw() {
			this.drawContainerStructure();
			$('#' + this.containerDivID).off('click'); // Remove all old click handlers - if you don't do this it destroys performance
			if (this.showBasicSelector)
				this.drawBasicSelector();
			if (this.showColorWheel)
				this.drawColorWheel();
		}

		private drawContainerStructure() {
			var content =
				'<div class="picolor-container">' +
				'	<div class="picolor-top-container">' +
				'		<div id="' + this.colorBandDivID + '-0' + '"></div>' +
				'		<div id="' + this.colorBandDivID + '-1' + '"></div>' +
				'		<div id="' + this.blackToWhiteBandDivID + '" style="margin-top: 6px"></div>' +
				'	</div>' +
				'	<div class="picolor-bottom-container">' +
				'		<canvas id="' + this.colorWheelDivID + '" class="picolor-wheel"></canvas>' +
				'	</div>' +
				'</div>';

			var container = $('#' + this.containerDivID);
			container.empty();
			container.append(content);
		}

		private drawBasicSelector() {
			var genSpectrumContent = (spectrum: Chroma.Color[], containerID: string) => {
				var content = '';
				for (var i = 0; i < spectrum.length; i++) {
					var divID = containerID + '-' + i;
					content += '<div id="' + divID + '" class="picolor-box-container';
					if (this.color.css() === spectrum[i].css())
						content += ' picolor-box-container-selected';
					content += '">';
					content += '	<div class="picolor-box" style="background-color:' + spectrum[i].css() + '"></div>';
					content += '</div>';

					$('#' + this.containerDivID).on('click', '#' + divID, spectrum[i], (ev) => { this.color = ev.data });
				}
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

		private drawColorWheel() {
			var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.colorWheelDivID),
				context = el.getContext('2d'),
				width = 298,
				height = 298,
				cx = width / 2,
				cy = height / 2,
				radius = 120,
				imageData,
				pixels,
				hue, sat, value,
				l = 100, c, h, lch: Chroma.Color,
				i = 0,
				x, y, rx, ry, d,
				f, g, p, u, v, w, rgb;

			el.width = width;
			el.height = height;

			context.fillStyle = '#E0E0E0';
			context.fillRect(0, 0, width, height);

			imageData = context.createImageData(width, height);
			pixels = imageData.data;

			for (y = 0; y < height; y++) {
				for (x = 0; x < width; x++, i += 4) {
					rx = x - cx;
					ry = y - cy;
					d = rx * rx + ry * ry;
					if (d < radius * radius) {
						h = Math.atan2(ry, rx) * 180 / Math.PI;
						if (h < 0) h += 360;
						if (h > 360) h -= 360;
						c = 100 * Math.sqrt(d) / radius;

						lch = chroma.lch(l, c, h);
						rgb = lch.rgb();

						pixels[i] = rgb[0];
						pixels[i + 1] = rgb[1];
						pixels[i + 2] = rgb[2];
						pixels[i + 3] = 255;
					}
				}
			}

			context.putImageData(imageData, 0, 0);
		}
	}

	export interface PaletteOptions {
	}

	export class Palette {
		constructor(public containerDivID: string) {
		}
	}
}
