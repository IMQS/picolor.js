var picolor;
(function (picolor) {
    picolor.lightSpectrum = [
        chroma.hex(chroma.brewer.Paired[0]),
        chroma.hex(chroma.brewer.Paired[2]),
        chroma.hex(chroma.brewer.Paired[10]),
        chroma.hex(chroma.brewer.Paired[6]),
        chroma.hex(chroma.brewer.Paired[4]),
        chroma.hex(chroma.brewer.Paired[8])
    ];
    picolor.darkSpectrum = [
        chroma.hex(chroma.brewer.Paired[1]),
        chroma.hex(chroma.brewer.Paired[3]),
        chroma.hex(chroma.brewer.Paired[11]),
        chroma.hex(chroma.brewer.Paired[7]),
        chroma.hex(chroma.brewer.Paired[5]),
        chroma.hex(chroma.brewer.Paired[9])
    ];
    picolor.whiteToBlackInterpolator = chroma.scale(['white', 'black']).correctLightness(true);

    var BasicPicker = (function () {
        function BasicPicker(containerDivID, options) {
            this._lch = picolor.whiteToBlackInterpolator(0.4).lch();
            this._alpha = 1;
            if (options)
                this.setOptions(options);

            this.containerDivID = containerDivID;
            this.colorBandDivID = this.containerDivID + '-colorband';
            this.blackToWhiteBandDivID = this.containerDivID + '-blacktowhiteband';

            var content = '<div>' + '	<div id="' + this.colorBandDivID + '-0' + '"></div>' + '	<div id="' + this.colorBandDivID + '-1' + '"></div>' + '	<div id="' + this.blackToWhiteBandDivID + '" style="margin-top: 6px"></div>' + '</div>';

            var container = $('#' + this.containerDivID);
            container.empty();
            container.append(content);
        }
        BasicPicker.prototype.setOptions = function (options) {
            if (options.color) {
                this._lch = options.color.lch();
                this._alpha = options.color.alpha();
            }
        };

        Object.defineProperty(BasicPicker.prototype, "lch", {
            get: function () {
                return this._lch;
            },
            set: function (val) {
                if (val[2] < 0)
                    val[2] += 360;
                if (val[2] >= 360)
                    val[2] -= 360;
                this._lch = val;

                this.draw();
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(BasicPicker.prototype, "hex", {
            get: function () {
                return chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(BasicPicker.prototype, "color", {
            get: function () {
                var color = chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
                color.alpha(this._alpha);
                return color;
            },
            set: function (val) {
                this._lch = val.lch();
                this._alpha = val.alpha();
                this.draw();
            },
            enumerable: true,
            configurable: true
        });

        BasicPicker.prototype.draw = function () {
            var _this = this;
            $('#' + this.containerDivID).off('click');

            var colorDiff = function (col1, col2) {
                var rgb1 = col1.rgb();
                var rgb2 = col2.rgb();
                var rDiff = rgb1[0] - rgb2[0];
                var gDiff = rgb1[1] - rgb2[1];
                var bDiff = rgb1[2] - rgb2[2];
                return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
            };

            var genSpectrumContent = function (spectrum, containerID) {
                var content = '';
                for (var i = 0; i < spectrum.length; i++) {
                    var divID = containerID + '-' + i;
                    content += '<div id="' + divID + '" style="width: 38px;' + 'height: 24px;' + 'cursor: pointer;' + 'display: inline-block;' + 'padding: 1px;' + 'background-color: #E0E0E0;' + 'margin: 0px 4px 0px 4px;';
                    if (colorDiff(_this.color, spectrum[i]) < 1)
                        content += ' border: 2px solid black;';
                    else
                        content += ' border: 2px solid #E0E0E0;';
                    content += '">';
                    content += '	<div style="height: 24px; background-color:' + spectrum[i].css() + '"></div>';
                    content += '</div>';

                    $('#' + _this.containerDivID).on('click', '#' + divID, spectrum[i], function (ev) {
                        _this.lch = ev.data.lch();
                        $('#' + _this.containerDivID).trigger('oncolorchange', [_this.color]);
                    });
                }
                $('#' + containerID).empty();
                $('#' + containerID).append(content);
            };

            var blackWhiteSpectrum = [];
            var step = 0.2;
            for (var i = 0; i < 6; i++)
                blackWhiteSpectrum.push(picolor.whiteToBlackInterpolator(i * step));

            genSpectrumContent(picolor.lightSpectrum, this.colorBandDivID + '-0');
            genSpectrumContent(picolor.darkSpectrum, this.colorBandDivID + '-1');
            genSpectrumContent(blackWhiteSpectrum, this.blackToWhiteBandDivID);
        };
        return BasicPicker;
    })();
    picolor.BasicPicker = BasicPicker;
})(picolor || (picolor = {}));
var picolor;
(function (picolor) {
    var Palette = (function () {
        function Palette(containerDivID, options) {
            this.containerDivID = containerDivID;
            this._categoryCount = 3;
            this._alpha = 1;
            this.blueRange = [chroma.hex('#deebf7'), chroma.hex('#08306b')];
            this.orangeRange = [chroma.hex('#fee6ce'), chroma.hex('#7f2704')];
            this.greenRange = [chroma.hex('#e5f5e0'), chroma.hex('#00441b')];
            this.grayRange = [chroma.hex('#d9d9d9'), chroma.hex('#000000')];
            this.brownWhiteRange = [chroma.hex('#543005'), chroma.hex('#f5f5f5')];
            this.whiteSeagreenRange = [chroma.hex('#f5f5f5'), chroma.hex('#003c30')];
            this.redYellowRange = [chroma.hex('#a50026'), chroma.hex('#ffffbf')];
            this.yellowPurpleRange = [chroma.hex('#ffffbf'), chroma.hex('#313695')];
            this.qualitativePaletteCount = 1;
            this.brewerPairedRanges = [
                [chroma.hex(chroma.brewer.Paired[0]), chroma.hex(chroma.brewer.Paired[1])],
                [chroma.hex(chroma.brewer.Paired[2]), chroma.hex(chroma.brewer.Paired[3])],
                [chroma.hex(chroma.brewer.Paired[4]), chroma.hex(chroma.brewer.Paired[5])],
                [chroma.hex(chroma.brewer.Paired[6]), chroma.hex(chroma.brewer.Paired[7])],
                [chroma.hex(chroma.brewer.Paired[8]), chroma.hex(chroma.brewer.Paired[9])],
                [chroma.hex(chroma.brewer.Paired[10]), chroma.hex(chroma.brewer.Paired[11])]
            ];
            this.margin = 10;
            this.pad = 10;
            this.h = 33;
            this.w = 33;
            this.selectedPalIdx = 0;
            this.isDraggingLightness = false;
            this.containerDivID = containerDivID;
            this.paletteCanvasDivID = this.containerDivID + '-canvas';

            if (options)
                this.setOptions(options);

            var content = '<div style="background-color: #E0E0E0; padding 5px; cursor: pointer;">' + '	<canvas id="' + this.paletteCanvasDivID + '"></canvas>' + '</div>';
            var container = $('#' + this.containerDivID);
            container.empty();
            container.append(content);

            $('#' + this.paletteCanvasDivID).click(this.setPalette.bind(this));
        }
        Object.defineProperty(Palette.prototype, "alpha", {
            get: function () {
                return this._alpha;
            },
            set: function (val) {
                this._alpha = val;
                this.draw();
            },
            enumerable: true,
            configurable: true
        });

        Palette.prototype.generateScale = function (range) {
            return chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
        };

        Object.defineProperty(Palette.prototype, "sequentialPalettes", {
            get: function () {
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
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Palette.prototype, "divergentPalettes", {
            get: function () {
                var scale = function (range) {
                    return chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
                };

                var brownWhiteSeagreenPalette1 = chroma.scale([this.brownWhiteRange[0].hex(), this.brownWhiteRange[1].hex()]).correctLightness(true);
                var brownWhiteSeagreenPalette2 = chroma.scale([this.whiteSeagreenRange[0].hex(), this.whiteSeagreenRange[1].hex()]).correctLightness(true);
                var redYellowPurplePalette1 = chroma.scale([this.redYellowRange[0].hex(), this.redYellowRange[1].hex()]).correctLightness(true);
                var redYellowPurplePalette2 = chroma.scale([this.yellowPurpleRange[0].hex(), this.yellowPurpleRange[1].hex()]).correctLightness(true);

                return [
                    [this.generateScale(this.brownWhiteRange), this.generateScale(this.whiteSeagreenRange)],
                    [this.generateScale(this.redYellowRange), this.generateScale(this.yellowPurpleRange)]
                ];
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Palette.prototype, "brewerPairedScales", {
            get: function () {
                var brewerPairedScales = [];

                for (var i = 0; i < this.brewerPairedRanges.length; i++) {
                    var scale = this.generateScale(this.brewerPairedRanges[i]);
                    brewerPairedScales.push(scale);
                }

                return brewerPairedScales;
            },
            enumerable: true,
            configurable: true
        });

        Palette.prototype.setPalette = function (ev) {
            var x = ev.pageX - this.offset.left;
            var y = ev.pageY - this.offset.top;

            var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePaletteCount;
            var totWidth = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);

            this.selectedPalIdx = Math.floor(x / (totWidth / numPals));
            $('#' + this.containerDivID).trigger('oncolorchange', [this.palette]);
            this.draw();
        };

        Palette.prototype.setOptions = function (options) {
            if (options.categoryCount && options.categoryCount > 1) {
                this._categoryCount = options.categoryCount;
            }
        };

        Object.defineProperty(Palette.prototype, "palette", {
            get: function () {
                var result = [];
                var pal = this.paletteMatrix()[this.selectedPalIdx];
                for (var i = 0; i < pal.length; i++) {
                    result.push(pal[i]);
                }
                return result;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Palette.prototype, "categoryCount", {
            get: function () {
                return this._categoryCount;
            },
            set: function (val) {
                this._categoryCount = val;
                this.draw();
            },
            enumerable: true,
            configurable: true
        });

        Palette.prototype.paletteMatrix = function () {
            var m = [];
            var numCats = this.categoryCount;

            for (var i = 0; i < this.sequentialPalettes.length; i++) {
                var palArr = [];
                var pal = this.sequentialPalettes[i];
                for (var j = 0; j < numCats; j++) {
                    var idx = j / (numCats - 1);
                    palArr.push(pal(idx));
                }
                m.push(palArr);
            }

            for (var i = 0; i < this.divergentPalettes.length; i++) {
                var palArr = [];
                var pal1 = this.divergentPalettes[i][0];
                var pal2 = this.divergentPalettes[i][1];
                for (var j = 0; j < numCats; j++) {
                    var idx = j / (numCats - 1);
                    var col = (idx <= 0.5) ? pal1(idx * 2) : pal2((idx - 0.5) * 2);
                    palArr.push(col);
                }
                m.push(palArr);
            }

            var palArr = [];
            var interpolationsPerScale = 2;
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
        };

        Palette.prototype.drawCheckerboxAndTransparencySlider = function (el, context, palMatrix) {
            var b = 0;

            var imageData = context.createImageData(el.width, el.height);
            var pixels = imageData.data;
            var i = 0;
            for (var y = 0; y < el.height; y++) {
                for (var x = 0; x < el.width; x++, i += 4) {
                    if (y < this.margin || y > (el.height - this.margin - b - 1))
                        continue;

                    if (x < this.margin || x > (el.width - this.margin - 1))
                        continue;
                    if ((x - this.margin) % (this.w + this.pad) >= this.w)
                        continue;
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
                    if (y < el.height - this.margin - 14)
                        continue;
                    if (y > el.height - this.margin - 1)
                        continue;
                    if (x < this.margin || x > (el.width - this.margin - 1))
                        continue;

                    var horz = (Math.floor(x / 5) % 2 == 0);
                    var vert = (Math.floor(y / 5) % 2 == 0);
                    var val = (horz && !vert) || (!horz && vert) ? 250 : 200;
                    var b_r = val;
                    var b_g = val;
                    var b_b = val;

                    var rgb = palMatrix[this.selectedPalIdx][this.categoryCount - 1].rgb();
                    var f_a = 1 - (x - this.margin) / (el.width - 2 * this.margin);
                    var f_r = rgb[0];
                    var f_g = rgb[1];
                    var f_b = rgb[2];

                    pixels[i] = (f_r * f_a) + (b_r * (1 - f_a));
                    pixels[i + 1] = (f_g * f_a) + (b_g * (1 - f_a));
                    pixels[i + 2] = (f_b * f_a) + (b_b * (1 - f_a));
                    pixels[i + 3] = 255;
                }
            }
            context.putImageData(imageData, 0, 0);
        };

        Palette.prototype.drawPalettes = function (context, palMatrix) {
            context.globalAlpha = this.alpha;
            for (var i = 0; i < palMatrix.length; i++) {
                var palArr = palMatrix[i];
                for (var j = 0; j < palArr.length; j++) {
                    context.fillStyle = palArr[j].css();
                    context.fillRect(this.margin + i * (this.w + this.pad), this.margin + j * this.h, this.w, this.h);
                }
            }
        };

        Palette.prototype.drawPaletteSelection = function (context) {
            context.globalAlpha = 1;
            context.strokeStyle = 'black';
            context.lineWidth = 1.5;
            context.strokeRect(this.margin - 2 + this.selectedPalIdx * (this.w + this.pad), this.margin - 2, this.w + 4, this.h * this.categoryCount + 4);
        };

        Palette.prototype.drawTransparencySelection = function (context) {
        };

        Palette.prototype.drawLightnessSelection = function (context) {
        };

        Palette.prototype.draw = function () {
            this.offset = $('#' + this.paletteCanvasDivID).offset();

            var el = document.getElementById(this.paletteCanvasDivID);
            var context = el.getContext('2d');

            var numCats = this.categoryCount;
            var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePaletteCount;

            var b = 0;
            el.width = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);
            el.height = this.margin * 2 + this.h * numCats + b;

            var palMatrix = this.paletteMatrix();

            this.drawPalettes(context, palMatrix);

            this.drawPaletteSelection(context);
            this.drawTransparencySelection(context);
            this.drawLightnessSelection(context);
        };
        return Palette;
    })();
    picolor.Palette = Palette;
})(picolor || (picolor = {}));
var picolor;
(function (picolor) {
    function lch2rgb(l, c, h) {
        var lab_xyz = function (x) {
            if (x > 0.206893034) {
                return x * x * x;
            } else {
                return (x - 4 / 29) / 7.787037;
            }
        };

        var xyz_rgb = function (r) {
            return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
        };

        var rgbCap = function (x) {
            return Math.max(0, Math.min(255, x));
        };

        var rgb = new Uint8Array(3);

        var h1 = h * Math.PI / 180;
        var a = Math.cos(h1) * c;
        var b = Math.sin(h1) * c;

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
    picolor.lch2rgb = lch2rgb;

    var ColorWheel = (function () {
        function ColorWheel(containerDivID, options) {
            var _this = this;
            this._lch = picolor.whiteToBlackInterpolator(0.4).lch();
            this._alpha = 1;
            this.width = 298;
            this.height = 298;
            this.radius = 119;
            this.cx = this.width / 2;
            this.cy = this.height / 2;

            if (options)
                this.setOptions(options);

            this.containerDivID = containerDivID;
            this.colorWheelDivID = this.containerDivID + '-colorwheel';

            var content = '<div style="background-color: #E0E0E0; padding 5px">' + '	<canvas id="' + this.colorWheelDivID + '"></canvas>' + '</div>';

            var container = $('#' + this.containerDivID);
            container.empty();
            container.append(content);

            var el = document.getElementById(this.colorWheelDivID);
            el.width = this.width;
            el.height = this.height;
            var context = el.getContext('2d');
            this.imageDataCache = context.createImageData(this.width, this.height);

            $('#' + this.colorWheelDivID).mouseleave(this.setWheelDragStateOff.bind(this));
            $('#' + this.colorWheelDivID).mouseup(this.setWheelDragStateOff.bind(this));
            $('#' + this.colorWheelDivID).mousedown(function (ev) {
                _this.setWheelDragStateOn(ev);
                _this.setWheelColor(ev);
            });
            $('#' + this.colorWheelDivID).mousemove(function (ev) {
                _this.setCursor(ev);
                _this.setWheelColor(ev);
            });
        }
        ColorWheel.prototype.setOptions = function (options) {
            if (options.color) {
                this._lch = options.color.lch();
                this._alpha = options.color.alpha();
            }
        };

        ColorWheel.prototype.setWheelDragStateOn = function (ev) {
            var x = ev.pageX - this.offset.left;
            var y = ev.pageY - this.offset.top;

            var rx = x - this.cx;
            var ry = y - this.cy;
            var d = Math.sqrt(rx * rx + ry * ry);
            if (d < this.radius) {
                this.isDraggingColor = true;
            }

            if (y >= 30 && y <= this.height - 30 && x >= 0 && x <= 18) {
                this.isDraggingLightness = true;
            }

            if (y >= 30 && y <= this.height - 30 && x >= this.width - 19 && x <= this.width) {
                this.isDraggingAlpha = true;
            }
        };

        ColorWheel.prototype.setCursor = function (ev) {
            if (this.isDraggingAlpha || this.isDraggingColor || this.isDraggingLightness)
                return;

            var x = ev.pageX - this.offset.left;
            var y = ev.pageY - this.offset.top;

            var rx = x - this.cx;
            var ry = y - this.cy;
            var d = Math.sqrt(rx * rx + ry * ry);
            if (d < this.radius) {
                $('#' + this.colorWheelDivID).css('cursor', 'crosshair');
                return;
            }

            if (y >= 30 && y <= this.height - 30 && x >= 0 && x <= 18) {
                $('#' + this.colorWheelDivID).css('cursor', 's-resize');
                return;
            }

            if (y >= 30 && y <= this.height - 30 && x >= this.width - 19 && x <= this.width) {
                $('#' + this.colorWheelDivID).css('cursor', 's-resize');
                return;
            }

            $('#' + this.colorWheelDivID).css('cursor', 'default');
        };

        ColorWheel.prototype.setWheelColor = function (ev) {
            if (!this.isDraggingAlpha && !this.isDraggingColor && !this.isDraggingLightness)
                return;

            var x = ev.pageX - this.offset.left;
            var y = ev.pageY - this.offset.top;

            if (this.isDraggingColor) {
                var rx = x - this.cx;
                var ry = y - this.cy;

                var d = Math.sqrt(rx * rx + ry * ry);
                this.picked_x = x;
                this.picked_y = y;

                if (d > this.radius) {
                    d = this.radius;
                    var ry1 = this.radius * ry / Math.sqrt(rx * rx + ry * ry);
                    var rx1 = this.radius * rx / Math.sqrt(rx * rx + ry * ry);
                    this.picked_y = ry1 + this.cy;
                    this.picked_x = rx1 + this.cx;
                }

                var h = Math.atan2(ry, rx) * 180 / Math.PI;
                var c = 100 * d / this.radius;
                this.lch = [this.lch[0], c, h];
            }

            if (this.isDraggingLightness) {
                var l = Math.max(0, Math.min(100, 100 - (y - 30) / (this.height - 60) * 100));
                this.lch = [l, this.lch[1], this.lch[2]];
            }

            if (this.isDraggingAlpha) {
                this.alpha = Math.max(0, Math.min(1, 1 - (y - 30) / (this.height - 60)));
            }

            $('#' + this.containerDivID).trigger('oncolorchange', [this.color]);
        };

        ColorWheel.prototype.setWheelDragStateOff = function (ev) {
            this.isDraggingAlpha = false;
            this.isDraggingColor = false;
            this.isDraggingLightness = false;
        };

        Object.defineProperty(ColorWheel.prototype, "lch", {
            get: function () {
                return this._lch;
            },
            set: function (val) {
                if (val[2] < 0)
                    val[2] += 360;
                if (val[2] >= 360)
                    val[2] -= 360;

                var recalcImageData = this._lch[0] != val[0];
                this._lch = val;

                this.draw(recalcImageData);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ColorWheel.prototype, "hex", {
            get: function () {
                return chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ColorWheel.prototype, "alpha", {
            get: function () {
                return this._alpha;
            },
            set: function (val) {
                this._alpha = val;
                this.draw(true);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(ColorWheel.prototype, "color", {
            get: function () {
                var color = chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
                color.alpha(this._alpha);
                return color;
            },
            set: function (val) {
                var newLch = val.lch();
                var newAlpha = val.alpha();
                var recalcImageData = (this._lch[0] != newLch[0]) || (this._alpha != newAlpha);
                this._lch = newLch;
                this._alpha = newAlpha;
                this.draw(recalcImageData);
            },
            enumerable: true,
            configurable: true
        });

        ColorWheel.prototype.draw = function (recalcImageData) {
            if (typeof recalcImageData === "undefined") { recalcImageData = true; }
            this.offset = $('#' + this.colorWheelDivID).offset();

            var el = document.getElementById(this.colorWheelDivID);
            var context = el.getContext('2d');

            var pixels = this.imageDataCache.data;

            var i = 0;
            if (recalcImageData) {
                var picked_dist = Number.MAX_VALUE;
                for (var y = 0; y < this.height; y++) {
                    for (var x = 0; x < this.width; x++, i += 4) {
                        var rx = x - this.cx;
                        var ry = y - this.cy;
                        var d = Math.sqrt(rx * rx + ry * ry);
                        if (d < this.radius + 0.5) {
                            var h = Math.atan2(ry, rx) * 180 / Math.PI;
                            if (h < 0)
                                h += 360;
                            if (h > 360)
                                h -= 360;
                            var c = 100 * d / this.radius;

                            var rgb = picolor.lch2rgb(this.lch[0], c, h);

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

                            var horz = (Math.floor(x / 5) % 2 == 0);
                            var vert = (Math.floor(y / 5) % 2 == 0);
                            var val = (horz && !vert) || (!horz && vert) ? 250 : 200;
                            var b_r = val;
                            var b_g = val;
                            var b_b = val;

                            pixels[i] = (f_r * f_a) + (b_r * (1 - f_a));
                            pixels[i + 1] = (f_g * f_a) + (b_g * (1 - f_a));
                            pixels[i + 2] = (f_b * f_a) + (b_b * (1 - f_a));

                            pixels[i + 3] = 255 * Math.max(0, this.radius - d);
                        }
                    }
                }
            }

            i = 0;
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++, i += 4) {
                    if (y < 30 || y > this.height - 30)
                        continue;
                    if (x < 2 || x > 15)
                        continue;

                    var l = 100 - 100 * (y - 30) / (this.height - 60);
                    var rgb = picolor.lch2rgb(l, this.lch[1], this.lch[2]);
                    pixels[i] = rgb[0];
                    pixels[i + 1] = rgb[1];
                    pixels[i + 2] = rgb[2];
                    pixels[i + 3] = 255;
                }
            }

            i = 0;
            var rgb = picolor.lch2rgb(this.lch[0], this.lch[1], this.lch[2]);
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++, i += 4) {
                    if (y < 30 || y > this.height - 30)
                        continue;
                    if (x < this.width - 16 || x > this.width - 3)
                        continue;

                    var f_a = 1 - (y - 30) / (this.height - 60);
                    var f_r = rgb[0];
                    var f_g = rgb[1];
                    var f_b = rgb[2];

                    var horz = (Math.floor(x / 5) % 2 == 0);
                    var vert = (Math.floor(y / 5) % 2 == 0);
                    var val = (horz && !vert) || (!horz && vert) ? 250 : 200;
                    var b_r = val;
                    var b_g = val;
                    var b_b = val;

                    pixels[i] = (f_r * f_a) + (b_r * (1 - f_a));
                    pixels[i + 1] = (f_g * f_a) + (b_g * (1 - f_a));
                    pixels[i + 2] = (f_b * f_a) + (b_b * (1 - f_a));
                    pixels[i + 3] = 255;
                }
            }

            context.putImageData(this.imageDataCache, 0, 0);

            context.beginPath();
            context.lineWidth = 1.5;
            if (this.lch[0] > 50)
                context.strokeStyle = '#2f2f2f';
            else
                context.strokeStyle = '#dfdfdf';
            var lightnessY = 30 + (100 - this.lch[0]) / 100 * (this.height - 60);
            lightnessY = Math.max(35 + 2, Math.min(this.height - 30 - 6, lightnessY));
            context.arc(9, lightnessY, 5, 0, 2 * Math.PI, false);
            context.stroke();

            context.beginPath();
            if (this.alpha < 0.5)
                context.strokeStyle = '#2f2f2f';
            context.arc(this.picked_x, this.picked_y, 6, 0, 2 * Math.PI, false);
            context.stroke();

            context.beginPath();
            var alphaY = Math.min(this.height - 35, 30 + (1 - this.alpha) * (this.height - 60));
            alphaY = Math.max(35 + 2, Math.min(this.height - 30 - 6, alphaY));
            context.arc(this.width - 9, alphaY, 5, 0, 2 * Math.PI, false);
            context.stroke();
        };
        return ColorWheel;
    })();
    picolor.ColorWheel = ColorWheel;
})(picolor || (picolor = {}));
//# sourceMappingURL=picolor.js.map
