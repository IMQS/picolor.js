# picolor.js  
JavaScript color picker for picking colors in LCH space. It is optimized for picking visually distinct colors for maps, but can be used for anything else.  

## Why not use a stock color picker?  
Picking suitable colors for maps are hard, especially when it comes to selecting visually distinct colors for a range of values. picolor.js aims to ease that process by providing smart pre-set visually distinct colors and palettes.  

## Demos  

[Basic Picker](http://jsfiddle.net/jacobriers/r4vzm2ha/2/)  
[Color Wheel](http://jsfiddle.net/jacobriers/qew2htaa/)  
[Basic Picker - Color Wheel Interaction](http://jsfiddle.net/jacobriers/hhsfj4tf/1/)  
[Palette Picker](http://jsfiddle.net/jacobriers/xod1bvav/1/)  

## Build from source  

### Prerequisites  
1. [node.js](https://nodejs.org/)  

### Build   
1. `npm install`  
2. `npm run build`  

## TODO  
- Make sizing configurable  
- Single Picker: Use only canvas  
- Palette Picker: Interpolate colors for qualitative palette where number of categories > 12  
- Palette Picker: Lighten/darken palettes when user drags slider up/down  

## Useful links  
[Color Brewer](http://colorbrewer2.com/)  
[Interpolating colors](https://vis4.net/blog/posts/avoid-equidistant-hsv-colors/)  
[Generating multi-hued color scales](https://vis4.net/blog/posts/mastering-multi-hued-color-scales/)  
[chroma.js](https://github.com/gka/chroma.js)  
