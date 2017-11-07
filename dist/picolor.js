define(["require", "exports", "chroma-js"], function (require, exports, Chroma) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ////////////////////////////////////////////////////////////////////////////
    // Utils
    ////////////////////////////////////////////////////////////////////////////
    function _id(divID) {
        return document.getElementById(divID);
    }
    function _empty(divID) {
        var el = _id(divID);
        if (!el)
            return;
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
    function _append(divID, html) {
        var el = _id(divID);
        if (!el)
            return;
        el.innerHTML += html;
    }
    function _offset(divID) {
        var el = _id(divID);
        var rect = el.getBoundingClientRect();
        return {
            top: rect.top + document.body.scrollTop,
            left: rect.left + document.body.scrollLeft
        };
    }
    // 6 colors of with light and dark variations of each
    var _lightSpectrum = [
        Chroma.hex(Chroma.brewer.Paired[0]),
        Chroma.hex(Chroma.brewer.Paired[2]),
        Chroma.hex(Chroma.brewer.Paired[10]),
        Chroma.hex(Chroma.brewer.Paired[6]),
        Chroma.hex(Chroma.brewer.Paired[4]),
        Chroma.hex(Chroma.brewer.Paired[8])
    ];
    var _darkSpectrum = [
        Chroma.hex(Chroma.brewer.Paired[1]),
        Chroma.hex(Chroma.brewer.Paired[3]),
        Chroma.hex(Chroma.brewer.Paired[11]),
        Chroma.hex(Chroma.brewer.Paired[7]),
        Chroma.hex(Chroma.brewer.Paired[5]),
        Chroma.hex(Chroma.brewer.Paired[9])
    ];
    var _whiteToBlackInterpolator = Chroma.scale(['white', 'black']).correctLightness(true);
    function _lch2rgb(l, c, h) {
        var lab_xyz = function (x) {
            if (x > 0.206893034) {
                return x * x * x;
            }
            else {
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
    var BasicPicker = /** @class */ (function () {
        function BasicPicker(containerDivID, options) {
            this._lch = _whiteToBlackInterpolator(0.4).lch();
            this._alpha = 1;
            if (options)
                this.setOptions(options);
            // set div IDs
            this.containerDivID = containerDivID;
            this.colorBandDivID = this.containerDivID + '-colorband';
            this.blackToWhiteBandDivID = this.containerDivID + '-blacktowhiteband';
            // add DOM structure 
            var content = '<div>' +
                '	<div id="' + this.colorBandDivID + '-0' + '"></div>' +
                '	<div id="' + this.colorBandDivID + '-1' + '"></div>' +
                '	<div id="' + this.blackToWhiteBandDivID + '"></div>' +
                '</div>';
            _empty(this.containerDivID);
            _append(this.containerDivID, content);
            this.draw();
        }
        BasicPicker.prototype.setOptions = function (options) {
            // change private members, editing public members causes premature redraw
            if (options.color) {
                this._lch = options.color.lch();
                this._alpha = (options.color.alpha());
            }
            // trigger event
            if (options.onChange)
                this.onChange = options.onChange;
        };
        Object.defineProperty(BasicPicker.prototype, "lch", {
            get: function () {
                return this._lch;
            },
            set: function (val) {
                // Constrain hue : 0 <= h < 360
                if (val[2] < 0)
                    val[2] += 360;
                if (val[2] >= 360)
                    val[2] -= 360;
                this._lch = val;
                this.draw(); // redraw control
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicPicker.prototype, "hex", {
            get: function () {
                return Chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BasicPicker.prototype, "color", {
            get: function () {
                var color = Chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
                color.alpha(this._alpha);
                return color;
            },
            set: function (val) {
                this._lch = val.lch();
                this._alpha = (val.alpha());
                this.draw();
            },
            enumerable: true,
            configurable: true
        });
        BasicPicker.prototype.draw = function () {
            // TODO: rather use canvas to draw blocks and add checkerbox to indicate transparency
            // TODO: add scaling based on container size rather than harcoded size
            var _this = this;
            var colorDiff = function (col1, col2) {
                // ignore alpha matching
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
                    content += '<div id="' + divID + '" style="width: 38px;' +
                        'height: 24px;' +
                        'cursor: pointer;' +
                        'display: inline-block;' +
                        'padding: 1px;' +
                        'background-color: #E0E0E0;' +
                        'margin: 0px 4px 0px 4px;';
                    if (colorDiff(_this.color, spectrum[i]) < 1)
                        content += ' border: 2px solid black;';
                    else
                        content += ' border: 2px solid #E0E0E0;';
                    content += '">';
                    content += '	<div style="height: 24px; background-color:' + spectrum[i].css() + '"></div>';
                    content += '</div>';
                }
                _empty(containerID);
                _append(containerID, content);
                var _loop_1 = function () {
                    var divID_1 = containerID + '-' + i;
                    var el = _id(divID_1);
                    var newColor = spectrum[i];
                    el.addEventListener('click', function (ev) {
                        _this.lch = newColor.lch();
                        if (_this.onChange)
                            _this.onChange(_this.color);
                    });
                    el.addEventListener('mouseenter', function (ev) {
                        if (colorDiff(_this.color, newColor) >= 1)
                            el.style.border = '2px solid gray';
                    });
                    el.addEventListener('mouseleave', function (ev) {
                        if (colorDiff(_this.color, newColor) >= 1)
                            el.style.border = '2px solid #E0E0E0';
                    });
                };
                // attach event handlers
                for (var i = 0; i < spectrum.length; i++) {
                    _loop_1();
                }
            };
            var blackWhiteSpectrum = [];
            var step = 0.2;
            for (var i = 0; i < 6; i++)
                blackWhiteSpectrum.push(_whiteToBlackInterpolator(i * step));
            genSpectrumContent(_lightSpectrum, this.colorBandDivID + '-0');
            genSpectrumContent(_darkSpectrum, this.colorBandDivID + '-1');
            genSpectrumContent(blackWhiteSpectrum, this.blackToWhiteBandDivID);
        };
        return BasicPicker;
    }());
    exports.BasicPicker = BasicPicker;
    var Palette = /** @class */ (function () {
        function Palette(containerDivID, options) {
            var _this = this;
            this.containerDivID = containerDivID;
            this._categoryCount = 3;
            this._alpha = 1;
            // sequential palette ranges
            this.blueRange = [Chroma.hex('#deebf7'), Chroma.hex('#08306b')];
            this.orangeRange = [Chroma.hex('#fee6ce'), Chroma.hex('#7f2704')];
            this.greenRange = [Chroma.hex('#e5f5e0'), Chroma.hex('#00441b')];
            this.grayRange = [Chroma.hex('#d9d9d9'), Chroma.hex('#000000')];
            // divergent palette ranges
            //  brown-white-seagreen
            this.brownWhiteRange = [Chroma.hex('#543005'), Chroma.hex('#f5f5f5')];
            this.whiteSeagreenRange = [Chroma.hex('#f5f5f5'), Chroma.hex('#003c30')];
            //	red-yellow-purple
            this.redYellowRange = [Chroma.hex('#a50026'), Chroma.hex('#ffffbf')];
            this.yellowPurpleRange = [Chroma.hex('#ffffbf'), Chroma.hex('#313695')];
            // qualitative palette ranges
            this.qualitativePaletteCount = 1;
            this.brewerPairedRanges = [
                [Chroma.hex(Chroma.brewer.Paired[0]), Chroma.hex(Chroma.brewer.Paired[1])],
                [Chroma.hex(Chroma.brewer.Paired[2]), Chroma.hex(Chroma.brewer.Paired[3])],
                [Chroma.hex(Chroma.brewer.Paired[4]), Chroma.hex(Chroma.brewer.Paired[5])],
                [Chroma.hex(Chroma.brewer.Paired[6]), Chroma.hex(Chroma.brewer.Paired[7])],
                [Chroma.hex(Chroma.brewer.Paired[8]), Chroma.hex(Chroma.brewer.Paired[9])],
                [Chroma.hex(Chroma.brewer.Paired[10]), Chroma.hex(Chroma.brewer.Paired[11])]
            ];
            this.margin = 10;
            this.pad = 10;
            this.h = 33;
            this.w = 33;
            this.hoverPalIdx = -1;
            this.selectedPalIdx = 0;
            this.isDraggingLightness = false;
            // set div IDs
            this.containerDivID = containerDivID;
            this.paletteCanvasDivID = this.containerDivID + '-canvas';
            if (options)
                this.setOptions(options);
            // add DOM structure 
            var content = '<div style="background-color: #E0E0E0; padding 5px; cursor: pointer;">' +
                '	<canvas id="' + this.paletteCanvasDivID + '"></canvas>' +
                '</div>';
            _empty(this.containerDivID);
            _append(this.containerDivID, content);
            // attach event handler
            var el = _id(this.paletteCanvasDivID);
            el.addEventListener('click', this.setPalette.bind(this));
            // attach hovering functionality
            el.addEventListener('mousemove', function (ev) {
                _this.onHover(ev, 'gray');
            });
            el.addEventListener('mouseleave', function (ev) {
                _this.onHover(ev, '#E0E0E0');
            });
            this.draw();
        }
        Palette.prototype.onHover = function (ev, hoverColor) {
            var hoverIdx = this.resolvePaletteIndex(ev.clientX, ev.clientY);
            if (this.hoverPalIdx === hoverIdx)
                return;
            this.hoverPalIdx = hoverIdx;
            var el = document.getElementById(this.paletteCanvasDivID);
            for (var k = 0; k < 7; k++) {
                if (this.selectedPalIdx !== k)
                    this.drawPaletteBorder(k, el.getContext('2d'), '#E0E0E0');
            }
            if (this.selectedPalIdx !== this.hoverPalIdx)
                this.drawPaletteBorder(this.hoverPalIdx, el.getContext('2d'), hoverColor);
        };
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
            return Chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
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
                    return Chroma.scale([range[0].hex(), range[1].hex()]).correctLightness(true);
                };
                var brownWhiteSeagreenPalette1 = Chroma.scale([this.brownWhiteRange[0].hex(), this.brownWhiteRange[1].hex()]).correctLightness(true);
                var brownWhiteSeagreenPalette2 = Chroma.scale([this.whiteSeagreenRange[0].hex(), this.whiteSeagreenRange[1].hex()]).correctLightness(true);
                var redYellowPurplePalette1 = Chroma.scale([this.redYellowRange[0].hex(), this.redYellowRange[1].hex()]).correctLightness(true);
                var redYellowPurplePalette2 = Chroma.scale([this.yellowPurpleRange[0].hex(), this.yellowPurpleRange[1].hex()]).correctLightness(true);
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
        Palette.prototype.resolvePaletteIndex = function (mousex, mousey) {
            var x = mousex - this.offset.left;
            var y = mousey - this.offset.top;
            var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePaletteCount;
            var totWidth = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);
            return Math.floor(x / (totWidth / numPals));
        };
        Palette.prototype.setPalette = function (ev) {
            this.selectedPalIdx = this.resolvePaletteIndex(ev.clientX, ev.clientY);
            // trigger event
            if (this.onChange)
                this.onChange(this.palette);
            this.draw();
        };
        Palette.prototype.setOptions = function (options) {
            if (options.categoryCount && options.categoryCount > 1) {
                this._categoryCount = options.categoryCount;
            }
            if (options.onChange)
                this.onChange = options.onChange;
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
            // sequential palettes
            for (var i = 0; i < this.sequentialPalettes.length; i++) {
                var palArr = [];
                var pal = this.sequentialPalettes[i];
                for (var j = 0; j < numCats; j++) {
                    var idx = j / (numCats - 1);
                    palArr.push(pal(idx));
                }
                m.push(palArr);
            }
            // divergent palettes
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
            // qualitative palettes (only paired brewer at the moment)
            var palArr = [];
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
        Palette.prototype.drawPaletteBorder = function (palIdx, context, strokeStyle) {
            context.globalAlpha = 1;
            context.strokeStyle = strokeStyle;
            context.lineWidth = 1.5;
            context.strokeRect(this.margin - 2 + palIdx * (this.w + this.pad), this.margin - 2, this.w + 4, this.h * this.categoryCount + 4);
        };
        Palette.prototype.drawTransparencySelection = function (context) {
        };
        Palette.prototype.drawLightnessSelection = function (context) {
        };
        Palette.prototype.draw = function () {
            this.offset = _offset(this.paletteCanvasDivID);
            var el = document.getElementById(this.paletteCanvasDivID);
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
        };
        return Palette;
    }());
    exports.Palette = Palette;
    var ColorWheel = /** @class */ (function () {
        function ColorWheel(containerDivID, options) {
            var _this = this;
            this._lch = _whiteToBlackInterpolator(0.4).lch();
            this._alpha = 1;
            this.dirty = true;
            this.width = 298;
            this.height = 298;
            this.radius = 119;
            // defaults
            this.cx = this.width / 2;
            this.cy = this.height / 2;
            if (options)
                this.setOptions(options);
            // set div IDs
            this.containerDivID = containerDivID;
            this.colorWheelDivID = this.containerDivID + '-colorwheel';
            // add DOM structure 
            var content = '<div style="background-color: #E0E0E0; padding 5px">' +
                '	<canvas id="' + this.colorWheelDivID + '"></canvas>';
            '</div>';
            _empty(this.containerDivID);
            _append(this.containerDivID, content);
            var createCanvas = function (divID) {
                var el = document.getElementById(divID);
                el.width = _this.width;
                el.height = _this.height;
                var context = el.getContext('2d');
                return context.createImageData(_this.width, _this.height);
            };
            this.imageDataCache = createCanvas(this.colorWheelDivID);
            this.addEventListeners();
        }
        ColorWheel.prototype.addEventListeners = function () {
            var _this = this;
            var el = document.getElementById(this.colorWheelDivID);
            this.stopDraggingHandler = this.setWheelDragStateOff.bind(this);
            this.mouseMoveHandler = function (ev) {
                _this.setCursor(ev);
                _this.setWheelColor(ev);
            };
            window.addEventListener('mouseup', this.stopDraggingHandler);
            window.addEventListener('mousemove', this.mouseMoveHandler);
            el.addEventListener('mousedown', function (ev) {
                _this.setWheelDragStateOn(ev);
                _this.setWheelColor(ev);
            });
            this.loop();
        };
        ColorWheel.prototype.removeEventListeners = function () {
            window.removeEventListener('mouseup', this.stopDraggingHandler);
            window.removeEventListener('mousemove', this.mouseMoveHandler);
            cancelAnimationFrame(this.animationLoopHandlerRef);
        };
        ColorWheel.prototype.setOptions = function (options) {
            // change private members, editing public members causes premature redraw
            if (options.color) {
                this._lch = options.color.lch();
                this._alpha = (options.color.alpha());
            }
            if (options.onChange)
                this.onChange = options.onChange;
        };
        ColorWheel.prototype.setWheelDragStateOn = function (ev) {
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
        };
        ColorWheel.prototype.setCursor = function (ev) {
            // don't change cursor while dragging
            if (this.isDraggingAlpha || this.isDraggingColor || this.isDraggingLightness)
                return;
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
        };
        ColorWheel.prototype.setWheelColor = function (ev) {
            var _this = this;
            if (!this.isDraggingAlpha && !this.isDraggingColor && !this.isDraggingLightness)
                return;
            var x = ev.pageX - this.offset.left;
            var y = ev.pageY - this.offset.top;
            // check if click is inside wheel
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
                setTimeout(function () {
                    _this.onChange(_this.color);
                }, 100);
            }
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
                if (isNaN(val[2]))
                    val[2] = 0;
                // Constrain Chroma : 0 <= c < 360
                if (val[1] < 0)
                    val[1] += 360;
                if (val[1] >= 360)
                    val[1] -= 360;
                // Constrain Chroma : 0 <= h < 360
                if (val[2] < 0)
                    val[2] += 360;
                if (val[2] >= 360)
                    val[2] -= 360;
                if (this._lch[0] !== val[0] || this._lch[1] !== val[1] || this._lch[2] !== val[2])
                    this.dirty = true;
                this._lch = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ColorWheel.prototype, "hex", {
            get: function () {
                return Chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ColorWheel.prototype, "alpha", {
            get: function () {
                return this._alpha;
            },
            set: function (val) {
                if (this._alpha !== val)
                    this.dirty = true;
                this._alpha = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ColorWheel.prototype, "color", {
            get: function () {
                var color = Chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
                color.alpha(this._alpha);
                return color;
            },
            set: function (val) {
                var newLch = val.lch();
                var newAlpha = val.alpha();
                if ((this._lch[0] != newLch[0]) || (this._alpha != newAlpha))
                    this.dirty = true;
                this._lch = newLch;
                this._alpha = newAlpha;
            },
            enumerable: true,
            configurable: true
        });
        ColorWheel.prototype.loop = function () {
            this.draw();
            this.animationLoopHandlerRef = window.requestAnimationFrame(this.loop.bind(this));
        };
        ColorWheel.prototype.draw = function () {
            if (!this.dirty)
                return;
            this.offset = _offset(this.colorWheelDivID);
            var el = _id(this.colorWheelDivID);
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
                        if (h < 0)
                            h += 360;
                        if (h > 360)
                            h -= 360;
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
                    if (y < 30 || y > this.height - 30)
                        continue;
                    if (x < 2 || x > 15)
                        continue;
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
                    if (y < 30 || y > this.height - 30)
                        continue;
                    if (x < this.width - 16 || x > this.width - 3)
                        continue;
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
        };
        // clean up event listeners attached to window DOM element
        ColorWheel.prototype.destroy = function () {
            this.removeEventListeners();
        };
        return ColorWheel;
    }());
    exports.ColorWheel = ColorWheel;
});
//# sourceMappingURL=picolor.js.map