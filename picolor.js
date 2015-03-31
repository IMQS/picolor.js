var picolor;
(function (picolor) {
    // 6 colors of with light and dark variations of each
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

    var SingleColor = (function () {
        function SingleColor(containerDivID, options) {
            var _this = this;
            // set defaults
            this._lch = picolor.whiteToBlackInterpolator(0.4).lch(); // default = white
            this._alpha = 255; // default = opaque
            this._showBasicSelector = true; // default = show basic selector
            this._showColorWheel = false; // default = hide color wheel
            this._showLabels = false; // default = hide labels

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
            this.colorBandDivID = this.containerDivID + '-colorband';
            this.blackToWhiteBandDivID = this.containerDivID + '-blacktowhiteband';
            this.colorWheelDivID = this.containerDivID + '-colorwheel';

            // add DOM structure
            var content = '<div class="picolor-container">' + '	<div class="picolor-top-container">' + '		<div id="' + this.colorBandDivID + '-0' + '"></div>' + '		<div id="' + this.colorBandDivID + '-1' + '"></div>' + '		<div id="' + this.blackToWhiteBandDivID + '" style="margin-top: 6px"></div>' + '	</div>' + '	<div class="picolor-bottom-container">' + '		<canvas id="' + this.colorWheelDivID + '"></canvas>' + '	</div>' + '</div>';

            var container = $('#' + this.containerDivID);
            container.empty();
            container.append(content);

            // hook up event handlers
            $('#' + this.colorWheelDivID).mouseleave(this.setWheelDragStateOff.bind(this));
            $('#' + this.colorWheelDivID).mouseup(this.setWheelDragStateOff.bind(this));
            $('#' + this.colorWheelDivID).mousedown(function (ev) {
                _this.setWheelDragStateOn(ev);
                _this.setWheelColor(ev);
            });
            $('#' + this.colorWheelDivID).mousemove(this.setWheelColor.bind(this));
        }
        SingleColor.prototype.setOptions = function (options) {
            // change private members, editing public members causes premature redraw
            if (options.color) {
                this._lch = options.color.lch();
                this._alpha = options.color.alpha();
            }
            this._showColorWheel = !!options.showColorWheel;
            this._showLabels = !!options.showLabels;
            this._showBasicSelector = !!options.showColorWheel;
        };

        SingleColor.prototype.setWheelDragStateOn = function (ev) {
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
        };

        SingleColor.prototype.setWheelColor = function (ev) {
            if (!this.isDraggingAlpha && !this.isDraggingColor && !this.isDraggingLightness)
                return;

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
                this.alpha = Math.max(0, Math.min(255, 255 - 255 * (y - 30) / (this.height - 60)));
            }
        };

        SingleColor.prototype.setWheelDragStateOff = function (ev) {
            this.isDraggingAlpha = false;
            this.isDraggingColor = false;
            this.isDraggingLightness = false;
        };

        Object.defineProperty(SingleColor.prototype, "lch", {
            get: function () {
                return this._lch;
            },
            set: function (val) {
                // Constrain chroma : 0 <= c < 360
                if (val[2] < 0)
                    val[2] += 360;
                if (val[2] >= 360)
                    val[2] -= 360;

                this._lch = val;

                // TODO: fire off colorchange event
                this.draw(); // redraw control
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(SingleColor.prototype, "hex", {
            get: function () {
                return chroma.lch(this.lch[0], this.lch[1], this.lch[2]).hex();
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(SingleColor.prototype, "alpha", {
            get: function () {
                return this._alpha;
            },
            set: function (val) {
                this._alpha = val;
                this.draw(); // redraw control
            },
            enumerable: true,
            configurable: true
        });

        SingleColor.prototype.getColor = function () {
            return chroma.lch(this.lch[0], this.lch[1], this.lch[2]);
        };

        Object.defineProperty(SingleColor.prototype, "showColorWheel", {
            get: function () {
                return this._showColorWheel;
            },
            set: function (val) {
                this._showColorWheel = val;
                this.draw();
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(SingleColor.prototype, "showLabels", {
            get: function () {
                return this._showLabels;
            },
            set: function (val) {
                this._showLabels = val;
                this.draw();
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(SingleColor.prototype, "showBasicSelector", {
            get: function () {
                return this._showBasicSelector;
            },
            set: function (val) {
                this._showBasicSelector = val;
                this.draw();
            },
            enumerable: true,
            configurable: true
        });

        SingleColor.prototype.draw = function () {
            // Remove all old click handlers - if you don't do this it destroys performance
            $('#' + this.containerDivID).off('click');

            if (this.showBasicSelector)
                this.drawBasicSelector();
            if (this.showColorWheel)
                this.drawColorWheel();
        };

        SingleColor.prototype.drawBasicSelector = function () {
            // TODO: rather use canvas to draw blocks and add checkerbox to indicate transparency
            // TODO: add scaling based on container size rather than harcoded size
            var _this = this;
            var genSpectrumContent = function (spectrum, containerID) {
                var content = '';
                for (var i = 0; i < spectrum.length; i++) {
                    var divID = containerID + '-' + i;
                    content += '<div id="' + divID + '" class="picolor-box-container';
                    if (_this.getColor().css() === spectrum[i].css())
                        content += ' picolor-box-container-selected';
                    content += '">';
                    content += '	<div class="picolor-box" style="background-color:' + spectrum[i].css() + '"></div>';
                    content += '</div>';

                    $('#' + _this.containerDivID).on('click', '#' + divID, spectrum[i].lch(), function (ev) {
                        _this.lch = ev.data;
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

        SingleColor.prototype.drawColorWheel = function () {
            // TODO: add scaling based on container size rather than hardcoded size
            this.offset = $('#' + this.colorWheelDivID).offset();

            var el = document.getElementById(this.colorWheelDivID);
            var context = el.getContext('2d');

            var picked_x, picked_y;
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
                        if (h < 0)
                            h += 360;
                        if (h > 360)
                            h -= 360;
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
                        pixels[i] = (f_r * f_a / 255) + (b_r * (1 - f_a / 255));
                        pixels[i + 1] = (f_g * f_a / 255) + (b_g * (1 - f_a / 255));
                        pixels[i + 2] = (f_b * f_a / 255) + (b_b * (1 - f_a / 255));

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
                    var rgb = chroma.lch2rgb(l, this.lch[1], this.lch[2]);
                    pixels[i] = rgb[0];
                    pixels[i + 1] = rgb[1];
                    pixels[i + 2] = rgb[2];
                    pixels[i + 3] = 255;
                }
            }

            // draw tranparency slider
            i = 0;
            var rgb = chroma.lch2rgb(this.lch[0], this.lch[1], this.lch[2]);
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++, i += 4) {
                    if (y < 30 || y > this.height - 30)
                        continue;
                    if (x < this.width - 16 || x > this.width - 3)
                        continue;

                    // foreground alpha
                    var f_a = 255 - 255 * (y - 30) / (this.height - 60);
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
                    pixels[i] = (f_r * f_a / 255) + (b_r * (1 - f_a / 255));
                    pixels[i + 1] = (f_g * f_a / 255) + (b_g * (1 - f_a / 255));
                    pixels[i + 2] = (f_b * f_a / 255) + (b_b * (1 - f_a / 255));
                    pixels[i + 3] = 255;
                }
            }

            context.putImageData(imageData, 0, 0);

            // draw circle around selected color in wheel
            context.beginPath();
            context.lineWidth = 2;
            if (this.lch[0] > 50)
                context.strokeStyle = '#0f0f0f'; // for light wheel
            else
                context.strokeStyle = '#efefef'; // for dark wheel
            context.arc(picked_x, picked_y, 3, 0, 2 * Math.PI, false);
            context.stroke();

            // draw rectangle around selected color in lightness slider
            context.beginPath();
            var lightnessY = Math.min(this.height - 35, 30 + (100 - this.lch[0]) / 100 * (this.height - 60));
            context.rect(1, lightnessY, 16, 5);
            context.stroke();

            // draw rectangle around selected tranparency
            context.beginPath();
            if (this.alpha < 128)
                context.strokeStyle = '#0f0f0f';
            var alphaY = Math.min(this.height - 35, 30 + (1 - this.alpha / 255) * (this.height - 60));
            context.rect(this.width - 17, alphaY, 16, 5);
            context.stroke();

            if (this.showLabels) {
                // TODO: make label font and text configurable
                // light/dark labels
                context.fillStyle = '#818181';
                context.font = "10px sans-serif";
                context.fillText("Dark", 20, this.height - 30);
                context.textBaseline = "top";
                context.fillText("Light", 20, 30);

                // opaque/transparent labels
                context.textAlign = "end";
                context.fillText("Opaque", this.width - 21, 30);
                context.textBaseline = "bottom";
                context.fillText("Transparent", this.width - 21, this.height - 30);
            }
        };
        return SingleColor;
    })();
    picolor.SingleColor = SingleColor;

    var Palette = (function () {
        function Palette(containerDivID, options) {
            this.containerDivID = containerDivID;
            // sequential palettes
            this.bluePalette = chroma.scale(['#deebf7', '#08306b']).correctLightness(true);
            this.orangePalette = chroma.scale(['#fee6ce', '#7f2704']).correctLightness(true);
            this.greenPalette = chroma.scale(['#e5f5e0', '#00441b']).correctLightness(true);
            this.grayPalette = chroma.scale(['#d9d9d9', 'black']).correctLightness(true);
            // divergent palettes
            this.brownWhiteSeagreenPalette1 = chroma.scale(['#543005', '#f5f5f5']).correctLightness(true);
            this.brownWhiteSeagreenPalette2 = chroma.scale(['#f5f5f5', '#003c30']).correctLightness(true);
            this.redYellowPurplePalette1 = chroma.scale(['#a50026', '#ffffbf']).correctLightness(true);
            this.redYellowPurplePalette2 = chroma.scale(['#ffffbf', '#313695']).correctLightness(true);
            this.margin = 10;
            this.pad = 10;
            this.h = 33;
            this.w = 33;
            this.palMatrix = [];
            this.selectedPalIdx = 0;
            this.lighten = 0;
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
                this.setOptions(options);

            // add DOM structure
            var content = '<div class="picolor-container">' + '	<canvas id="' + this.paletteCanvasDivID + '"></canvas>' + '</div>';
            var container = $('#' + this.containerDivID);
            container.empty();
            container.append(content);

            // attach event handler
            $('#' + this.paletteCanvasDivID).click(this.onClick.bind(this));
        }
        Palette.prototype.onClick = function (ev) {
            var x = ev.pageX - this.offset.left;
            var y = ev.pageY - this.offset.top;

            var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePalettes.length;
            var totWidth = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);

            this.selectedPalIdx = Math.floor(x / (totWidth / numPals));

            // TODO: fire off palettechange event
            this.draw();
        };

        Palette.prototype.setOptions = function (options) {
            if (options.categoryCount && options.categoryCount > 1) {
                this._categoryCount = options.categoryCount;
            }
        };

        Object.defineProperty(Palette.prototype, "hexPalette", {
            get: function () {
                var result = [];
                var pal = this.palMatrix[this.selectedPalIdx];
                for (var i = 0; i < pal.length; i++) {
                    result.push(pal[i].hex());
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

        Palette.prototype.draw = function () {
            this.offset = $('#' + this.paletteCanvasDivID).offset();

            var el = document.getElementById(this.paletteCanvasDivID);
            var context = el.getContext('2d');

            var numCats = this.categoryCount;
            var numPals = this.sequentialPalettes.length + this.divergentPalettes.length + this.qualitativePalettes.length;

            el.width = this.margin * 2 + this.w * numPals + this.pad * (numPals - 1);
            el.height = this.margin * 2 + this.h * numCats;

            for (var i = 0; i < this.sequentialPalettes.length; i++) {
                var palArr = [];
                var pal = this.sequentialPalettes[i];
                for (var j = 0; j < numCats; j++) {
                    var idx = j / (numCats - 1);
                    palArr.push(pal(idx).hex());
                }
                this.palMatrix.push(palArr);
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
                this.palMatrix.push(palArr);
            }

            for (var i = 0; i < this.qualitativePalettes.length; i++) {
                var palArr = [];
                var palStr = this.qualitativePalettes[i];

                for (var j = 0; j < palStr.length && j < numCats; j++) {
                    palArr.push(chroma.hex(palStr[j]));
                }
                this.palMatrix.push(palArr);
            }

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
        };
        return Palette;
    })();
    picolor.Palette = Palette;
})(picolor || (picolor = {}));
