window.onload = function () {
    var singlePicker = new picolor.SingleColor("single-picker", { showColorWheel: true });
    singlePicker.draw();

    // $("#single-picker").on("oncolorchange", (ev, color) => { alert(color) });
    var palettePicker = new picolor.Palette("palette-picker", { categoryCount: 7 });
    palettePicker.draw();
    // $("#palette-picker").on("oncolorchange", (ev, palette) => { alert(palette) });
};
//# sourceMappingURL=example.js.map
