module picolor {

	export interface PaletteOptions {
		categoryCount?: number;
	}

	export class Palette {
		private _categoryCount: number;

		// sequential palette ranges
		private blueRange = [chroma.hex('#deebf7'), chroma.hex('#08306b')];
		private orangeRange = [chroma.hex('#fee6ce'), chroma.hex('#7f2704')];
		private greenRange = [chroma.hex('#e5f5e0'), chroma.hex('#00441b')];
		private grayRange = [chroma.hex('#d9d9d9'), chroma.hex('#000000')];

		// divergent palette ranges
		//  brown-white-seagreen
		private brownWhiteRange = [chroma.hex('#543005'), chroma.hex('#f5f5f5')];
		private whiteSeagreenRange = [chroma.hex('#f5f5f5'), chroma.hex('#003c30')];
		//	red-yellow-purple
		private redYellowRange = [chroma.hex('#a50026'), chroma.hex('#ffffbf')];
		private yellowPurpleRange = [chroma.hex('#ffffbf'), chroma.hex('#313695')];

		// qualitative palette ranges
		private qualitativePaletteCount = 1;
		private brewerPairedRanges = [
			[chroma.hex(chroma.brewer.Paired[0]), chroma.hex(chroma.brewer.Paired[1])],
			[chroma.hex(chroma.brewer.Paired[2]), chroma.hex(chroma.brewer.Paired[3])],
			[chroma.hex(chroma.brewer.Paired[4]), chroma.hex(chroma.brewer.Paired[5])],
			[chroma.hex(chroma.brewer.Paired[6]), chroma.hex(chroma.brewer.Paired[7])],
			[chroma.hex(chroma.brewer.Paired[8]), chroma.hex(chroma.brewer.Paired[9])],
			[chroma.hex(chroma.brewer.Paired[10]), chroma.hex(chroma.brewer.Paired[11])]
		];

		private paletteCanvasDivID;
		private offset: JQueryCoordinates;
		private margin: number = 10;
		private pad: number = 10;
		private h: number = 33;
		private w: number = 33;

		private selectedPalIdx: number = 0;

		private isDraggingLightness: boolean = false;

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
			var container = $('#' + this.containerDivID);
			container.empty();
			container.append(content);

			// attach event handler
			$('#' + this.paletteCanvasDivID).click(this.setPalette.bind(this));

		}

		private generateScale(range: Chroma.Color[]): Chroma.Scale {
			return chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
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
				return chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
			}

			var brownWhiteSeagreenPalette1: Chroma.Scale = chroma.scale([this.brownWhiteRange[0].hex(), this.brownWhiteRange[1].hex()]).correctLightness(true);
			var brownWhiteSeagreenPalette2: Chroma.Scale = chroma.scale([this.whiteSeagreenRange[0].hex(), this.whiteSeagreenRange[1].hex()]).correctLightness(true);
			var redYellowPurplePalette1: Chroma.Scale = chroma.scale([this.redYellowRange[0].hex(), this.redYellowRange[1].hex()]).correctLightness(true);
			var redYellowPurplePalette2: Chroma.Scale = chroma.scale([this.yellowPurpleRange[0].hex(), this.yellowPurpleRange[1].hex()]).correctLightness(true);

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

		private setPalette(ev) {
			var x = ev.pageX - this.offset.left;
			var y = ev.pageY - this.offset.top;

			var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePaletteCount;
			var totWidth = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);

			this.selectedPalIdx = Math.floor(x / (totWidth / numPals));
			$('#' + this.containerDivID).trigger('oncolorchange', [this.palette]);
			this.draw();
		}

		private setOptions(options: PaletteOptions) {
			if (options.categoryCount && options.categoryCount > 1) {
				this._categoryCount = options.categoryCount;
			}
		}

		get palette(): Chroma.Color[] {
			var result = [];
			var pal = this.paletteMatrix()[this.selectedPalIdx];
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

		private paletteMatrix(): Chroma.Color[][]{
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

		draw() {
			this.offset = $('#' + this.paletteCanvasDivID).offset();

			var el: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(this.paletteCanvasDivID);
			var context = el.getContext('2d');

			var numCats = this.categoryCount;
			var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePaletteCount;

			el.width = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);
			el.height = this.margin * 2 + this.h * numCats;

			var palMatrix = this.paletteMatrix();

			// draw items from matrix
			for (var i = 0; i < palMatrix.length; i++) {
				var palArr = palMatrix[i];
				for (var j = 0; j < palArr.length; j++) {
					context.fillStyle = palArr[j].hex();
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
