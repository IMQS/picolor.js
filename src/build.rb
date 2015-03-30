# Sources that get run through closure
sources = %w(
	picolor.js
)

filename = "picolor.min.js"
java = 'java'
qsources = sources.map { |s| '"' + s + '"' }
src = "--js " + qsources.join(" --js ")
`#{java} -jar build/closure.jar --compilation_level SIMPLE_OPTIMIZATIONS --formatting pretty_print #{src} --js_output_file #{filename}`
