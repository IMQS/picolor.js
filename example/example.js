window.onload = function () {
    var basicPicker = new picolor.BasicPicker("basic-picker");
    basicPicker.draw();

    // $("#basic-picker").on("oncolorchange", (ev, color) => { alert(color) });
    var colorWheel = new picolor.ColorWheel("color-wheel");
    colorWheel.draw();

    // $("#color-wheel").on("oncolorchange", (ev, color) => { alert(color) });
    var palettePicker = new picolor.Palette("palette-picker", { categoryCount: 7 });
    palettePicker.draw();

    // $("#palette-picker").on("oncolorchange", (ev, palette) => { alert(palette) });
    $("#basic-picker").on("oncolorchange", function (ev, color) {
        colorWheel.color = color;
    });
    $("#color-wheel").on("oncolorchange", function (ev, color) {
        basicPicker.color = color;
    });
};
//# sourceMappingURL=example.js.map
