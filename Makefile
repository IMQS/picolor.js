all: picolor.min.js

clean:
	@del /Q picolor.js picolor.min.js

picolor.js: src/basic.ts src/wheel.ts src/palette.ts
	@tsc --target ES5 src/basic.ts src/wheel.ts src/palette.ts src/defs/chroma-js.d.ts src/defs/jquery.d.ts --out picolor.js

picolor.min.js: picolor.js
	@java -jar closure/closure.jar --compilation_level SIMPLE_OPTIMIZATIONS --formatting pretty_print picolor.js --js_output_file picolor.min.js
