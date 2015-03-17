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
			this._showColorWheel = false;			// default = hide color wheel

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
				'		<div id="' + this.colorWheelDivID + '"></div>' +
				'	</div>' +
				'</div>';

			var container = $('#' + this.containerDivID);
			container.empty();
			container.append(content);
		}

		private drawBasicSelector() {
			var lightContent = '';
			for (var i = 0; i < picolor.lightSpectrum.length; i++) {
				var divID = this.colorBandDivID + '-0-' + i;
				lightContent += '<div id="' + divID + '" class="picolor-box';
				if (this.color.css() === picolor.lightSpectrum[i].css())
					lightContent += ' picolor-box-selected';
				lightContent += '" style="background-color:' + picolor.lightSpectrum[i].css() + '"></div>';

				$('#' + this.containerDivID).on('click', '#' + divID, picolor.lightSpectrum[i], (ev) => { this.color = ev.data });
			}

			var darkContent = '';
			for (var i = 0; i < picolor.darkSpectrum.length; i++) {
				var divID = this.colorBandDivID + '-1-' + i;
				darkContent += '<div id="' + divID + '" class="picolor-box';
				if (this.color.css() === picolor.darkSpectrum[i].css())
					darkContent += ' picolor-box-selected';
				darkContent += '" style="background-color:' + picolor.darkSpectrum[i].css() + '"></div>';
				$('#' + this.containerDivID).on('click', '#' + divID, picolor.darkSpectrum[i], (ev) => { this.color = ev.data });
			}

			var blackWhiteContent = '';
			var step = 0.2
			for (var i = 0; i < 6; i++) {
				var interpolatedColor = picolor.whiteToBlackInterpolator(i * step).css();
				var divID = this.blackToWhiteBandDivID + '-' + i;
				blackWhiteContent += '<div id="' + divID + '" class="picolor-box';
				if (this.color.css() === interpolatedColor)
					blackWhiteContent += ' picolor-box-selected';
				blackWhiteContent += '" style="background-color:' + interpolatedColor + '"></div>';
				$('#' + this.containerDivID).on('click', '#' + divID, picolor.whiteToBlackInterpolator(i * step), (ev) => { this.color = ev.data });
			}

			$('#' + this.colorBandDivID + '-0').append(lightContent);
			$('#' + this.colorBandDivID + '-1').append(darkContent);
			$('#' + this.blackToWhiteBandDivID).append(blackWhiteContent);
		}

		private drawColorWheel() {
			// TODO
		}
	}

	export interface PaletteOptions {
	}

	export class Palette {
		constructor(public containerDivID: string) {
		}
	}
}
