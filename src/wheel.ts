module picolor {

	export interface ColorWheelOptions {
		color?: Chroma.Color;
	}

	export class ColorWheel {
		private _lch: number[] = picolor.whiteToBlackInterpolator(0.4).lch();
		private _alpha: number = 1;
		private containerDivID: string;
		private colorWheelDivID: string;
		private isDraggingLightness: boolean;
		private isDraggingColor: boolean;
		private isDraggingAlpha: boolean;

		private imageDataCache: ImageData;

		private picked_x: number;
		private picked_y: number;

		private width: number = 298;
		private height: number = 298;
		private cx: number;
		private cy: number;
		private radius: number = 119;
		private offset: JQueryCoordinates;

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
				'	<canvas id="' + this.colorWheelDivID + '"></canvas>' +
				'</div>';

			var container = $('#' + this.containerDivID);
			container.empty();
			container.append(content);

			var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.colorWheelDivID);
			el.width = this.width;
			el.height = this.height;
			var context = el.getContext('2d');
			this.imageDataCache = context.createImageData(this.width, this.height);

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
			if (y >= 30 && y <= this.height - 30 && x >= 0 && x <= 18) {
				this.isDraggingLightness = true;
			}

			// inside transparency slider
			if (y >= 30 && y <= this.height - 30 && x >= this.width - 19 && x <= this.width) {
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
			if (y >= 30 && y <= this.height - 30 && x >= 0 && x <= 18) {
				$('#' + this.colorWheelDivID).css('cursor', 's-resize');
				return;
			}

			// inside transparency slider
			if (y >= 30 && y <= this.height - 30 && x >= this.width - 19 && x <= this.width) {
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

			var recalcImageData = this._lch[0] != val[0];
			this._lch = val;

			this.draw(recalcImageData);
		}

		get hex(): string {
			return chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
		}

		get alpha(): number {
			return this._alpha;
		}
		set alpha(val: number) {
			this._alpha = val;
			this.draw(true);
		}

		get color(): Chroma.Color {
			var color = chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
			color.alpha(this._alpha);
			return color;
		}
		set color(val: Chroma.Color) {
			var newLch = val.lch();
			var newAlpha = val.alpha();
			var recalcImageData = (this._lch[0] != newLch[0]) || (this._alpha != newAlpha);
			this._lch = newLch;
			this._alpha = newAlpha;
			this.draw(recalcImageData);
		}

		draw(recalcImageData: boolean = true) {
			// TODO: add scaling based on container size rather than hardcoded size

			this.offset = $('#' + this.colorWheelDivID).offset();

			var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.colorWheelDivID);
			var context = el.getContext('2d');

			var picked_dist = Number.MAX_VALUE;



			var pixels = this.imageDataCache.data;

			if (recalcImageData) {
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


			context.putImageData(this.imageDataCache, 0, 0);

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
			context.arc(this.picked_x, this.picked_y, 6, 0, 2 * Math.PI, false);
			context.stroke();

			// draw rectangle around selected tranparency
			context.beginPath();
			var alphaY = Math.min(this.height - 35, 30 + (1 - this.alpha) * (this.height - 60));
			alphaY = Math.max(35 + 2, Math.min(this.height - 30 - 6, alphaY)); // limit position
			context.arc(this.width - 9, alphaY, 5, 0, 2 * Math.PI, false);
			context.stroke();
		}
	}
}
