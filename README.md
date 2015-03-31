# picolor.js  
JavaScript color picker controls optimized for picking map colors  

# Why not use a stock color picker?  
Picking suitable colors for maps are hard, especially when it comes to selecting visually distinct colors for a range of values. picolor.js aims to ease that process by providing smart pre-set visually distinct colors and palettes.  

# Build from source  
## Prerequisites  
1. [node.js](https://nodejs.org/)  
2. [node-typescript](https://www.npmjs.com/package/node-typescript) `npm install -g typescript`  
3. [Java](https://java.com/en/download/) to run Google Closure Compiler  
4. [GNU Make](https://www.gnu.org/software/make/)  
## Building with make   
1. `make clean`  
2. `make`  

# TODO  
- Remove JQuery dependency  
- Add onchange events  
- Get rid of css dependency  
- Embed chroma.js inside picolor.js and picolor.min.js  
- Extend example  
- Make sizing configurable  
- Single Picker: Use only canvas  
- Palette Picker: Interpolate colors for qualitative palette where number of categories > 12  
- Palette Picker: Lighten/darken palettes when user drags up/down  

# Useful links  
[Color Brewer](http://colorbrewer2.com/)  
[Interpolating colors](https://vis4.net/blog/posts/avoid-equidistant-hsv-colors/)  
[Generating multi-hued color scales](https://vis4.net/blog/posts/mastering-multi-hued-color-scales/)  
[chroma.js](https://github.com/gka/chroma.js)  
