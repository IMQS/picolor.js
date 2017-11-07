/// <reference types="chroma-js" />
import * as Chroma from 'chroma-js';
export interface BasicPickerOptions {
    color?: Chroma.Color;
    onChange?: (selectedColor: Chroma.Color) => void;
}
export declare class BasicPicker {
    private _lch;
    private _alpha;
    private containerDivID;
    private colorBandDivID;
    private blackToWhiteBandDivID;
    private onChange;
    constructor(containerDivID: string, options?: BasicPickerOptions);
    private setOptions(options);
    lch: number[];
    readonly hex: string;
    color: Chroma.Color;
    draw(): void;
}
export interface PaletteOptions {
    categoryCount?: number;
    onChange?: (selectedColors: Chroma.Color[]) => void;
}
export declare class Palette {
    containerDivID: string;
    private _categoryCount;
    private _alpha;
    private blueRange;
    private orangeRange;
    private greenRange;
    private grayRange;
    private brownWhiteRange;
    private whiteSeagreenRange;
    private redYellowRange;
    private yellowPurpleRange;
    private qualitativePaletteCount;
    private brewerPairedRanges;
    private paletteCanvasDivID;
    private offset;
    private margin;
    private pad;
    private h;
    private w;
    private hoverPalIdx;
    private selectedPalIdx;
    private isDraggingLightness;
    private onChange;
    constructor(containerDivID: string, options?: PaletteOptions);
    private onHover(ev, hoverColor);
    alpha: number;
    private generateScale(range);
    private readonly sequentialPalettes;
    private readonly divergentPalettes;
    private readonly brewerPairedScales;
    private resolvePaletteIndex(mousex, mousey);
    private setPalette(ev);
    private setOptions(options);
    readonly palette: Chroma.Color[];
    categoryCount: number;
    private paletteMatrix();
    private drawCheckerboxAndTransparencySlider(el, context, palMatrix);
    private drawPalettes(context, palMatrix);
    private drawPaletteBorder(palIdx, context, strokeStyle);
    private drawTransparencySelection(context);
    private drawLightnessSelection(context);
    draw(): void;
}
export interface ColorWheelOptions {
    color?: Chroma.Color;
    onChange?: (selectedColor: Chroma.Color) => void;
}
export declare class ColorWheel {
    private _lch;
    private _alpha;
    private dirty;
    private containerDivID;
    private colorWheelDivID;
    private isDraggingLightness;
    private isDraggingColor;
    private isDraggingAlpha;
    private stopDraggingHandler;
    private mouseMoveHandler;
    private animationLoopHandlerRef;
    private imageDataCache;
    private picked_x;
    private picked_y;
    private width;
    private height;
    private cx;
    private cy;
    private radius;
    private offset;
    private onChange;
    private onChangeTimeout;
    constructor(containerDivID: string, options?: ColorWheelOptions);
    private addEventListeners();
    private removeEventListeners();
    private setOptions(options);
    private setWheelDragStateOn(ev);
    private setCursor(ev);
    private setWheelColor(ev);
    private setWheelDragStateOff(ev);
    lch: number[];
    readonly hex: string;
    alpha: number;
    color: Chroma.Color;
    loop(): void;
    draw(): void;
    destroy(): void;
}
