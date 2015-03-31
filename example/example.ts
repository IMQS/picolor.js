window.onload = () => {
	var singlePicker = new picolor.SingleColor("single-picker", { showColorWheel: true });
	singlePicker.draw();

	var palettePicker = new picolor.Palette("palette-picker", { categoryCount: 7 });
	palettePicker.draw();
};