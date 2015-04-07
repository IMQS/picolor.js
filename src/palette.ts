module picolor {

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
