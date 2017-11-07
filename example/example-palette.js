requirejs(["../dist/picolor.min.js", "chroma-js.js"], function(picolor, Chroma) {
	var palettePicker = new picolor.Palette("palette-picker", { categoryCount: 7 });
})