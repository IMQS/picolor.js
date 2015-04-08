module picolor {

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

			var colorDiff = (col1: Chroma.Color, col2: Chroma.Color) => {
				// ignore alpha matching
				var rgb1 = col1.rgb();
				var rgb2 = col2.rgb();
				var rDiff = rgb1[0] - rgb2[0];
				var gDiff = rgb1[1] - rgb2[1];
				var bDiff = rgb1[2] - rgb2[2];
				return Math.sqrt(rDiff*rDiff + gDiff*gDiff + bDiff*bDiff);
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
}
