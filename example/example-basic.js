requirejs(["../dist/picolor.min.js", "chroma-js.js"], function(picolor, Chroma) {

	var selectedColor = Chroma.lch(58.061499982358825, 71.9514410023062, 137.14221716451664);
	
	var basicPicker = new picolor.BasicPicker("basic-picker", {
	    color: selectedColor,
	    onChange: (color) => {
	        document.getElementById("link").style.color = color.hex();
	    }
	});
})